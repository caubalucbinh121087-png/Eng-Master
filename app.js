(() => {
"use strict";
const DATA = window.ENGLISH_MASTER_DATA || {};
const WEEKLY = Array.isArray(window.ENGLISH_MASTER_WEEKLY) ? window.ENGLISH_MASTER_WEEKLY : [];
const $ = id => document.getElementById(id);
const KEYS = {progress:"englishMasterFullCourse_v1", vocab:"englishMasterVocabulary_v1", listens:"emFullListens"};
const safeRead = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
let progress = safeRead(KEYS.progress, {});
let vocabulary = safeRead(KEYS.vocab, []);
let listenCount = Number(localStorage.getItem(KEYS.listens) || 0);
let currentView = "home", currentCourse = null, currentItems = [], currentIndex = 0, speed = 1, voice = null, lastAnswer = false;
const grammar = Array.isArray(DATA.tenses) ? DATA.tenses : [];
const daily = Array.isArray(DATA.daily) ? DATA.daily : [];
const work = Array.isArray(DATA.work) ? DATA.work : [];
const allCourses = [...grammar.map(x=>({...x,type:"grammar",level:"ALL"})), ...daily, ...work, ...WEEKLY];
function courseId(c){return String(c.id || c.title || "course");}
function courseItems(c){return Array.isArray(c.items)?c.items:[];}
function completed(){return Object.values(progress).filter(x=>x && x.done).length;}
function accuracy(){const rows=Object.values(progress).filter(x=>x && typeof x.accuracy==="number");return rows.length?Math.round(rows.reduce((a,b)=>a+b.accuracy,0)/rows.length)+"%":"—";}
function save(){localStorage.setItem(KEYS.progress,JSON.stringify(progress));localStorage.setItem(KEYS.vocab,JSON.stringify(vocabulary));localStorage.setItem(KEYS.listens,String(listenCount));}
function toast(s){$("toast").textContent=s;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2200);}
function setView(view,title){currentView=view;["home","catalog","lesson","vocab","progress"].forEach(v=>$(v+"View").classList.toggle("hidden",v!==view));document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.view===view));$("pageTitle").textContent=title;window.scrollTo(0,0);}
function countItems(c){return courseItems(c).length;}
function card(c){const count=countItems(c), level=c.level||"Grammar";return `<article class="course-card" data-course="${encodeURIComponent(courseId(c))}"><div class="icon">${c.icon||"📘"}</div><h3>${esc(c.title||"Untitled")}</h3><p>${esc(c.note||c.subtitle||"Listening & Dictation · Luyện tập tiếng Anh")}</p><div class="meta"><span>${esc(level)}</span><span>${count} câu →</span></div></article>`;}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function renderHome(){
 $("courseSummary").textContent=`${DATA.meta?.total||"—"} câu thực hành · ${grammar.length} thì tiếng Anh · ${daily.length} chủ đề giao tiếp · ${work.length} chủ đề công việc.`;
 $("homeCards").innerHTML=[{title:"12 thì tiếng Anh",icon:"📘",id:"grammar-home",note:"Công thức, cách dùng và bài luyện nghe",items:grammar,level:"Grammar",section:"grammar"},{title:"Giao tiếp hàng ngày",icon:"🎧",id:"daily-home",note:"Các tình huống giao tiếp thực tế",items:daily,level:"A1–B1",section:"daily"},{title:"English for Work",icon:"💼",id:"work-home",note:"Tiếng Anh công sở và môi trường làm việc",items:work,level:"A1–B1",section:"work"}].map(c=>card(c).replace('data-course="'+encodeURIComponent(courseId(c))+'"','data-section="'+c.section+'"')).join("");
 $("weeklyCards").innerHTML=WEEKLY.length?WEEKLY.map(card).join(""):`<div class="course-card"><h3>Chưa có bài học tuần mới</h3><p>Khi GitHub Actions publish nội dung mới, bài học sẽ xuất hiện tại đây.</p></div>`;
 $("points").textContent=completed()*10;$("doneCount").textContent=completed();$("accuracy").textContent=accuracy();$("listenCount").textContent=listenCount;
}
function renderSidebar(){const list=[...grammar.slice(0,6),...daily.slice(0,2),...work.slice(0,2)];$("sideCourses").innerHTML=list.map(c=>`<button class="side-course" data-course="${encodeURIComponent(courseId(c))}">${esc(c.title)}</button>`).join("");}
function catalog(type){let arr=type==="grammar"?grammar:type==="daily"?daily:type==="work"?work:WEEKLY;currentItems=arr;const titles={grammar:"12 thì tiếng Anh",daily:"Giao tiếp hàng ngày",work:"English for Work"}; $("catalogTitle").textContent=titles[type]||"Bài học mới";$("catalogDesc").textContent=`${arr.length} chủ đề · Chọn bài học để bắt đầu.`;$("searchInput").value="";$("levelSelect").value="all";renderCatalog();setView("catalog",titles[type]||"Bài học mới");}
function renderCatalog(){const q=$("searchInput").value.toLowerCase(),lev=$("levelSelect").value;const arr=currentItems.filter(c=>(c.title||"").toLowerCase().includes(q)|| (c.note||"").toLowerCase().includes(q)).filter(c=>lev==="all"||!c.level||c.level===lev);$("catalogCards").innerHTML=arr.length?arr.map(card).join(""):"<p>Không tìm thấy chủ đề phù hợp.</p>";}
function openCourse(id){const c=allCourses.find(x=>courseId(x)===id);if(!c)return;currentCourse=c;currentItems=courseItems(c);currentIndex=0;renderQuestion();setView("lesson",c.title||"Bài học");}
function itemKey(){return `${courseId(currentCourse)}::${currentIndex}`;}
function renderQuestion(){
 const item=currentItems[currentIndex]||{};const c=currentCourse||{};const key=itemKey();const state=progress[key]||{};
 $("lessonEyebrow").textContent=(c.type==="work"?"WORKPLACE ENGLISH":c.type==="conversation"||c.track==="daily"?"DAILY CONVERSATION":"ENGLISH GRAMMAR")+" · "+(c.level||"ALL");
 $("lessonTitle").textContent=c.title||"Lesson";$("lessonSub").textContent=c.subtitle||"Listening & Dictation · Nghe và gõ lại";$("lessonLevel").textContent=c.level||"GRAMMAR";
 $("translation").textContent=item.vi||"Bản dịch tiếng Việt chưa có."; $("audioTitle").textContent=`Sentence ${String(currentIndex+1).padStart(2,"0")}`;$("audioStatus").textContent="English voice · Ready to play";
 $("answerInput").value="";$("charCount").textContent="0 characters";$("feedback").className="feedback hidden";$("hintBox").classList.add("hidden");$("afterCheck").classList.add("hidden");$("checkBtn").parentElement.classList.remove("hidden");lastAnswer=false;
 const total=currentItems.length||1, pct=Math.round(currentIndex/total*100);$("qCounter").textContent=`Question ${currentIndex+1} of ${total}`;$("qPercent").textContent=pct+"% completed";$("qBar").style.width=pct+"%";$("lessonProgress").textContent=pct+"%";
 $("sideCount").textContent=`${currentIndex+1}/${total}`;$("questionGrid").innerHTML=currentItems.map((_,i)=>`<button class="q-btn ${i===currentIndex?"current":progress[`${courseId(c)}::${i}`]?.done?"done":""}" data-q="${i}">${i+1}</button>`).join("");
 $("grammarNote").textContent=c.note||"Chú ý cấu trúc câu, cách dùng từ và luyện nghe nhiều lần.";$("formula").textContent=c.formula||"Useful phrases in context";$("examples").innerHTML=(c.items||[]).slice(0,3).map(x=>`<li>${esc(x.en)}</li>`).join("");
}
function speak(){const text=currentItems[currentIndex]?.en;if(!text)return;if(!("speechSynthesis"in window)){toast("Trình duyệt không hỗ trợ đọc văn bản.");return;}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="en-GB";u.rate=speed;const voices=speechSynthesis.getVoices();const chosen=voices.find(v=>v.name===$("voiceSelect").value)||voices.find(v=>/^en-GB/i.test(v.lang))||voices.find(v=>/^en/i.test(v.lang));if(chosen)u.voice=chosen;speechSynthesis.speak(u);listenCount++;save();$("listenCount").textContent=listenCount;$("audioStatus").textContent="Audio is playing…";}
function loadVoices(){if(!("speechSynthesis"in window))return;const vs=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));$("voiceSelect").innerHTML='<option value="">Tự động chọn English voice</option>'+vs.map(v=>`<option value="${esc(v.name)}">${esc(v.name)} (${esc(v.lang)})</option>`).join("");}
function normalize(s){return String(s||"").toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9'\s]/g," ").replace(/\s+/g," ").trim();}
function check(){const expected=normalize(currentItems[currentIndex]?.en),actual=normalize($("answerInput").value);if(!actual){toast("Bạn hãy nhập câu trả lời trước nhé.");return;}const ok=expected===actual;const key=itemKey();progress[key]={...(progress[key]||{}),done:ok||!!progress[key]?.done,accuracy:ok?100:0,answer:$("answerInput").value,updated:new Date().toISOString()};save();lastAnswer=true;$("feedback").className="feedback "+(ok?"good":"bad");$("feedback").innerHTML=ok?`<b>Excellent! Chính xác 🎉</b><p>${esc(currentItems[currentIndex].en)}</p><button class="text-btn" id="saveSentence">Lưu từ vựng</button>`:`<b>Chưa chính xác, hãy thử lại nhé.</b><p>Đáp án đúng: <strong>${esc(currentItems[currentIndex].en)}</strong></p><p>${esc(currentItems[currentIndex].explain||"Nghe lại và chú ý các từ khóa.")}</p><button class="text-btn" id="saveSentence">Lưu từ vựng</button>`;$("feedback").classList.remove("hidden");$("checkBtn").parentElement.classList.add("hidden");$("afterCheck").classList.remove("hidden");$("saveSentence").onclick=()=>saveWords(currentItems[currentIndex].en);renderQuestionListOnly();renderHome();}
function renderQuestionListOnly(){const total=currentItems.length||1,done=currentItems.filter((_,i)=>progress[`${courseId(currentCourse)}::${i}`]?.done).length;$("sideCount").textContent=`${done}/${total}`;$("questionGrid").innerHTML=currentItems.map((_,i)=>`<button class="q-btn ${i===currentIndex?"current":progress[`${courseId(currentCourse)}::${i}`]?.done?"done":""}" data-q="${i}">${i+1}</button>`).join("");}
function saveWords(sentence){const words=sentence.split(/\s+/).filter(w=>w.length>3);words.forEach(w=>{if(!vocabulary.some(x=>x.word.toLowerCase()===w.toLowerCase()))vocabulary.push({word:w,meaning:"",example:sentence,added:new Date().toISOString()});});save();toast("Đã lưu từ vào sổ từ vựng.");}
function showHint(){const words=(currentItems[currentIndex]?.en||"").split(" ");$("hintBox").textContent=`Gợi ý: ${words.length} từ · Bắt đầu bằng “${words[0]||""}” · Ký tự đầu: ${words.map(w=>w[0]).join(" ")}`;$("hintBox").classList.remove("hidden");}
function next(){if(currentIndex<currentItems.length-1){currentIndex++;renderQuestion();}else{toast("Bạn đã hoàn thành bài học!");setView("catalog",currentCourse.title);}}
function renderVocab(){const q=$("vocabSearch").value.toLowerCase();const list=vocabulary.filter(x=>(x.word||"").toLowerCase().includes(q));$("vocabList").innerHTML=list.length?list.map(x=>`<div class="vocab-item"><b>${esc(x.word)}</b><span>${esc(x.meaning||"Chưa có nghĩa")}</span><p>${esc(x.example||"")}</p></div>`).join(""):"<p>Chưa có từ vựng được lưu.</p>";}
function renderProgress(){$("pDone").textContent=completed();$("pAccuracy").textContent=accuracy();$("pPoints").textContent=completed()*10;$("progressCourses").innerHTML=[...grammar,...daily,...work,...WEEKLY].map(c=>{const n=courseItems(c).length,d=courseItems(c).filter((_,i)=>progress[`${courseId(c)}::${i}`]?.done).length;return `<div class="progress-item"><span>${esc(c.title)}</span><b>${d}/${n}</b></div>`}).join("");}
document.addEventListener("click",e=>{const nav=e.target.closest(".nav");if(nav){const v=nav.dataset.view;if(v==="home"){setView("home","Xin chào! Sẵn sàng học hôm nay?");}else if(v==="grammar"||v==="daily"||v==="work"){catalog(v);}else if(v==="progress"){renderProgress();setView("progress","Tiến độ học tập");}else if(v==="vocab"){renderVocab();setView("vocab","Sổ từ vựng");}return;}
 const section=e.target.closest("[data-section]");if(section){catalog(section.dataset.section);return;}const c=e.target.closest("[data-course]");if(c){openCourse(decodeURIComponent(c.dataset.course));return;}const q=e.target.closest("[data-q]");if(q){currentIndex=Number(q.dataset.q);renderQuestion();return;}});
$("searchInput").addEventListener("input",renderCatalog);$("levelSelect").addEventListener("change",renderCatalog);
$("playBtn").onclick=speak;$("replayBtn").onclick=speak;$("testAudio").onclick=()=>{const old=currentItems[currentIndex]?.en;speechSynthesis.speak(new SpeechSynthesisUtterance("This is an English voice test."));};
$("checkBtn").onclick=check;$("showBtn").onclick=()=>{$("feedback").className="feedback good";$("feedback").textContent="Đáp án: "+(currentItems[currentIndex]?.en||"");$("feedback").classList.remove("hidden");$("checkBtn").parentElement.classList.add("hidden");$("afterCheck").classList.remove("hidden");};
$("nextBtn").onclick=next;$("retryBtn").onclick=()=>renderQuestion();$("hintBtn").onclick=showHint;
$("answerInput").addEventListener("input",()=>{$("charCount").textContent=$("answerInput").value.length+" characters";});$("answerInput").addEventListener("keydown",e=>{if(e.ctrlKey&&e.key==="Enter")check();});
document.querySelectorAll(".speed").forEach(b=>b.onclick=()=>{speed=Number(b.dataset.speed);document.querySelectorAll(".speed").forEach(x=>x.classList.toggle("active",x===b));});
$("continueBtn").onclick=()=>{const c=daily[0]||work[0]||grammar[0];if(c)openCourse(courseId(c));};
$("menuBtn").onclick=()=>$("sidebar").classList.toggle("open");
$("vocabSearch").addEventListener("input",renderVocab);
$("exportVocab").onclick=()=>{const rows=[["Word","Meaning","Example"],...vocabulary.map(x=>[x.word,x.meaning,x.example])];const csv=rows.map(r=>r.map(v=>'"'+String(v||"").replace(/"/g,'""')+'"').join(",")).join("\r\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));a.download="english-master-vocabulary.csv";a.click();URL.revokeObjectURL(a.href);};
if("speechSynthesis"in window){loadVoices();speechSynthesis.onvoiceschanged=loadVoices;}
renderHome();renderSidebar();
if(!DATA.tenses||!DATA.daily||!DATA.work){toast("Không đọc được course-data.js. Hãy giữ file dữ liệu gốc cùng thư mục index.html.");}
})();