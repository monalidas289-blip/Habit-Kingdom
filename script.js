const KEY = "habitKingdomPremiumV1";

const starterHabits = [
  {id:"h1",name:"Drink enough water",category:"Body",frequency:"Once a day",xp:20,coins:5,dates:[]},
  {id:"h2",name:"Read for 10 minutes",category:"Mind",frequency:"Once a day",xp:20,coins:5,dates:[]},
  {id:"h3",name:"Plan my top priorities",category:"Focus",frequency:"Once a day",xp:20,coins:5,dates:[]},
  {id:"h4",name:"Tidy one small space",category:"Life",frequency:"Once a day",xp:20,coins:5,dates:[]}
];

const quotes = [
  ["Great things are done by a series of small things brought together.","Vincent van Gogh"],
  ["The secret of getting ahead is getting started.","Mark Twain"],
  ["It always seems impossible until it's done.","Nelson Mandela"],
  ["Little by little, one travels far.","J. R. R. Tolkien"],
  ["Start where you are. Use what you have. Do what you can.","Arthur Ashe"],
  ["Well done is better than well said.","Benjamin Franklin"],
  ["You do not have to be perfect to make progress.","A reminder for today"],
  ["A journey of a thousand miles begins with a single step.","Lao Tzu"],
  ["Your future is built by what you do consistently.","A reminder for today"],
  ["You are allowed to grow at your own pace.","A reminder for today"],
  ["Small steps every day add up to remarkable results.","A reminder for today"],
  ["Rest is part of the journey, too.","A reminder for today"]
];

const icons = {Mind:"📚",Body:"💧",Focus:"🎯",Life:"🌱"};
const colors = {Mind:"#a99aff22",Body:"#55dfb022",Focus:"#ffbc7822",Life:"#52d7ef22"};

const $ = id => document.getElementById(id);
const today = () => dateKey(new Date());

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function freshState() {
  return {
    habits:starterHabits.map(h=>({...h,dates:[]})),
    xp:0,coins:0,kingdom:"Possibility",completedDays:[],
    savedQuotes:[],theme:"dark",claimed:[]
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if(saved && Array.isArray(saved.habits)) {
      return {
        ...freshState(),...saved,
        xp:Math.max(0,Number(saved.xp)||0),
        coins:Math.max(0,Number(saved.coins)||0),
        habits:saved.habits.map(h=>({...h,dates:Array.isArray(h.dates)?h.dates:[]})),
        completedDays:Array.isArray(saved.completedDays)?saved.completedDays:[],
        savedQuotes:Array.isArray(saved.savedQuotes)?saved.savedQuotes:[],
        claimed:Array.isArray(saved.claimed)?saved.claimed:[]
      };
    }
  } catch(error) {
    console.warn("Saved progress could not be loaded.",error);
  }
  return freshState();
}

let data = loadState();
let filter = "all";
let quoteIndex = Math.floor(Math.random()*quotes.length);
let timerSeconds = 25*60;
let timerInterval = null;
let running = false;
let toastTimeout;

function save() {
  try {
    localStorage.setItem(KEY,JSON.stringify(data));
  } catch(error) {
    notify("Browser storage is unavailable. Your changes may not persist.");
  }
}

function esc(value) {
  return String(value).replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);
}

function isDone(h) {
  return h.dates.includes(today());
}

function doneToday() {
  return data.habits.filter(isDone).length;
}

function level() {
  return Math.floor(data.xp/100)+1;
}

function rank() {
  if(level()>=15) return "Kingdom Legend";
  if(level()>=10) return "Royal Guardian";
  if(level()>=6) return "Master Builder";
  if(level()>=3) return "Royal Architect";
  if(level()>=2) return "Skilled Builder";
  return "Beginner";
}

function calculateStreak() {
  const days = new Set(data.completedDays);
  let d = new Date();
  if(!days.has(today())) d.setDate(d.getDate()-1);
  let count=0;
  for(let i=0;i<366;i++) {
    if(days.has(dateKey(d))) {
      count++;
      d.setDate(d.getDate()-1);
    } else break;
  }
  return count;
}

function syncCompletedDays() {
  if(doneToday()>0 && !data.completedDays.includes(today())) {
    data.completedDays.push(today());
  }
}

function notify(message) {
  const el=$("toast");
  el.textContent=message;
  el.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout=setTimeout(()=>el.classList.remove("show"),2600);
}

