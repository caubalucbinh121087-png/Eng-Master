const lessons = [
 {text:"I watched TV last night.",vi:"Tối qua tôi đã xem TV.",hint:"The verb is regular. It ends in -ed.",explain:"Watch là động từ có quy tắc: watch → watched. Dùng Past Simple vì hành động xảy ra last night."},
 {text:"She visited her parents yesterday.",vi:"Hôm qua cô ấy đã đến thăm bố mẹ.",hint:"Look for a regular verb ending in -ed.",explain:"Visit → visited. Với động từ tận cùng bằng phụ âm + y hoặc các trường hợp thông thường, thêm -ed."},
 {text:"We went to Hue last weekend.",vi:"Cuối tuần trước chúng tôi đã đến Huế.",hint:"Go is an irregular verb. Its past form starts with W.",explain:"Go → went là động từ bất quy tắc. Không dùng goed. Last weekend cho biết thời điểm trong quá khứ."},
 {text:"He didn't go to work yesterday.",vi:"Hôm qua anh ấy đã không đi làm.",hint:"After didn't, use the base form of the verb.",explain:"Câu phủ định Past Simple: S + didn't + V nguyên mẫu. Vì vậy dùng didn't go, không dùng didn't went."},
 {text:"Did you watch the movie?",vi:"Bạn đã xem bộ phim đó chưa?",hint:"A Past Simple question starts with Did.",explain:"Câu hỏi Past Simple: Did + S + V nguyên mẫu? Không dùng Did you watched."},
 {text:"I bought a new laptop last week.",vi:"Tuần trước tôi đã mua một chiếc máy tính xách tay mới.",hint:"Buy is irregular. The past form rhymes with 'caught'.",explain:"Buy → bought là động từ bất quy tắc. Last week là dấu hiệu thường gặp của Past Simple."},
 {text:"They were at the party last night.",vi:"Tối qua họ đã ở bữa tiệc.",hint:"The past form of 'are' is used with they.",explain:"To be ở quá khứ: am/is → was; are → were. Với chủ ngữ they, dùng were."},
 {text:"Where did you go yesterday?",vi:"Hôm qua bạn đã đi đâu?",hint:"The question word comes before did.",explain:"Cấu trúc: Wh-word + did + S + V nguyên mẫu? Go giữ nguyên sau did."},
 {text:"I didn't know about the meeting.",vi:"Tôi đã không biết về cuộc họp.",hint:"Know is irregular. In this sentence it follows didn't.",explain:"Know → knew ở câu khẳng định. Nhưng sau didn't phải dùng nguyên mẫu: didn't know."},
 {text:"We had a great time during our trip.",vi:"Chúng tôi đã có khoảng thời gian tuyệt vời trong chuyến đi.",hint:"Have is irregular. Its past form is a short word.",explain:"Have → had là động từ bất quy tắc. Cụm have a great time nghĩa là có khoảng thời gian vui vẻ."}
];

const $ = id => document.getElementById(id);
let current = 0, speed = 1, checked = false, listenCount = 0;
let results = JSON.parse(localStorage.getItem("emPastSimpleResults") || "{}");
let totalListens = Number(localStorage.getItem("emPastSimpleListens") || 0);
let selectedVoice = null;
let voices = [];

