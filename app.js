const STORAGE_KEY = "revision-planner-js-v1";

const initialTasks = [
  {id:"bio-05",date:"2026-10-05",subject:"bio",title:"Xénope : refaire la chronologie de mémoire",note:"Puis vérifier uniquement les oublis.",minutes:45,priority:"core"},
  {id:"chim-05b",date:"2026-10-05",subject:"chim",title:"Acides nucléiques : premier rappel",note:"Notions importantes seulement.",minutes:30,priority:"bonus"},
  {id:"bio-06",date:"2026-10-06",subject:"bio",title:"Xénope : rappel actif",note:"Sans relire tout le cours.",minutes:35,priority:"core"},
  {id:"chim-06",date:"2026-10-06",subject:"chim",title:"Acides nucléiques",note:"Consolider ce qui est déjà connu.",minutes:40,priority:"core"},
  {id:"bio-07",date:"2026-10-07",subject:"bio",title:"Xénope : récitation complète + schémas",note:"Pouvoir expliquer toutes les étapes dans l’ordre.",minutes:45,priority:"core"},
  {id:"chim-07",date:"2026-10-07",subject:"chim",title:"Acides nucléiques : finir l’essentiel",note:"Pas besoin de retenir chaque détail.",minutes:45,priority:"core"},
  {id:"chim-07b",date:"2026-10-07",subject:"chim",title:"Démarrer les glucides",note:"Compréhension uniquement.",minutes:30,priority:"bonus"},
  {id:"chim-08",date:"2026-10-08",subject:"chim",title:"Glucides : comprendre les grandes idées",note:"Journée de TP, donc séance légère.",minutes:45,priority:"core"},
  {id:"chim-09",date:"2026-10-09",subject:"chim",title:"Glucides : finir l’essentiel + exercices",note:"Vérifier la compréhension.",minutes:70,priority:"core"},
  {id:"chim-09b",date:"2026-10-09",subject:"chim",title:"Vocabulaire des lipides",note:"Petit démarrage.",minutes:30,priority:"bonus"},
  {id:"chim-12",date:"2026-10-12",subject:"chim",title:"Lipides : vocabulaire + structures",note:"Lister les mots vraiment nouveaux.",minutes:75,priority:"core"},
  {id:"chim-13a",date:"2026-10-13",subject:"chim",title:"Lipides : deuxième passage",note:"Récupérer le vocabulaire de mémoire.",minutes:50,priority:"core"},
  {id:"chim-13b",date:"2026-10-13",subject:"chim",title:"Rappel glucides : questions et exercices",note:"Éviter la relecture passive.",minutes:30,priority:"core"},
  {id:"chim-14",date:"2026-10-14",subject:"chim",title:"Enzymes : comprendre + exercices",note:"Séance importante.",minutes:90,priority:"core"},
  {id:"chim-15a",date:"2026-10-15",subject:"chim",title:"Acides aminés : révision ciblée",note:"Se concentrer sur l’essentiel.",minutes:45,priority:"core"},
  {id:"chim-15b",date:"2026-10-15",subject:"chim",title:"Biochimie : révision active globale",note:"Questions, définitions, schémas et exercices.",minutes:60,priority:"core"},
  {id:"chim-test",date:"2026-10-16",subject:"chim",title:"Contrôle de biochimie",note:"Après : rien de lourd.",minutes:5,priority:"core",deadline:true},
  {id:"math-weekend",date:"2026-10-17",subject:"math",title:"Cours particulier : intervalles + tests",note:"Si possible.",minutes:60,priority:"bonus"},
  {id:"math-19",date:"2026-10-19",subject:"math",title:"Probabilités + statistiques : exercices",note:"Réactivation.",minutes:75,priority:"core"},
  {id:"math-20",date:"2026-10-20",subject:"math",title:"Variables aléatoires : exercices",note:"Chapitre déjà vu.",minutes:75,priority:"core"},
  {id:"math-21",date:"2026-10-21",subject:"math",title:"Intervalle de confiance : comprendre + exercices",note:"Priorité à la méthode.",minutes:90,priority:"core"},
  {id:"math-22a",date:"2026-10-22",subject:"math",title:"Tests d’hypothèse : comprendre + exercices",note:"Comprendre le raisonnement.",minutes:75,priority:"core"},
  {id:"math-22b",date:"2026-10-22",subject:"math",title:"Exercices mélangés",note:"Identifier seul quelle méthode utiliser.",minutes:30,priority:"core"},
  {id:"math-test",date:"2026-10-23",subject:"math",title:"Contrôle de maths",note:"Fin du cycle.",minutes:5,priority:"core",deadline:true}
];