function openModal(id) {
  const dialog=$(id);
  if(dialog.showModal) dialog.showModal();
  else dialog.setAttribute("open","");
}

function closeModal(id) {
  const dialog=$(id);
  if(dialog.close) dialog.close();
  else dialog.removeAttribute("open");
}

function renderStats() {
  const completed=doneToday();
  const total=data.habits.length;
  const lv=level();
  const into=data.xp%100;

  $("xp").innerHTML=`${data.xp} <small>XP</small>`;
  $("coins").innerHTML=`${data.coins} <small>coins</small>`;
  $("streak").innerHTML=`${calculateStreak()} <small>days</small>`;
  $("progressCount").textContent=`${completed} / ${total}`;
  $("progressText").textContent=total && completed===total
    ?"All habits completed. Amazing!"
    :`${total-completed} habit${total-completed===1?"":"s"} left to explore`;
  $("habitCount").textContent=total;
  $("sideLevel").textContent=`Level ${lv} · ${rank()}`;
  $("artLevel").textContent=`Level ${lv} Kingdom`;
  $("artName").textContent=`Kingdom of ${data.kingdom}`;
  $("levelText").textContent=`${into} / 100 XP`;
  $("levelBar").style.width=`${into}%`;

  $("challengeBar").style.width=`${Math.min(100,completed/2*100)}%`;
  $("streakBar").style.width=`${Math.min(100,calculateStreak()/7*100)}%`;

  $("achievementName").textContent=data.xp>=20?"Habit Hero":"First Steps";
  $("achievementText").textContent=data.xp>=20
    ?"You've earned your first habit reward!"
    :"Complete a habit to unlock your first achievement.";
  $("achievementLock").textContent=data.xp>=20?"🏅":"🔒";
  $("streakLock").textContent=calculateStreak()>=7?"🏆":"🔒";
}

function renderHabits() {
  const list=$("habitList");
  const empty=$("empty");

  const visible=data.habits.filter(h=>
    filter==="all" ||
    (filter==="done" && isDone(h)) ||
    (filter==="pending" && !isDone(h))
  );

  list.innerHTML=visible.map(h=>{
    const completed=isDone(h);
    const category=icons[h.category]?h.category:"Life";
    return `<div class="habit-row ${completed?"is-done":""}">
      <button class="check ${completed?"done":""}" data-toggle="${esc(h.id)}"
        aria-label="${completed?"Uncheck":"Complete"} ${esc(h.name)}"
        aria-pressed="${completed}">${completed?"✓":""}</button>
      <span class="habit-emoji" style="--emoji-bg:${colors[category]}">${icons[category]}</span>
      <div class="habit-info">
        <b>${esc(h.name)}</b>
        <small>${esc(category)} · ${esc(h.frequency||"Once a day")}</small>
      </div>
      <span class="habit-reward">${completed?"✓ Done":`+${h.xp||20} XP`}</span>
      <button class="delete-habit" data-delete="${esc(h.id)}" aria-label="Delete ${esc(h.name)}" title="Delete habit">×</button>
    </div>`;
  }).join("");

  if(data.habits.length===0) {
    empty.classList.remove("hidden");
    list.classList.add("hidden");
  } else {
    empty.classList.add("hidden");
    list.classList.toggle("hidden",visible.length===0);
    if(visible.length===0) {
      list.classList.remove("hidden");
      list.innerHTML=`<div class="empty"><div>✨</div><b>${filter==="done"?"Your wins are waiting!":"All caught up!"}</b><p>${filter==="done"?"Complete a habit to see it here.":"Nothing left in this filter today."}</p></div>`;
    }
  }

  renderStats();
  renderChart();
}

function completeHabit(id) {
  const h=data.habits.find(x=>x.id===id);
  if(!h) return;

  if(isDone(h)) {
    h.dates=h.dates.filter(d=>d!==today());
    data.xp=Math.max(0,data.xp-(h.xp||20));
    data.coins=Math.max(0,data.coins-(h.coins||5));
    notify("Habit unchecked. You can try again today.");
  } else {
    const oldLevel=level();
    h.dates.push(today());
    data.xp+=h.xp||20;
    data.coins+=h.coins||5;
    syncCompletedDays();
    notify("Quest complete! +" +(h.xp||20)+" XP and +"+(h.coins||5)+" coins ✨");
    if(level()>oldLevel) {
      setTimeout(()=>notify(`Level up! Welcome to level ${level()} 👑`),800);
    }
  }

  syncCompletedDays();
  save();
  renderHabits();
}

