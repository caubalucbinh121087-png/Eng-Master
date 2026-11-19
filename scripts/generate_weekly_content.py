#!/usr/bin/env python3
"""Generate and quality-check 50 original bilingual English-learning prompts per ISO week."""

from __future__ import annotations
import difflib
import datetime as dt
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_DATA = ROOT / "course-data.js"
ARCHIVE = ROOT / "content" / "weekly-lessons.json"
OUTPUT_JS = ROOT / "weekly-content.js"
API_URL = "https://api.openai.com/v1/responses"
MODEL = os.getenv("OPENAI_MODEL", "gpt-6.2-astra")
API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
SOURCE_REFERENCES = [
    {"name": "British Council LearnEnglish", "url": "https://learnenglish.britishcouncil.org/"},
    {"name": "VOA Learning English", "url": "https://learningenglish.voanews.com/"},
    {"name": "Cambridge English – Activities for Learners", "url": "https://www.cambridgeenglish.org/learning-english/activities-for-learners/"},
]

ITEM_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "track": {"type": "string", "enum": ["daily", "work"]},
        "level": {"type": "string", "enum": ["A1", "A2", "B1"]},
        "topic": {"type": "string"},
        "en": {"type": "string"},
        "vi": {"type": "string"},
        "explain": {"type": "string"},
    },
    "required": ["track", "level", "topic", "en", "vi", "explain"],
}
GEN_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {"items": {"type": "array", "items": ITEM_SCHEMA}},
    "required": ["items"],
}
REVIEW_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "approved": {"type": "boolean"},
        "issues": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["approved", "issues"],
}

def normalize(text: str) -> str:
    text = text.lower().replace("’", "'")
    return re.sub(r"[^a-z0-9']+", " ", text).strip()

def sha(text: str) -> str:
    return hashlib.sha256(normalize(text).encode("utf-8")).hexdigest()

def api_call(payload: dict) -> dict:
    if not API_KEY:
        raise RuntimeError("Missing OPENAI_API_KEY. Add it in GitHub repository Settings → Secrets and variables → Actions.")
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "EnglishMaster-WeeklyContent/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=240) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:1500]
        raise RuntimeError(f"OpenAI API returned HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Could not connect to OpenAI API: {exc}") from exc

def output_text(response: dict) -> str:
    if isinstance(response.get("output_text"), str):
        return response["output_text"]
    chunks = []
    for item in response.get("output", []):
        if item.get("type") == "message":
            for part in item.get("content", []):
                if part.get("type") in ("output_text", "text") and isinstance(part.get("text"), str):
                    chunks.append(part["text"])
    if not chunks:
        raise RuntimeError("The model response did not contain structured text output.")
    return "\n".join(chunks)

def parse_base_sentences() -> list[str]:
    raw = BASE_DATA.read_text(encoding="utf-8")
    match = re.search(r"window\.ENGLISH_MASTER_DATA\s*=\s*(\{.*\})\s*;?\s*$", raw, re.S)
    if not match:
        raise RuntimeError("Could not parse the existing course-data.js file.")
    data = json.loads(match.group(1))
    sentences = []
    for group in ("tenses", "daily", "work"):
        for module in data.get(group, []):
            for item in module.get("items", []):
                if item.get("en"):
                    sentences.append(item["en"])
    return sentences

def load_archive() -> dict:
    if not ARCHIVE.exists():
        return {"weeks": []}
    try:
        data = json.loads(ARCHIVE.read_text(encoding="utf-8"))
        if not isinstance(data.get("weeks"), list):
            raise ValueError("weeks must be a list")
        return data
    except Exception as exc:
        raise RuntimeError(f"Could not read weekly archive: {exc}") from exc

def existing_sentences(base_sentences: list[str], archive: dict) -> list[str]:
    values = list(base_sentences)
    for week in archive["weeks"]:
        for module in week.get("modules", []):
            values.extend(item.get("en", "") for item in module.get("items", []))
    return [x for x in values if x]