const chapters = {
  bio:["Chronologie du xénope","Schémas refaits de mémoire","Étapes expliquées sans support"],
  chim:["Acides nucléiques","Glucides","Lipides","Enzymes","Acides aminés"],
  math:["Probabilités","Statistiques","Variables aléatoires","Intervalle de confiance","Tests d’hypothèse"]
};

const subjectNames = {bio:"Biologie",chim:"Biochimie",math:"Maths"};
const deadlines = [
  {date:"2026-10-16",name:"Biochimie"},
  {date:"2026-10-23",name:"Maths"}
];

let state = loadState();
let selectedDate = null;

function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(saved && Array.isArray(saved.tasks)) return saved;
  }catch(e){}
  return {tasks:structuredClone(initialTasks),done:{},chapterDone:{},energy:"normal"};
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function dateFromISO(value){
  const [y,m,d] = value.split("-").map(Number);
  return new Date(y,m-1,d);
}

function toISO(date){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function todayISO(){
  return toISO(new Date());
}

function formatDate(value){
  return new Intl.DateTimeFormat("fr-FR",{weekday:"long",day:"numeric",month:"long"}).format(dateFromISO(value));
}

function escapeHTML(value){
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function taskXP(task){
  return task.priority === "bonus" ? 5 : Math.max(10, Math.round(task.minutes / 15) * 5);
}

function getGlobalStats(){
  const tasks = state.tasks.filter(t => !t.deadline);
  const doneTasks = tasks.filter(t => state.done[t.id]);
  const pct = tasks.length ? Math.round(doneTasks.length / tasks.length * 100) : 0;
  const xp = doneTasks.reduce((sum,t) => sum + taskXP(t), 0);
  return {tasks,doneTasks,pct,xp};
}

function getStreak(){
  const today = todayISO();
  const dates = [...new Set(
    state.tasks
      .filter(t => !t.deadline && t.priority !== "bonus" && t.date <= today)
      .map(t => t.date)
  )].sort();

  let streak = 0;
  for(let i = dates.length - 1; i >= 0; i--){
    const tasks = state.tasks.filter(t => t.date === dates[i] && !t.deadline && t.priority !== "bonus");
    if(tasks.length && tasks.every(t => state.done[t.id])) streak++;
    else break;
  }
  return streak;
}

function getNextDeadline(){
  const today = dateFromISO(todayISO());
  const next = deadlines.find(d => dateFromISO(d.date) >= today) || deadlines[deadlines.length - 1];
  const diff = Math.max(0, Math.ceil((dateFromISO(next.date) - today) / 86400000));
  return diff === 0 ? `${next.name} aujourd’hui` : `${next.name} dans ${diff} j`;
}

function visibleTasks(tasks){
  const core = tasks.filter(t => t.priority !== "bonus");
  const bonus = tasks.filter(t => t.priority === "bonus");

  if(state.energy === "light") return core.slice(0,1);
  if(state.energy === "push") return [...core,...bonus];
  return core;
}

function findReferenceDate(){
  const today = todayISO();
  const todayTasks = state.tasks.filter(t => t.date === today && !t.deadline);
  if(todayTasks.length) return today;

  const next = [...new Set(
    state.tasks.filter(t => t.date > today && !t.deadline).map(t => t.date)
  )].sort()[0];

  return next || today;
}

function taskCard(task){
  const done = !!state.done[task.id];
  const bonus = task.priority === "bonus";
  return `
    <article class="task ${done ? "done" : ""}" data-task-id="${escapeHTML(task.id)}">
      <div class="task-top">
        <input type="checkbox" ${done ? "checked" : ""} aria-label="Marquer comme terminé">
        <div>
          <div class="task-title">${escapeHTML(task.title)}</div>
          ${task.note ? `<div class="task-note">${escapeHTML(task.note)}</div>` : ""}
          <div class="task-meta">
            <span class="badge ${task.subject}">${subjectNames[task.subject]}</span>
            <span class="small muted">${task.minutes} min</span>
            ${bonus ? `<span class="badge bonus">BONUS</span>` : ""}
            ${task.deadline ? `<span class="badge bonus">ÉCHÉANCE</span>` : ""}
            <span class="small muted">+${taskXP(task)} XP</span>
          </div>
        </div>
      </div>
      ${task.deadline ? "" : `
      <div class="task-actions">
        <button type="button" data-action="edit">Modifier</button>
        <button type="button" data-action="postpone">Reporter à demain</button>
      </div>`}
    </article>`;
}

function bindTaskCards(scope){
  scope.querySelectorAll("[data-task-id]").forEach(card => {
    const id = card.dataset.taskId;
    const task = state.tasks.find(t => t.id === id);
    if(!task) return;

    card.querySelector('input[type="checkbox"]').addEventListener("change", event => {
      state.done[id] = event.target.checked;
      saveState();
      renderAll();
      toast(event.target.checked ? `+${taskXP(task)} XP` : "Séance réouverte");
    });

    card.querySelector('[data-action="edit"]')?.addEventListener("click", () => openTaskDialog(task));
    card.querySelector('[data-action="postpone"]')?.addEventListener("click", () => postponeTask(task));
  });
}

function renderHeader(){
  const stats = getGlobalStats();
  const circumference = 314.16;

  document.querySelector("#progressPercent").textContent = `${stats.pct}%`;
  document.querySelector("#ring").style.strokeDashoffset = String(circumference * (1 - stats.pct / 100));
  document.querySelector("#xpValue").textContent = stats.xp;
  document.querySelector("#streakValue").textContent = `${getStreak()} jour${getStreak() > 1 ? "s" : ""}`;
  document.querySelector("#deadlineValue").textContent = getNextDeadline();

  document.querySelectorAll("[data-energy]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.energy === state.energy);
  });
}

function renderToday(){
  const date = findReferenceDate();
  const tasks = state.tasks.filter(t => t.date === date && !t.deadline);
  const shown = visibleTasks(tasks);

  document.querySelector("#todayTitle").textContent = date === todayISO() ? "Aujourd’hui" : "Prochaine journée de révision";
  document.querySelector("#todaySubtitle").textContent = formatDate(date);

  const root = document.querySelector("#todayTasks");
  root.innerHTML = shown.length ? shown.map(taskCard).join("") : `<div class="empty">Aucune séance prévue.</div>`;
  bindTaskCards(root);
}

function renderCalendar(){
  const root = document.querySelector("#calendar");
  const headers = ["L","M","M","J","V","S","D"];
  let html = headers.map(d => `<div class="cal-head">${d}</div>`).join("");

  const year = 2026;
  const month = 9;
  const first = new Date(year,month,1);
  const last = new Date(year,month+1,0);
  const offset = (first.getDay() + 6) % 7;

  html += "<div></div>".repeat(offset);

  for(let day = 1; day <= last.getDate(); day++){
    const date = `2026-10-${String(day).padStart(2,"0")}`;
    const tasks = state.tasks.filter(t => t.date === date && !t.deadline);
    const core = tasks.filter(t => t.priority !== "bonus");
    const allDone = core.length && core.every(t => state.done[t.id]);
    const dots = tasks.slice(0,5).map(t => `<span class="dot ${t.subject}"></span>`).join("");

    html += `
      <button class="cal-day ${date === todayISO() ? "today" : ""} ${allDone ? "done" : ""}"
              data-date="${date}" type="button">
        <span class="cal-num">${day}</span>
        <div class="dots">${dots}</div>
        ${tasks.length ? `<span class="cal-count">${tasks.length} séance${tasks.length > 1 ? "s" : ""}</span>` : ""}
      </button>`;
  }

  root.innerHTML = html;

  root.querySelectorAll("[data-date]").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedDate = btn.dataset.date;
      switchView("planner");
      renderPlanner();
    });
  });
}