function addHabit(name,category,frequency) {
  const xp=20;
  data.habits.push({
    id:"h"+Date.now()+Math.random().toString(36).slice(2,6),
    name,category,frequency,xp,coins:5,dates:[]
  });
  save();
  renderHabits();
  notify("A new habit has joined your kingdom! 🌱");
}

function deleteHabit(id) {
  const habit=data.habits.find(h=>h.id===id);
  if(!habit) return;
  if(!confirm(`Delete "${habit.name}" from your habit list?`)) return;
  data.habits=data.habits.filter(h=>h.id!==id);
  save();
  renderHabits();
  notify("Habit removed.");
}

function renderQuote() {
  const [text,author]=quotes[quoteIndex];
  $("quote").textContent=text;
  $("author").textContent="— "+author;
  const saved=data.savedQuotes.includes(text);
  $("saveQuote").textContent=saved?"♥ Saved":"♡ Save quote";
  $("saveQuote").classList.toggle("saved",saved);
}

function renderChart() {
  const chart=$("chart");
  const now=new Date();
  const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const entries=[];

  for(let i=6;i>=0;i--) {
    const d=new Date(now);
    d.setDate(now.getDate()-i);
    const key=dateKey(d);
    const count=data.habits.filter(h=>h.dates.includes(key)).length;
    entries.push({key,count,label:days[d.getDay()],today:i===0});
  }

  const max=Math.max(1,...entries.map(e=>e.count));
  const total=entries.reduce((sum,e)=>sum+e.count,0);
  const possible=data.habits.length*7;

  chart.innerHTML=entries.map(e=>`
    <div class="day ${e.today?"today":""}" title="${e.count} habit completions">
      <div class="bar-track"><div class="bar" style="height:${e.count?Math.max(8,e.count/max*100):0}%"></div></div>
      <small>${e.label}</small>
    </div>`).join("");

  $("weekPct").textContent=(possible?Math.round(total/possible*100):0)+"%";
  $("weekTotal").textContent=`${total} completion${total===1?"":"s"}`;
}

function setTheme(theme) {
  data.theme=theme;
  document.body.classList.toggle("light-mode",theme==="light");
  $("themeBtn").textContent=theme==="light"?"☾":"☼";
  save();
}

function chooseQuote() {
  if(quotes.length<2) return;
  const previous=quoteIndex;
  while(quoteIndex===previous) {
    quoteIndex=Math.floor(Math.random()*quotes.length);
  }
  renderQuote();
}