function normalize(s){return s.toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9']/g," ").replace(/\s+/g," ").trim();}
function tokens(s){return normalize(s).split(" ").filter(Boolean);}
function editDistance(a,b){
 const m=a.length,n=b.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
 for(let i=0;i<=m;i++)dp[i][0]=i; for(let j=0;j<=n;j++)dp[0][j]=j;
 for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
 return dp[m][n];
}
function alignWords(expected,actual){
 const m=expected.length,n=actual.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
 for(let i=0;i<=m;i++)dp[i][0]=i;for(let j=0;j<=n;j++)dp[0][j]=j;
 for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(expected[i-1]===actual[j-1]?0:1));
 let i=m,j=n,out=[];
 while(i||j){
  if(i&&j&&dp[i][j]===dp[i-1][j-1]+(expected[i-1]===actual[j-1]?0:1)){out.unshift({word:actual[j-1],type:expected[i-1]===actual[j-1]?"ok":"wrong",expected:expected[i-1]});i--;j--;}
  else if(j&&dp[i][j]===dp[i][j-1]+1){out.unshift({word:actual[j-1],type:"extra"});j--;}
  else{out.unshift({word:expected[i-1],type:"missing",expected:expected[i-1]});i--;}
 }
 return out;
}
function showToast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300);}
function loadVoices(){
 if(!("speechSynthesis" in window)){ $("audioStatus").textContent="Trình duyệt không hỗ trợ Speech Synthesis";return;}
 voices=window.speechSynthesis.getVoices();
 const select=$("voiceSelect"),old=select.value;
 select.innerHTML='<option value="">Tự động chọn English voice</option>';
 voices.filter(v=>/^en(-|_)/i.test(v.lang)).forEach((v,i)=>{const o=document.createElement("option");o.value=String(voices.indexOf(v));o.textContent=`${v.name} (${v.lang})`;select.appendChild(o);});
 if(old)select.value=old;
 selectedVoice=select.value?voices[Number(select.value)]:null;
}
function speak(text,rate=speed){
 if(!("speechSynthesis" in window)){showToast("Trình duyệt không hỗ trợ phát giọng nói.");return;}
 window.speechSynthesis.cancel();
 const utter=new SpeechSynthesisUtterance(text);
 utter.lang=selectedVoice?.lang||"en-US"; if(selectedVoice)utter.voice=selectedVoice;
 utter.rate=rate;utter.pitch=1;utter.volume=1;
 utter.onstart=()=>{$("audioStatus").textContent="Đang phát audio…";$("wave").classList.add("playing");$("playBtn").textContent="Ⅱ";};
 utter.onend=()=>{$("audioStatus").textContent="Audio đã phát xong";$("wave").classList.remove("playing");$("playBtn").textContent="▶";};
 utter.onerror=(e)=>{$("audioStatus").textContent="Không phát được âm thanh ("+(e.error||"unknown")+")";$("wave").classList.remove("playing");$("playBtn").textContent="▶";showToast("Không phát được audio. Hãy thử Test audio hoặc chọn English voice khác.");};
 window.speechSynthesis.speak(utter);
 totalListens++;localStorage.setItem("emPastSimpleListens",String(totalListens));updateStats();
}
function render(){
 const lesson=lessons[current];
 $("translationText").textContent=lesson.vi;
 $("audioTitle").textContent=`Sentence ${String(current+1).padStart(2,"0")}`;
 $("audioStatus").textContent="American English · Ready to play";
 $("questionCounter").textContent=`Question ${current+1} of ${lessons.length}`;
 $("progressPercent").textContent=`${Math.round(Object.keys(results).length/lessons.length*100)}% completed`;
 $("progressFill").style.width=`${Object.keys(results).length/lessons.length*100}%`;
 $("answerInput").value="";$("charCount").textContent="0 characters";
 $("hintBox").textContent=lesson.hint;$("hintBox").classList.add("hidden");
 $("feedback").className="feedback hidden";$("afterCheck").classList.add("hidden");
 $("actionRow")?.classList.remove("hidden");$("checkBtn").classList.remove("hidden");$("showAnswerBtn").classList.remove("hidden");
 checked=false;
 renderQuestionList();updateStats();
}
function renderQuestionList(){
 const list=$("questionList");list.innerHTML="";
 lessons.forEach((_,i)=>{const b=document.createElement("button");b.className="q-number"+(i===current?" current":"")+(results[i]?" done":"");b.textContent=String(i+1).padStart(2,"0");b.title=`Câu ${i+1}`;b.onclick=()=>{if(window.speechSynthesis)window.speechSynthesis.cancel();current=i;render();};list.appendChild(b);});
 $("sideDone").textContent=`${Object.keys(results).length}/10`;
}
function updateStats(){
 const done=Object.keys(results).length, scores=Object.values(results).map(x=>x.score);
 $("completedCount").textContent=done;$("listenCount").textContent=totalListens;
 $("accuracy").textContent=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length)+"%":"—";
 $("totalPoints").textContent=Object.values(results).reduce((a,x)=>a+x.points,0);
 const pct=Math.round(done/lessons.length*100);$("circleValue").textContent=pct+"%";
 $("circleProgress").style.background=`conic-gradient(#2563eb ${pct*3.6}deg,#edf1f6 0deg)`;
 $("progressMessage").textContent=done===10?"Hoàn thành xuất sắc! Bạn đã hoàn tất bài luyện nghe.":done?`Bạn đã hoàn thành ${done}/10 câu. Cố lên nhé!`:"Bắt đầu câu đầu tiên để ghi nhận tiến độ nhé!";
 $("streak").textContent=done?1:1;
}
function checkAnswer(reveal=false){
 if(checked&&!reveal)return;
 const typed=$("answerInput").value.trim(),lesson=lessons[current];
 if(!typed&&!reveal){showToast("Bạn hãy nhập câu trả lời trước nhé.");$("answerInput").focus();return;}
 const expected=tokens(lesson.text),actual=tokens(typed);
 const distance=editDistance(expected,actual),score=expected.length?Math.max(0,Math.round((1-distance/Math.max(expected.length,actual.length,1))*100)):0;
 const isCorrect=normalize(typed)===normalize(lesson.text);
 const aligned=alignWords(expected,actual);
 const box=$("feedback");box.className="feedback "+(isCorrect?"success":"error");
 let html=`<h4>${reveal?"Đáp án mẫu":isCorrect?"🎉 Chính xác! Làm tốt lắm!":"Chưa chính xác — cùng xem lại nhé!"}</h4>`;
 if(!reveal)html+=`<p>Độ chính xác ước tính: <b>${score}%</b> · ${isCorrect?"+10 điểm": "Hãy chú ý các từ được đánh dấu."}</p>`;
 html+=`<div class="word-diff">${aligned.map(w=>`<span class="word ${w.type==="ok"?"":w.type}">${escapeHtml(w.word)}${w.type==="missing"?" (thiếu)":w.type==="extra"?" (thừa)":""}</span>`).join("")}</div>`;
 html+=`<p><b>Đáp án đúng:</b> ${escapeHtml(lesson.text)}</p><div class="explain"><b>Grammar explanation</b><p>${escapeHtml(lesson.explain)}</p></div>`;
 box.innerHTML=html;box.classList.remove("hidden");
 $("checkBtn").classList.add("hidden");$("showAnswerBtn").classList.add("hidden");$("afterCheck").classList.remove("hidden");
 if(!reveal){results[current]={score,isCorrect,points:isCorrect?10:0,answer:typed};localStorage.setItem("emPastSimpleResults",JSON.stringify(results));}
 checked=true;renderQuestionList();updateStats();
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
$("playBtn").onclick=()=>{if(window.speechSynthesis?.speaking){window.speechSynthesis.cancel();$("playBtn").textContent="▶";$("wave").classList.remove("playing");$("audioStatus").textContent="Đã tạm dừng";}else speak(lessons[current].text);};
$("replayBtn").onclick=()=>speak(lessons[current].text);
$("testAudio").onclick=()=>speak("Hello! Welcome to English Master. Let's practice English together.",1);
$("voiceSelect").onchange=e=>{selectedVoice=e.target.value?voices[Number(e.target.value)]:null;showToast(selectedVoice?`Đã chọn ${selectedVoice.name}`:"Đã chọn giọng tự động");};
document.querySelectorAll(".speed").forEach(b=>b.onclick=()=>{speed=Number(b.dataset.speed);document.querySelectorAll(".speed").forEach(x=>x.classList.toggle("active",x===b));showToast(`Tốc độ phát: ${speed}x`);});
$("answerInput").addEventListener("input",e=>$("charCount").textContent=e.target.value.length+" characters");
$("answerInput").addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter")checkAnswer();});
$("hintBtn").onclick=()=>$("hintBox").classList.toggle("hidden");
$("checkBtn").onclick=()=>checkAnswer(false);$("showAnswerBtn").onclick=()=>checkAnswer(true);
$("retryBtn").onclick=()=>{delete results[current];localStorage.setItem("emPastSimpleResults",JSON.stringify(results));render();$("answerInput").focus();};
$("nextBtn").onclick=()=>{if(current<lessons.length-1){current++;render();}else{showToast("Bạn đã đến câu cuối. Hãy ôn lại các câu chưa đúng nhé!");current=0;render();}};
$("menuBtn").onclick=()=>$("sidebar").classList.toggle("open");
document.querySelectorAll(".nav-item").forEach(a=>a.addEventListener("click",()=>{$("sidebar").classList.remove("open");}));
if("speechSynthesis" in window){loadVoices();window.speechSynthesis.onvoiceschanged=loadVoices;}
render();