function renderPlanner(){
  let tasks = [...state.tasks].sort((a,b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  if(selectedDate) tasks = tasks.filter(t => t.date === selectedDate);

  document.querySelector("#clearDateFilter").hidden = !selectedDate;

  const root = document.querySelector("#planner");
  if(!tasks.length){
    root.innerHTML = `<div class="empty">Aucune séance pour cette date.</div>`;
    return;
  }

  let html = "";
  let currentDate = "";

  for(const task of tasks){
    if(task.date !== currentDate){
      currentDate = task.date;
      html += `<div class="planner-date">${formatDate(currentDate)}</div>`;
    }
    html += taskCard(task);
  }

  root.innerHTML = html;
  bindTaskCards(root);
}

function renderProgress(){
  const subjects = ["bio","chim","math"];
  const progressRoot = document.querySelector("#subjectProgress");

  progressRoot.innerHTML = subjects.map(subject => {
    const tasks = state.tasks.filter(t => t.subject === subject && !t.deadline);
    const done = tasks.filter(t => state.done[t.id]).length;
    const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;

    return `
      <article class="progress-row">
        <div class="progress-row-head">
          <strong>${subjectNames[subject]}</strong>
          <span>${pct}%</span>
        </div>
        <div class="bar"><span style="width:${pct}%"></span></div>
      </article>`;
  }).join("");

  const chapterRoot = document.querySelector("#chapterChecklist");
  chapterRoot.innerHTML = subjects.map(subject => `
    <article class="chapter-card">
      <h3>${subjectNames[subject]}</h3>
      ${chapters[subject].map((name,index) => {
        const id = `${subject}-${index}`;
        return `
          <label>
            <input type="checkbox" data-chapter="${id}" ${state.chapterDone[id] ? "checked" : ""}>
            <span>${escapeHTML(name)}</span>
          </label>`;
      }).join("")}
    </article>`).join("");

  chapterRoot.querySelectorAll("[data-chapter]").forEach(cb => {
    cb.addEventListener("change", () => {
      state.chapterDone[cb.dataset.chapter] = cb.checked;
      saveState();
    });
  });
}

function renderAll(){
  renderHeader();
  renderToday();
  renderCalendar();
  renderPlanner();
  renderProgress();
}

function switchView(name){
  document.querySelectorAll(".view").forEach(view => {
    view.classList.toggle("active", view.id === `view-${name}`);
  });

  document.querySelectorAll(".tabs [data-view]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === name);
  });

  window.scrollTo({top:0,behavior:"smooth"});
}

function postponeTask(task){
  const next = dateFromISO(task.date);
  next.setDate(next.getDate()+1);
  task.date = toISO(next);
  saveState();
  renderAll();
  toast("Séance reportée à demain");
}

function openTaskDialog(task = null){
  document.querySelector("#dialogTitle").textContent = task ? "Modifier la séance" : "Ajouter une séance";
  document.querySelector("#taskId").value = task?.id || "";
  document.querySelector("#taskDate").value = task?.date || todayISO();
  document.querySelector("#taskSubject").value = task?.subject || "chim";
  document.querySelector("#taskTitle").value = task?.title || "";
  document.querySelector("#taskNote").value = task?.note || "";
  document.querySelector("#taskMinutes").value = task?.minutes || 45;
  document.querySelector("#taskPriority").value = task?.priority || "core";
  document.querySelector("#deleteTaskBtn").hidden = !task;
  document.querySelector("#taskDialog").showModal();
}

function saveTaskFromDialog(){
  const id = document.querySelector("#taskId").value;
  const data = {
    date:document.querySelector("#taskDate").value,
    subject:document.querySelector("#taskSubject").value,
    title:document.querySelector("#taskTitle").value.trim(),
    note:document.querySelector("#taskNote").value.trim(),
    minutes:Math.max(5,Math.min(300,Number(document.querySelector("#taskMinutes").value) || 45)),
    priority:document.querySelector("#taskPriority").value
  };

  if(!data.date || !data.title) return false;

  if(id){
    const task = state.tasks.find(t => t.id === id);
    if(task) Object.assign(task,data);
  }else{
    state.tasks.push({...data,id:`custom-${Date.now()}`});
  }

  saveState();
  renderAll();
  toast(id ? "Séance modifiée" : "Séance ajoutée");
  return true;
}

function toast(message){
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 1500);
}