function timerDisplay() {
  const mins=Math.floor(timerSeconds/60);
  const secs=timerSeconds%60;
  $("timer").textContent=`${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval=null;
  running=false;
  $("timerStart").textContent="▶ Start focus";
}

function startTimer() {
  if(running) {
    stopTimer();
    return;
  }

  running=true;
  $("timerStart").textContent="Ⅱ Pause";

  timerInterval=setInterval(()=>{
    timerSeconds--;
    timerDisplay();

    if(timerSeconds<=0) {
      stopTimer();
      timerSeconds=0;
      timerDisplay();
      notify("Session complete! Take a breath. You did it ✨");
    }
  },1000);
}

function resetTimer() {
  stopTimer();
  const selected=document.querySelector(".mode.active");
  timerSeconds=Number(selected?.dataset.min||25)*60;
  timerDisplay();
}

function setup() {
  $("todayDate").textContent=new Date().toLocaleDateString(undefined,{
    weekday:"short",month:"short",day:"numeric",year:"numeric"
  });
  $("year").textContent=new Date().getFullYear();

  setTheme(data.theme);
  renderHabits();
  renderQuote();

  $("addTop").addEventListener("click",()=>{
    $("habitForm").reset();
    openModal("habitDialog");
    setTimeout(()=>$("habitName").focus(),50);
  });
  $("addInline").addEventListener("click",()=>$("addTop").click());
  $("emptyAdd").addEventListener("click",()=>$("addTop").click());

  $("habitForm").addEventListener("submit",event=>{
    event.preventDefault();
    const name=$("habitName").value.trim();
    if(!name) return;
    addHabit(name,$("category").value,$("frequency").value);
    closeModal("habitDialog");
  });

  $("habitList").addEventListener("click",event=>{
    const toggle=event.target.closest("[data-toggle]");
    const del=event.target.closest("[data-delete]");
    if(toggle) completeHabit(toggle.dataset.toggle);
    if(del) deleteHabit(del.dataset.delete);
  });

  document.querySelectorAll(".filter").forEach(button=>{
    button.addEventListener("click",()=>{
      filter=button.dataset.filter;
      document.querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",b===button));
      renderHabits();
    });
  });

  $("nextQuote").addEventListener("click",chooseQuote);
  $("saveQuote").addEventListener("click",()=>{
    const text=quotes[quoteIndex][0];
    if(data.savedQuotes.includes(text)) {
      data.savedQuotes=data.savedQuotes.filter(q=>q!==text);
      notify("Quote removed from favorites.");
    } else {
      data.savedQuotes.push(text);
      notify("Saved! Keep this reminder close. 💜");
    }
    save();
    renderQuote();
  });

  $("themeBtn").addEventListener("click",()=>{
    setTheme(data.theme==="dark"?"light":"dark");
  });

  $("renameBtn").addEventListener("click",()=>{
    $("kingdomName").value=data.kingdom;
    openModal("nameDialog");
  });

  $("nameForm").addEventListener("submit",event=>{
    event.preventDefault();
    const name=$("kingdomName").value.trim();
    if(!name) return;
    data.kingdom=name;
    save();
    renderStats();
    closeModal("nameDialog");
    notify("Your kingdom has a new name! 👑");
  });

  document.querySelectorAll("[data-close]").forEach(button=>{
    button.addEventListener("click",()=>closeModal(button.dataset.close));
  });

  document.querySelectorAll("dialog").forEach(dialog=>{
    dialog.addEventListener("click",event=>{
      if(event.target===dialog) dialog.close();
    });
  });

  $("timerStart").addEventListener("click",startTimer);
  $("timerReset").addEventListener("click",resetTimer);

  document.querySelectorAll(".mode").forEach(button=>{
    button.addEventListener("click",()=>{
      stopTimer();
      document.querySelectorAll(".mode").forEach(b=>b.classList.toggle("active",b===button));
      timerSeconds=Number(button.dataset.min)*60;
      timerDisplay();
    });
  });

  $("startQuest").addEventListener("click",()=>{
    $("habits").scrollIntoView({behavior:"smooth"});
  });

  document.querySelectorAll(".nav").forEach(link=>{
    link.addEventListener("click",()=>{
      document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n===link));
    });
  });

  $("resetData").addEventListener("click",()=>{
    if(!confirm("Reset all Habit Kingdom progress? This cannot be undone.")) return;
    data=freshState();
    filter="all";
    save();
    setTheme(data.theme);
    renderHabits();
    quoteIndex=Math.floor(Math.random()*quotes.length);
    renderQuote();
    notify("A fresh adventure begins! 🌱");
  });

  timerDisplay();
}

document.addEventListener("DOMContentLoaded",setup);












/* ===== PREMIUM GAME FEATURES ===== */

let popupTimeout;

function showAchievement(title,description,medal="🏆") {
  const popup=$("achievementPopup");
  if(!popup) return;

  $("popupTitle").textContent=title;
  $("popupDescription").textContent=description;
  $("popupMedal").textContent=medal;

  clearTimeout(popupTimeout);
  popup.classList.remove("hide","show");
  void popup.offsetWidth;
  popup.classList.add("show");

  popupTimeout=setTimeout(()=>{
    popup.classList.remove("show");
    popup.classList.add("hide");
  },3500);
}

function unlockOnce(id,title,description,medal) {
  if(data.claimed.includes(id)) return false;
  data.claimed.push(id);
  save();
  showAchievement(title,description,medal);
  celebrate();
  return true;
}

function celebrate() {
  const layer=$("confettiLayer");
  if(!layer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  layer.replaceChildren();
  const fragment=document.createDocumentFragment();
  const pieces=45;

  for(let i=0;i<pieces;i++) {
    const piece=document.createElement("span");
    piece.className="confetti-piece";
    piece.style.left=Math.random()*100+"%";
    piece.style.setProperty("--drift",(Math.random()*180-90)+"px");
    piece.style.animationDelay=(Math.random()*.65)+"s";
    piece.style.background=[
      "#a99aff","#52d7ef","#55dfb0",
      "#ffbc78","#ff8fb5","#ffffff"
    ][i%6];
    fragment.appendChild(piece);
  }

  layer.appendChild(fragment);
  setTimeout(()=>layer.replaceChildren(),3500);
}

function floatReward(button,text) {
  const rect=button.getBoundingClientRect();
  const el=document.createElement("div");
  el.className="reward-float";
  el.textContent=text;
  el.style.left=Math.max(8,Math.min(window.innerWidth-120,rect.left))+"px";
  el.style.top=Math.max(8,rect.top-10)+"px";
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),1500);
}

function renderBuildings() {
  const lv=level();

  const buildings=[
    {id:"garden",level:2,name:"Dream Garden",emoji:"🌳"},
    {id:"library",level:3,name:"Wisdom Library",emoji:"📚"},
    {id:"tower",level:5,name:"Crystal Tower",emoji:"🔮"}
  ];

  buildings.forEach(building=>{
    const el=document.querySelector(`[data-building="${building.id}"]`);
    if(!el) return;

    const unlocked=lv>=building.level;
    const wasUnlocked=data.claimed.includes("building-"+building.id);

    el.classList.toggle("unlocked",unlocked);

    const art=el.querySelector(".building-art");
    const lock=el.querySelector(".building-lock");

    art.textContent=building.emoji;
    lock.textContent=unlocked?"✦ Unlocked":`🔒 Level ${building.level}`;
    el.title=unlocked
      ?building.name+" — unlocked!"
      :`Reach level ${building.level} to unlock ${building.name}`;

    if(unlocked && !wasUnlocked) {
      data.claimed.push("building-"+building.id);
      setTimeout(()=>{
        showAchievement(
          building.name+" Unlocked!",
          "Your kingdom has grown. Keep building your future!",
          building.emoji
        );
      },500);
    }
  });

  save();
}

function checkAchievements() {
  const totalDone=data.habits.reduce(
    (sum,h)=>sum+h.dates.length,0
  );

  if(totalDone>=1) {
    unlockOnce(
      "first-habit",
      "First Steps",
      "You completed your first habit. Your journey is real!",
      "🌱"
    );
  }

  if(totalDone>=10) {
    unlockOnce(
      "ten-wins",
      "Rising Star",
      "You've collected 10 habit completions!",
      "⭐"
    );
  }

  if(totalDone>=50) {
    unlockOnce(
      "fifty-wins",
      "Habit Champion",
      "50 habit completions. Look how far you've come!",
      "🏆"
    );
  }

  if(doneToday()>=3) {
    unlockOnce(
      "daily-triple",
      "Triple Victory",
      "Three habits completed today. Amazing consistency!",
      "⚡"
    );
  }

  if(calculateStreak()>=3) {
    unlockOnce(
      "three-day-streak",
      "On a Roll",
      "You've kept your routine going for three days!",
      "🔥"
    );
  }

  if(calculateStreak()>=7) {
    unlockOnce(
      "seven-day-streak",
      "Consistency Champion",
      "A full week of progress. That's worth celebrating!",
      "👑"
    );
  }

  if(level()>=5) {
    unlockOnce(
      "level-five",
      "Royal Builder",
      "You've reached level 5. Your kingdom is thriving!",
      "🏰"
    );
  }
}

function setupWelcome() {
  const dialog=$("welcomeDialog");
  if(!dialog) return;

  // Show onboarding only once in this browser.
  try {
    if(localStorage.getItem("habitKingdomWelcomed")==="yes") return;
  } catch(error) {}

  openModal("welcomeDialog");
}





function finishWelcome() {
  const name=$("welcomeName").value.trim();

  if(name) data.kingdom=name.slice(0,28);

  try {
    localStorage.setItem("habitKingdomWelcomed","yes");
  } catch(error) {}

  save();
  renderStats();
  closeModal("welcomeDialog");
  notify("Welcome to your kingdom. Your adventure starts now! 👑");
}

$("beginJourney").addEventListener("click",finishWelcome);
$("skipWelcome").addEventListener("click",()=>{
  $("welcomeName").value="";
  finishWelcome();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch(error => {
        console.error("Service worker registration failed:", error);
      });
  });
}