def prompt_for_generation(week_id: str, duplicate_examples: list[str]) -> str:
    dup_text = "\n".join(f"- {x}" for x in duplicate_examples[:100])
    return f"""
Create exactly 50 ORIGINAL English-learning dictation prompts for English Master, publication batch {week_id}.

RESEARCH FIRST: use your web search tool to consult the public learning frameworks and topic/activity categories on:
- British Council LearnEnglish: https://learnenglish.britishcouncil.org/
- VOA Learning English: https://learningenglish.voanews.com/
- Cambridge English learner activities: https://www.cambridgeenglish.org/learning-english/activities-for-learners/

Use these sources for curriculum inspiration, practical situations, and CEFR-appropriate learning progression only. Do NOT copy sentences, dialogues, exercises, explanations, or audio scripts from those sites. Write original sentences from scratch.

OUTPUT DISTRIBUTION (exact):
- 25 items with track="daily" (everyday spoken English)
- 25 items with track="work" (professional communication and practical workplace English, including IT/network support)
- Within EACH track: exactly 8 A1, 9 A2, and 8 B1 items.
- At least 6 distinct topic labels per track.
- Do not create grammar-only drills; focus on natural usable sentences and short practical expressions.

CEFR guidance:
A1: short, familiar, concrete expressions; simple present/past, basic requests, personal details.
A2: routine exchanges, travel, shopping, plans, work updates, simple explanations.
B1: connected explanations, opinions, problem-solving, project updates, polite disagreement, troubleshooting.

For every item provide:
- track: "daily" or "work"
- level: "A1", "A2", or "B1"
- topic: short reusable topic label (e.g. "At a café", "Project updates", "Network troubleshooting")
- en: one natural, complete English sentence or question
- vi: accurate, natural Vietnamese translation (preserve the intended meaning)
- explain: concise Vietnamese learning note explaining useful phrase, grammar, tone, or context

QUALITY REQUIREMENTS:
- English must sound natural, modern, and appropriate to the specified CEFR level.
- Prefer varied sentence patterns and real communicative intent. Avoid robotic repetitions.
- Include positive, negative, and question forms where appropriate.
- Avoid overly specific facts, sensitive personal data, stereotypes, slang that is hard to understand, and copyrighted quotations.
- Sentences should usually contain 5–20 words, with correct punctuation.
- Vietnamese must be a real translation, not a word-for-word unnatural gloss.
- Every item must be unique and not a minor rewrite of any existing sentence below.
- Do not use any of these existing examples or near-copies:
{dup_text}

Return only the requested structured JSON object. No markdown.
""".strip()