document.querySelectorAll("[data-energy]").forEach(btn => {
  btn.addEventListener("click", () => {
    state.energy = btn.dataset.energy;
    saveState();
    renderAll();
  });
});

document.querySelectorAll("[data-view]").forEach(btn => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

document.querySelector("#addTaskBtn").addEventListener("click", () => openTaskDialog());

document.querySelector("#clearDateFilter").addEventListener("click", () => {
  selectedDate = null;
  renderPlanner();
});

document.querySelector("#cancelDialog").addEventListener("click", () => {
  document.querySelector("#taskDialog").close();
});

document.querySelector("#taskForm").addEventListener("submit", event => {
  event.preventDefault();
  if(saveTaskFromDialog()) document.querySelector("#taskDialog").close();
});

document.querySelector("#deleteTaskBtn").addEventListener("click", () => {
  const id = document.querySelector("#taskId").value;
  if(!id) return;

  if(confirm("Supprimer cette séance ?")){
    state.tasks = state.tasks.filter(t => t.id !== id);
    delete state.done[id];
    saveState();
    document.querySelector("#taskDialog").close();
    renderAll();
    toast("Séance supprimée");
  }
});

document.querySelector("#exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sauvegarde-revisions.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

document.querySelector("#importInput").addEventListener("change", async event => {
  const file = event.target.files?.[0];
  if(!file) return;

  try{
    const data = JSON.parse(await file.text());
    if(!Array.isArray(data.tasks) || !data.done) throw new Error("invalid");
    state = data;
    saveState();
    renderAll();
    toast("Sauvegarde importée");
  }catch(e){
    alert("Le fichier n’est pas une sauvegarde valide.");
  }

  event.target.value = "";
});

document.querySelector("#resetBtn").addEventListener("click", () => {
  if(!confirm("Réinitialiser tout le planning et toute la progression ?")) return;

  state = {
    tasks:structuredClone(initialTasks),
    done:{},
    chapterDone:{},
    energy:"normal"
  };

  selectedDate = null;
  saveState();
  renderAll();
  toast("Planning réinitialisé");
});

renderAll();
