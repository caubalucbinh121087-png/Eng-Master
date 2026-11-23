/* English Master v8.0 learning modules. Existing course data and v1 progress keys are preserved. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const STORE = "englishMasterLearning_v2";
const AI_ENDPOINT_KEY = "englishMasterAIEndpoint_v1";
const read = (k,d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const state = read(STORE,{daily:{},reviews:{},mistakes:[],speaking:[],writing:[],settings:{}});
const save = () => localStorage.setItem(STORE,JSON.stringify(state));
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const courseData = window.ENGLISH_MASTER_DATA || {};
const courses = [...(courseData.tenses||[]),...(courseData.daily||[]),...(courseData.work||[])];
const allItems = courses.flatMap(c=>(c.items||[]).map(i=>({...i,course:c.title,level:c.level||"ALL"})));
const vocabKey="englishMasterVocabulary_v1", progressKey="englishMasterFullCourse_v1";
const vocab=()=>read(vocabKey,[]);
function title(h,p){return `<div class="section-head"><div><small>PERSONAL ENGLISH COACH</small><h2>${h}</h2><p>${p}</p></div></div>`;}
function setPage(view,label){
  ["home","catalog","lesson","vocab","progress","speaking","readingwriting","review","analytics","coach"].forEach(v=>{
    const el=$(v+"View"); if(el) el.classList.toggle("hidden",v!==view);
  });
  document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  $("pageTitle").textContent=label; window.scrollTo(0,0);
}
function todayKey(){return new Date().toISOString().slice(0,10);}
function dailyPlan(){
 document.querySelectorAll(".emx-home").forEach(el=>el.remove());
 const tasks=[["Speaking Practice",8,"Nói theo mẫu và trả lời câu hỏi"],["Listening",6,"Nghe câu và luyện dictation"],["Vocabulary Review",5,"Ôn từ đã lưu và từ đến hạn"],["Grammar",4,"Ôn cấu trúc qua ví dụ"],["Reading",3,"Đọc đoạn văn và trả lời câu hỏi"],["Writing",4,"Viết câu ngắn và tự kiểm tra"]];
 const done=state.daily[todayKey()]||[];
 $("homeView").insertAdjacentHTML("afterbegin",`<div class="emx-home">${title("Today's Learning","Lộ trình cá nhân hóa · 30 phút mỗi ngày")}
 <div class="emx-mission"><div><strong>${done.length}/6</strong><span> hoạt động hoàn thành</span></div><div class="emx-track"><i style="width:${done.length/6*100}%"></i></div><p>Speaking được ưu tiên, đồng thời duy trì đủ sáu kỹ năng.</p></div>
 <div class="emx-task-list">${tasks.map((t,i)=>`<div class="emx-task"><div class="emx-num">${i+1}</div><div class="emx-task-main"><b>${t[0]}</b><small>${t[2]}</small></div><span>${t[1]} phút</span><button class="secondary emx-task-btn" data-task="${i}">${done.includes(i)?"Hoàn thành ✓":"Bắt đầu"}</button></div>`).join("")}</div>
 <p class="emx-note">Lịch học tự lưu theo ngày. Hoàn thành nhiệm vụ sau khi thực hành thực tế.</p></div>`);
 $("homeView").querySelectorAll("[data-task]").forEach(b=>b.onclick=()=>{const n=+b.dataset.task;const d=state.daily[todayKey()]||[];if(!d.includes(n))d.push(n);state.daily[todayKey()]=d;save();dailyPlan();});
}
function renderSpeaking(){
 const item=allItems[Math.floor(Math.random()*Math.max(1,allItems.length))]||{en:"I would like to improve my English speaking skills.",vi:"Tôi muốn cải thiện kỹ năng nói tiếng Anh."};
 $("speakingView").innerHTML=title("Speaking Coach","Luyện nói bằng microphone · nhận diện giọng nói trên trình duyệt")+
 `<div class="emx-grid"><article class="emx-card"><small>PRONUNCIATION WARM-UP</small><h3>Listen & Repeat</h3><p class="emx-prompt">${esc(item.en)}</p><p class="emx-translation">${esc(item.vi||"")}</p><div class="emx-actions"><button class="primary" id="spListen">▶ Nghe câu mẫu</button><button class="secondary" id="spStart">🎙 Bắt đầu nói</button><button class="secondary" id="spStop" disabled>Dừng</button></div><div id="spStatus" class="emx-status">Sẵn sàng luyện tập.</div><textarea id="spTranscript" rows="4" placeholder="Nội dung nhận diện giọng nói sẽ xuất hiện ở đây..."></textarea><div id="spFeedback" class="emx-feedback">Sau khi nói, bạn sẽ thấy phần so sánh nội dung.</div><button class="secondary" id="spSave">Lưu buổi luyện nói</button></article>
 <article class="emx-card"><small>OPEN SPEAKING</small><h3>Trả lời bằng lời nói</h3><p>Describe your typical working day. What do you usually do first in the morning?</p><p class="emx-note">Gợi ý: trả lời 3–5 câu. Cố gắng dùng Present Simple và từ nối như first, then, usually, finally.</p><div class="emx-actions"><button class="secondary" id="spOpenStart">🎙 Ghi nhận câu trả lời</button><button class="secondary" id="spOpenStop" disabled>Dừng</button></div><textarea id="spOpenText" rows="4" placeholder="Your spoken answer..."></textarea></article></div>
 <p class="emx-note">Giới hạn: nhận diện giọng nói phụ thuộc trình duyệt, ngôn ngữ và quyền microphone. Đây là phản hồi về nội dung/transcript, chưa phải chấm điểm âm vị, trọng âm hoặc ngữ điệu chuyên sâu.</p>`;
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 let rec=null,activeTarget=null;
 function start(target){if(!SR){$("spStatus").textContent="Trình duyệt này chưa hỗ trợ Speech Recognition. Hãy thử Edge hoặc Chrome.";return;}
   rec=new SR();rec.lang="en-US";rec.continuous=true;rec.interimResults=true;activeTarget=target;
   rec.onresult=e=>{let out="";for(let i=0;i<e.results.length;i++)out+=e.results[i][0].transcript+" ";$(target).value=out.trim();};
   rec.onerror=e=>$("spStatus").textContent="Lỗi nhận diện: "+e.error;
   rec.onend=()=>{$("spStatus").textContent="Đã dừng nhận diện.";compare();};
   rec.start();$("spStatus").textContent="Đang nghe... hãy nói tiếng Anh."; $("spStart").disabled=true;$("spStop").disabled=false;
 }
 function stop(){if(rec){rec.stop();rec=null;} $("spStart").disabled=false;$("spStop").disabled=true;}
 function compare(){const actual=$("spTranscript").value.trim();if(!actual)return;const expected=item.en.toLowerCase().replace(/[^a-z0-9 ]/g,"").split(/\s+/);const got=actual.toLowerCase().replace(/[^a-z0-9 ]/g,"").split(/\s+/);const missing=expected.filter(w=>!got.includes(w));const extra=got.filter(w=>!expected.includes(w));$("spFeedback").innerHTML=`<b>So sánh nội dung</b><p>${Math.round((expected.length-missing.length)/Math.max(1,expected.length)*100)}% từ mẫu được nhận diện</p><p>Từ/cụm có thể còn thiếu: ${esc(missing.join(", ")||"Không phát hiện")}</p><p>Từ bổ sung: ${esc(extra.join(", ")||"Không có")}</p><small>Đây là phép so sánh từ vựng đơn giản, không phải điểm phát âm.</small>`;}
 $("spListen").onclick=()=>{const u=new SpeechSynthesisUtterance(item.en);u.lang="en-GB";speechSynthesis.speak(u);};
 $("spStart").onclick=()=>start("spTranscript");$("spStop").onclick=stop;
 $("spOpenStart").onclick=()=>start("spOpenText");$("spOpenStop").onclick=stop;
 $("spSave").onclick=()=>{state.speaking.push({date:new Date().toISOString(),prompt:item.en,transcript:$("spTranscript").value});save();$("spStatus").textContent="Đã lưu lịch sử luyện nói.";};
}
function renderReadingWriting(){
 const passages=[
  {title:"A Productive Workday",level:"A2",text:"I usually arrive at the office at eight thirty. First, I check my emails and review my tasks. Then I join the team meeting. In the afternoon, I work on network projects and help colleagues solve technical issues.",q:"What does the speaker do first at the office?",a:"check my emails"},
  {title:"Improving a Network Service",level:"B1",text:"When a network issue occurs, the IT team first identifies the affected users and services. They check monitoring data, review recent configuration changes, and communicate updates to stakeholders. After resolving the incident, the team documents the root cause and preventive actions.",q:"What should the team do after resolving the incident?",a:"documents the root cause"}
 ];
 const p=passages[Math.floor(Math.random()*passages.length)];
 $("readingwritingView").innerHTML=title("Reading & Writing","Đọc hiểu ngắn và luyện viết chủ động")+
 `<div class="emx-grid"><article class="emx-card"><small>READING · ${p.level}</small><h3>${p.title}</h3><p class="emx-reading">${p.text}</p><b>${p.q}</b><input id="rwAnswer" placeholder="Write your answer in English"><button class="primary" id="rwCheck">Kiểm tra</button><div id="rwResult" class="emx-feedback"></div></article>
 <article class="emx-card"><small>WRITING PRACTICE</small><h3>Write about your work</h3><p>Write 4–6 sentences about a task you completed recently. Include what happened, what you did and the result.</p><textarea id="rwText" rows="7" placeholder="Last week, I..."></textarea><div class="emx-actions"><button class="primary" id="rwReview">Tự kiểm tra bài viết</button><button class="secondary" id="rwSave">Lưu bài viết</button></div><div id="rwFeedback" class="emx-feedback">Phản hồi cơ bản: độ dài, câu, dấu câu và một số lỗi phổ biến.</div></article></div>`;
 $("rwCheck").onclick=()=>{$("rwResult").textContent=$("rwAnswer").value.toLowerCase().includes(p.a)?"Good job! Câu trả lời có ý chính phù hợp.":"Hãy đọc lại đoạn văn và tìm thông tin sau hành động cuối cùng.";};
 $("rwReview").onclick=()=>{const t=$("rwText").value.trim(),sent=t.split(/[.!?]+/).filter(x=>x.trim());let notes=[];if(!t)notes.push("Bạn chưa nhập nội dung.");if(sent.length<4)notes.push("Thử viết ít nhất 4 câu.");if(t&&!/[.!?]$/.test(t))notes.push("Thêm dấu câu kết thúc.");if(/\bi\b/.test(t))notes.push("Đại từ I luôn viết hoa.");if(/\b(he|she|it)\s+(work|go|do|have)\b/i.test(t))notes.push("Kiểm tra động từ ngôi thứ ba số ít.");if(sent.length>=4)notes.push("Độ dài đạt yêu cầu cơ bản.");$("rwFeedback").innerHTML=notes.map(x=>`<p>• ${esc(x)}</p>`).join("");};
 $("rwSave").onclick=()=>{state.writing.push({date:new Date().toISOString(),text:$("rwText").value});save();$("rwFeedback").textContent="Đã lưu bài viết vào lịch sử.";};
}
function renderReview(){
 const words=vocab(),now=Date.now();
 const due=words.filter(w=>{const r=state.reviews[(w.word||"").toLowerCase()];return !r||!r.next||new Date(r.next).getTime()<=now;});
 const list=due.slice(0,20);
 $("reviewView").innerHTML=title("Smart Review","Ôn từ vựng theo lịch lặp lại ngắt quãng")+
 `<div class="emx-card"><div class="emx-review-head"><div><small>WORDS DUE TODAY</small><h2>${list.length}</h2></div><span>1 · 3 · 7 · 14 · 30 ngày</span></div><div id="reviewCards">${list.length?list.map((w,i)=>`<div class="emx-review-card"><b>${esc(w.word)}</b><p>${esc(w.meaning||"Hãy tự nhớ nghĩa trước khi xem ví dụ.")}</p><small>${esc(w.example||"")}</small><div class="emx-actions"><button class="secondary" data-grade="${i}-again">Chưa nhớ</button><button class="primary" data-grade="${i}-good">Đã nhớ</button></div></div>`).join(""):"<p>Chưa có từ đến hạn. Hãy lưu từ trong bài học để bắt đầu ôn tập.</p>"}</div></div>`;
 $("reviewCards").querySelectorAll("[data-grade]").forEach(b=>b.onclick=()=>{const [i,g]=b.dataset.grade.split("-"),w=list[+i],key=(w.word||"").toLowerCase(),old=state.reviews[key]||{stage:0};const stage=g==="good"?Math.min(4,(old.stage||0)+1):0;const days=[1,3,7,14,30];state.reviews[key]={stage,next:new Date(Date.now()+days[stage]*86400000).toISOString(),last:g};save();renderReview();});
}
function renderAnalytics(){
 const prog=read(progressKey,{}),rows=Object.values(prog),done=rows.filter(x=>x&&x.done).length,acc=rows.filter(x=>typeof x.accuracy==="number");
 const score=acc.length?Math.round(acc.reduce((a,x)=>a+x.accuracy,0)/acc.length):0;
 const skills=[["Speaking",state.speaking.length?Math.min(100,state.speaking.length*8):0],["Listening",Math.min(100,done*2)],["Vocabulary",Math.min(100,vocab().length*3)],["Grammar",Math.min(100,rows.length?score:0)],["Reading",Math.min(100,state.writing.length*8)],["Writing",Math.min(100,state.writing.length*10)]];
 $("analyticsView").innerHTML=title("Skill Analytics","Theo dõi hoạt động và tiến bộ học tập")+
 `<div class="emx-stats"><div><small>Đã hoàn thành</small><b>${done}</b></div><div><small>Độ chính xác hiện có</small><b>${acc.length?score+"%":"—"}</b></div><div><small>Từ đã lưu</small><b>${vocab().length}</b></div><div><small>Buổi luyện nói</small><b>${state.speaking.length}</b></div></div><div class="emx-card"><h3>Learning activity by skill</h3>${skills.map(s=>`<div class="emx-skill"><span>${s[0]}</span><div class="emx-track"><i style="width:${s[1]}%"></i></div><b>${s[1]}%</b></div>`).join("")}<p class="emx-note">Các chỉ số hiện phản ánh hoạt động luyện tập và dữ liệu có sẵn, chưa phải bài kiểm tra chuẩn hóa năng lực CEFR.</p></div>`;
}
async function renderCoach(){
 $("coachView").innerHTML=title("AI Learning Coach","Nhận gợi ý học tập và phân tích bài viết qua Gemini backend")+
 `<div class="emx-card"><h3>Learning Coach</h3><p>Nhập bài viết hoặc câu hỏi tiếng Anh. Backend Gemini sẽ phản hồi bằng tiếng Việt, giải thích lỗi và gợi ý cách diễn đạt tự nhiên hơn.</p><label>Backend endpoint (Cloud Run URL)</label><input id="aiEndpoint" placeholder="https://your-cloud-run-service-url" value="${esc(localStorage.getItem(AI_ENDPOINT_KEY)||"")}"><textarea id="aiInput" rows="6" placeholder="Paste your English writing or ask a learning question..."></textarea><button class="primary" id="aiAsk">Phân tích với AI</button><div id="aiResult" class="emx-feedback">Chưa gửi yêu cầu.</div></div><p class="emx-note">Không nhập thông tin mật hoặc dữ liệu nội bộ công ty. API key Gemini chỉ được lưu trong Google Secret Manager, không đặt trong GitHub Pages.</p>`;
 $("aiAsk").onclick=async()=>{const endpoint=$("aiEndpoint").value.trim(),text=$("aiInput").value.trim();if(!endpoint||!text){$("aiResult").textContent="Hãy nhập Cloud Run URL và nội dung cần phân tích.";return;}localStorage.setItem(AI_ENDPOINT_KEY,endpoint);$("aiResult").textContent="Đang phân tích...";try{const r=await fetch(endpoint.replace(/\/$/,"")+"/coach",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text,task:"correct_and_coach"})});const data=await r.json();if(!r.ok)throw new Error(data.error||"Backend error");$("aiResult").innerHTML=`<b>Phản hồi của AI</b><p>${esc(data.reply||"Không có phản hồi.")}</p>`;}catch(e){$("aiResult").textContent="Không kết nối được AI backend: "+e.message+". Kiểm tra Cloud Run service và cấu hình Gemini Secret Manager.";}}
}
function renderAll(){dailyPlan();renderSpeaking();renderReadingWriting();renderReview();renderAnalytics();renderCoach();}
document.addEventListener("click",e=>{const b=e.target.closest(".nav");if(!b)return;const v=b.dataset.view;if(["speaking","readingwriting","review","analytics","coach"].includes(v)){const labels={speaking:"Speaking Coach",readingwriting:"Reading & Writing",review:"Ôn tập thông minh",analytics:"Skill Analytics",coach:"AI Learning Coach"};setPage(v,labels[v]);}});
document.addEventListener("DOMContentLoaded",renderAll);
renderAll();
})();