def validate_items(items: list, existing: list[str]) -> list[str]:
    issues = []
    if len(items) != 50:
        issues.append(f"Expected exactly 50 items, received {len(items)}.")
        return issues
    counts = Counter((x.get("track"), x.get("level")) for x in items)
    expected = {
        ("daily", "A1"): 8, ("daily", "A2"): 9, ("daily", "B1"): 8,
        ("work", "A1"): 8, ("work", "A2"): 9, ("work", "B1"): 8,
    }
    for key, amount in expected.items():
        if counts[key] != amount:
            issues.append(f"{key[0]} {key[1]} must have {amount} items, found {counts[key]}.")
    for track in ("daily", "work"):
        topics = {x.get("topic", "").strip().lower() for x in items if x.get("track") == track}
        if len(topics) < 6:
            issues.append(f"{track} needs at least 6 distinct topics; found {len(topics)}.")
    seen = set()
    seen_norm = []
    old_norm = [(normalize(s), s) for s in existing]
    for i, item in enumerate(items, 1):
        for field in ("track", "level", "topic", "en", "vi", "explain"):
            if not isinstance(item.get(field), str) or not item[field].strip():
                issues.append(f"Item {i}: missing or empty {field}.")
        if issues and len(issues) > 80:
            break
        en = item.get("en", "").strip()
        vi = item.get("vi", "").strip()
        if item.get("track") not in ("daily", "work") or item.get("level") not in ("A1", "A2", "B1"):
            issues.append(f"Item {i}: invalid track or level.")
        word_count = len(re.findall(r"\b[\w']+\b", en))
        if word_count < 4 or word_count > 24:
            issues.append(f"Item {i}: English sentence length {word_count} is outside 4–24 words.")
        if en and en[0].islower():
            issues.append(f"Item {i}: English sentence should start with a capital letter.")
        if en and en[-1] not in ".?!":
            issues.append(f"Item {i}: English sentence must end with punctuation.")
        if vi and len(vi) < 5:
            issues.append(f"Item {i}: Vietnamese translation is too short.")
        n = normalize(en)
        if n in seen:
            issues.append(f"Item {i}: duplicate within this batch: {en}")
        elif any(min(len(n), len(prev)) >= 28 and difflib.SequenceMatcher(None, n, prev).ratio() >= 0.99 for prev in seen_norm):
            issues.append(f"Item {i}: near-duplicate within this batch: {en}")
        seen.add(n)
        seen_norm.append(n)
        # Exact and very-close duplicate detection against all existing course sentences.
        for old_n, old in old_norm:
            if n == old_n or (min(len(n), len(old_n)) >= 28 and difflib.SequenceMatcher(None, n, old_n).ratio() >= 0.99):
                issues.append(f"Item {i}: duplicate/near-duplicate of existing sentence: {old}")
                break
    return issues

def make_modules(items: list, week_id: str) -> list[dict]:
    year, week = week_id.split("-W")
    grouped = defaultdict(list)
    for item in items:
        grouped[(item["track"], item["level"])].append({
            "en": item["en"].strip(),
            "vi": item["vi"].strip(),
            "explain": item["explain"].strip(),
            "topic": item["topic"].strip(),
        })
    modules = []
    level_order = ("A1", "A2", "B1")
    for track in ("daily", "work"):
        for level in level_order:
            rows = grouped[(track, level)]
            track_name = "Daily Conversation" if track == "daily" else "English for Work"
            vi_name = "Giao tiếp hàng ngày" if track == "daily" else "Tiếng Anh công việc"
            modules.append({
                "id": f"weekly-{year}-w{week}-{track}-{level.lower()}",
                "title": f"New this week · {track_name} · {level}",
                "vi": f"Bài học mới hàng tuần · {vi_name}",
                "level": level,
                "track": track,
                "icon": "✨" if track == "daily" else "💼",
                "note": f"50 câu mới của tuần {week_id} được chia theo cấp độ. Đây là nội dung nguyên bản, tham khảo định hướng học tập CEFR.",
                "formula": "Useful phrases in context",
                "signals": "Listen · Understand · Repeat · Use",
                "items": rows,
            })
    return modules

def review_batch(items: list) -> None:
    compact = [{"track": x["track"], "level": x["level"], "topic": x["topic"], "en": x["en"], "vi": x["vi"], "explain": x["explain"]} for x in items]
    schema = REVIEW_SCHEMA
    payload = {
        "model": MODEL,
        "store": False,
        "input": [
            {"role": "system", "content": "You are a strict English-language teaching editor. Review bilingual learning prompts. Approve only if the English is natural and grammatical, Vietnamese accurately conveys the meaning, CEFR labels are plausible, explanations are useful, content is original, and there is no harmful or sensitive content. Be conservative. Return only the required JSON."},
            {"role": "user", "content": "Review all 50 items as one batch. If any material language, translation, level, repetition, or teaching-quality issue exists, set approved=false and list concise issues. Data:\n" + json.dumps(compact, ensure_ascii=False)},
        ],
        "text": {"format": {"type": "json_schema", "name": "weekly_content_review", "strict": True, "schema": schema}},
        "max_output_tokens": 2500,
    }
    response = api_call(payload)
    review = json.loads(output_text(response))
    if not review.get("approved"):
        raise RuntimeError("Independent content review did not approve this batch: " + "; ".join(review.get("issues", [])[:12]))

