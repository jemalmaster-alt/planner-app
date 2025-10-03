// DOM Elements
const daySelector = document.getElementById('day-selector');
const currentDayTitle = document.getElementById('current-day-title');
const taskList = document.getElementById('task-list');
const addTaskForm = document.getElementById('add-task-form');
const taskTextInput = document.getElementById('task-text-input');
const taskTimeInput = document.getElementById('task-time-input');
const notificationBanner = document.getElementById('notification-banner');
const enableNotificationsBtn = document.getElementById('enable-notifications-btn');

// App State
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let currentDay;
let tasks = {};
let alarmInterval;

// --- Core Functions ---
function init() {
    const todayIndex = new Date().getDay();
    currentDay = daysOfWeek[todayIndex];
    loadTasks();
    renderUI();
    setupEventListeners();
    checkNotificationPermission();
    startAlarmChecker();
    lucide.createIcons();
}

function renderUI() {
    renderDayTabs();
    renderTasks();
    currentDayTitle.textContent = `${currentDay}'s Plan`;
}

function renderDayTabs() {
    daySelector.innerHTML = '';
    daysOfWeek.forEach(day => {
        const isActive = day === currentDay;
        const button = document.createElement('button');
        button.textContent = day.substring(0, 3);
        button.className = `px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            isActive 
            ? 'bg-indigo-600 text-white shadow-md' 
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`;
        button.onclick = () => changeDay(day);
        daySelector.appendChild(button);
    });
}

function renderTasks() {
    taskList.innerHTML = '';
    const dayTasks = tasks[currentDay] || [];
    if (dayTasks.length === 0) {
        taskList.innerHTML = `<div class="text-center py-10 px-4"><i data-lucide="moon-star" class="mx-auto h-12 w-12 text-slate-500"></i><p class="mt-4 text-slate-400">No tasks for today. Add one below!</p></div>`;
    } else {
        dayTasks.sort((a, b) => a.time.localeCompare(b.time));
        dayTasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = `task-item bg-slate-800 p-4 rounded-lg flex items-center gap-4 transition-all duration-300 ${task.isComplete ? 'opacity-50' : ''}`;
            taskEl.innerHTML = `
                <div class="flex-grow cursor-pointer" onclick="toggleComplete('${currentDay}', ${task.id})">
                    <p class="font-semibold text-slate-100 ${task.isComplete ? 'line-through' : ''}">${task.text}</p>
                    <p class="text-sm text-slate-400">${formatTime(task.time)}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="toggleAlarm('${currentDay}', ${task.id})" class="${task.alarmSet ? 'text-indigo-400' : 'text-slate-500'} hover:text-indigo-400 p-2 rounded-full hover:bg-slate-700 transition-colors">
                        <i data-lucide="bell" class="${task.alarmSet ? 'fill-current' : ''}"></i>
                    </button>
                    <button onclick="deleteTask('${currentDay}', ${task.id})" class="text-slate-500 hover:text-red-400 p-2 rounded-full hover:bg-slate-700 transition-colors">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>`;
            taskList.appendChild(taskEl);
        });
    }
    lucide.createIcons();
}

// --- Data Persistence ---
function saveTasks() {
    localStorage.setItem('plannerTasks', JSON.stringify(tasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem('plannerTasks');
    tasks = savedTasks ? JSON.parse(savedTasks) : daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: [] }), {});
}

// --- Event Handlers & Actions ---
function setupEventListeners() {
    addTaskForm.addEventListener('submit', (e) => { e.preventDefault(); addTask(); });
    enableNotificationsBtn.addEventListener('click', requestNotificationPermission);
}

function changeDay(day) {
    currentDay = day;
    renderUI();
}

function addTask() {
    const text = taskTextInput.value.trim();
    const time = taskTimeInput.value;
    if (!text || !time) return;
    const newTask = { id: Date.now(), text, time, isComplete: false, alarmSet: true };
    if (!tasks[currentDay]) tasks[currentDay] = [];
    tasks[currentDay].push(newTask);
    saveTasks();
    renderTasks();
    addTaskForm.reset();
}

function deleteTask(day, taskId) {
    tasks[day] = tasks[day].filter(task => task.id !== taskId);
    saveTasks();
    renderTasks();
}

function toggleComplete(day, taskId) {
    const task = tasks[day].find(task => task.id === taskId);
    if (task) { task.isComplete = !task.isComplete; saveTasks(); renderTasks(); }
}

function toggleAlarm(day, taskId) {
    const task = tasks[day].find(task => task.id === taskId);
    if (task) { task.alarmSet = !task.alarmSet; saveTasks(); renderTasks(); }
}

// --- Alarm & Notification Logic ---
function checkNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        notificationBanner.classList.remove('hidden');
    }
}

function requestNotificationPermission() {
    Notification.requestPermission().then(() => {
        notificationBanner.classList.add('hidden');
    });
}

function startAlarmChecker() {
    if (alarmInterval) clearInterval(alarmInterval);
    alarmInterval = setInterval(checkAlarms, 10000); 
}

function checkAlarms() {
    const now = new Date();
    const currentDayName = daysOfWeek[now.getDay()];
    const currentTime = now.toTimeString().substring(0, 5);
    (tasks[currentDayName] || []).forEach(task => {
        if (task.alarmSet && !task.isComplete && task.time === currentTime) {
            triggerAlarm(task);
            task.alarmSet = false;
            saveTasks();
            if (currentDay === currentDayName) renderTasks();
        }
    });
}

function triggerAlarm(task) {
    try { new Tone.Synth().toDestination().triggerAttackRelease("C5", "0.5"); } catch (e) { console.error("Tone.js error:", e); }
    if (Notification.permission === 'granted') { new Notification('Task Reminder!', { body: task.text }); }
}

// --- Utility Functions ---
function formatTime(timeString) {
    const [hourString, minute] = timeString.split(":");
    const hour = +hourString % 24;
    return `${hour % 12 || 12}:${minute} ${hour < 12 ? "AM" : "PM"}`;
}

// --- App Start ---
document.addEventListener('DOMContentLoaded', init);