def main() -> int:
    if not API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not configured.")
    now = dt.datetime.now(dt.timezone.utc)
    iso = now.isocalendar()
    week_id = f"{iso.year}-W{iso.week:02d}"
    archive = load_archive()
    if any(w.get("week") == week_id for w in archive["weeks"]):
        print(f"{week_id} already exists. Skipping to prevent duplicate weekly publication.")
        return 0

    existing = existing_sentences(parse_base_sentences(), archive)
    stride = max(1, len(existing) // 120)
    duplicate_examples = existing[::stride][:120]
    items = None
    last_issues = []
    for attempt in range(1, 4):
        prompt = prompt_for_generation(week_id, duplicate_examples)
        if last_issues:
            prompt += "\n\nREGENERATION REQUIRED. Fix these validation issues and regenerate a fresh complete batch:\n" + "\n".join(last_issues[:30])
        payload = {
            "model": MODEL,
            "store": False,
            "tools": [{"type": "web_search"}],
            "input": [
                {"role": "system", "content": "You create original, accurate, bilingual English-learning content. Research public educational guidance with web search, but never copy source material. Follow the exact JSON schema and count."},
                {"role": "user", "content": prompt},
            ],
            "text": {"format": {"type": "json_schema", "name": "weekly_english_content", "strict": True, "schema": GEN_SCHEMA}},
            "max_output_tokens": 12000,
        }
        response = api_call(payload)
        generated = json.loads(output_text(response))
        candidate = generated.get("items", [])
        last_issues = validate_items(candidate, existing)
        if not last_issues:
            items = candidate
            break
        print(f"Attempt {attempt}: quality checks found {len(last_issues)} issue(s). Retrying.")
        time.sleep(2)
    if items is None:
        raise RuntimeError("Could not produce a valid 50-question batch after 3 attempts:\n" + "\n".join(last_issues[:40]))

    review_batch(items)
    modules = make_modules(items, week_id)
    week_record = {
        "week": week_id,
        "generated_at_utc": now.replace(microsecond=0).isoformat(),
        "model": MODEL,
        "count": len(items),
        "quality_review": "approved",
        "research_method": "OpenAI Responses API web_search; original wording, not copied source text",
        "curriculum_references": SOURCE_REFERENCES,
        "modules": modules,
    }
    archive["weeks"].append(week_record)
    ARCHIVE.parent.mkdir(parents=True, exist_ok=True)
    ARCHIVE.write_text(json.dumps(archive, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    all_modules = []
    for week in archive["weeks"]:
        all_modules.extend(week.get("modules", []))
    OUTPUT_JS.write_text(
        "// Generated automatically by GitHub Actions. Do not edit manually.\\n"
        "window.ENGLISH_MASTER_WEEKLY = " + json.dumps(all_modules, ensure_ascii=False, separators=(",", ":")) + ";\\n",
        encoding="utf-8",
    )
    # Version the weekly script URL so GitHub Pages/browser caches fetch the new batch.
    index_path = ROOT / "index.html"
    index_html = index_path.read_text(encoding="utf-8")
    index_html, changed = re.subn(r'weekly-content\.js\?v=[^"]+', f"weekly-content.js?v={week_id}", index_html, count=1)
    if changed != 1:
        raise RuntimeError("Could not update the weekly-content.js cache-busting version in index.html.")
    index_path.write_text(index_html, encoding="utf-8")
    print(f"Approved and prepared {len(items)} new prompts for {week_id}.")
    print(f"Archive now contains {len(archive['weeks'])} weekly batches ({sum(w.get('count', 0) for w in archive['weeks'])} prompts).")
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
