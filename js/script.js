// ============================================================
//  To-Do List Life Dashboard — script.js
//  Challenges integrated:
//    1. Duplicate task prevention (alert)
//    2. Custom name in greeting (localStorage)
//    3. Custom Pomodoro duration
// ============================================================

'use strict';

/* ══════════════════════════════════════════════════════════
   STORAGE HANDLER
   Central read/write to localStorage with error handling.
══════════════════════════════════════════════════════════ */

const Storage_Handler = {
  KEYS: {
    TASKS:  'tld_tasks',
    LINKS:  'tld_links',
    NAME:   'tld_custom_name',
    TIMER:  'tld_timer_duration',
  },

  isAvailable() {
    try {
      const k = '__tld_test__';
      localStorage.setItem(k, k);
      localStorage.removeItem(k);
      return true;
    } catch {
      return false;
    }
  },

  _save(key, value) {
    if (!this.isAvailable()) {
      showStorageWarning('localStorage is not available. Data will not be saved.');
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        showStorageWarning('Storage is full. Data could not be saved.');
      }
    }
  },

  _load(key, fallback) {
    if (!this.isAvailable()) return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      console.warn(`[Storage] Data for key "${key}" is corrupted, using default.`);
      return fallback;
    }
  },

  saveTasks(tasks)    { this._save(this.KEYS.TASKS, tasks); },
  loadTasks()         { return this._load(this.KEYS.TASKS, []); },

  saveLinks(links)    { this._save(this.KEYS.LINKS, links); },
  loadLinks()         { return this._load(this.KEYS.LINKS, []); },

  saveName(name)      { this._save(this.KEYS.NAME, name); },
  loadName()          { return this._load(this.KEYS.NAME, ''); },

  saveDuration(mins)  { this._save(this.KEYS.TIMER, mins); },
  loadDuration()      { return this._load(this.KEYS.TIMER, 25); },
};

/* ══════════════════════════════════════════════════════════
   APP STATE
   Single source of truth for all runtime data.
══════════════════════════════════════════════════════════ */

const AppState = {
  tasks:       [],
  links:       [],
  customName:  '',
  filters: {
    category:  'all',
    status:    'all',
    priority:  'all',
  },
  searchQuery: '',
};

/* ══════════════════════════════════════════════════════════
   UTILITY
══════════════════════════════════════════════════════════ */

/** Format angka jadi dua digit: 9 → "09" */
function pad(n) {
  return String(n).padStart(2, '0');
}

/** Generate UUID (with fallback for older browsers) */
function genId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* ══════════════════════════════════════════════════════════
   GREETING MODULE
   — Real-time clock + date
   — Dynamic salutation (Morning / Afternoon / Evening)
   — Challenge 2: Custom name persisted in localStorage
══════════════════════════════════════════════════════════ */

function getGreetingPhrase(hour) {
  if (hour >= 5  && hour < 12) return 'Good Morning ☀️';
  if (hour >= 12 && hour < 18) return 'Good Afternoon 🌤️';
  return 'Good Evening 🌙';
}

function updateGreeting() {
  const now  = new Date();
  const hour = now.getHours();

  // Clock — HH:MM:SS
  const timeStr = `${pad(hour)}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  // Date — English locale
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  });

  const elTime = document.getElementById('current-time');
  const elDate = document.getElementById('current-date');
  if (elTime) elTime.textContent = timeStr;
  if (elDate) elDate.textContent = dateStr;

  // Only update greeting text when NOT in inline-edit mode
  const editInput = document.getElementById('username-input');
  if (!editInput) _renderGreetingText(hour);
}

/** Render the full greeting h1 with a clickable #username span */
function _renderGreetingText(hour) {
  const elGreeting = document.getElementById('greeting-text');
  if (!elGreeting) return;

  const phrase     = getGreetingPhrase(hour);
  const emojiMatch = phrase.match(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/u);
  const emoji      = emojiMatch ? ` ${emojiMatch[0]}` : '';
  const basePhrase = phrase.replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, '').trim();

  const name = AppState.customName.trim() || 'User';

  // Build: "Good Morning, <span id="username">Budi</span> ☀️"
  elGreeting.textContent = `${basePhrase}, `;

  const nameSpan       = document.createElement('span');
  nameSpan.id          = 'username';
  nameSpan.textContent = name;
  nameSpan.title       = 'Click to change your name';
  nameSpan.setAttribute('role', 'button');
  nameSpan.setAttribute('tabindex', '0');
  nameSpan.setAttribute('aria-label', `Name: ${name}. Click to edit.`);

  const emojiText = document.createTextNode(emoji);

  elGreeting.appendChild(nameSpan);
  elGreeting.appendChild(emojiText);

  // Attach click + keyboard handler for inline edit
  nameSpan.addEventListener('click',   () => _activateNameEdit(nameSpan, hour));
  nameSpan.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      _activateNameEdit(nameSpan, hour);
    }
  });
}

/** Replace the name span with a borderless inline input */
function _activateNameEdit(nameSpan) {
  // Prevent double activation
  if (document.getElementById('username-input')) return;

  const currentName = AppState.customName.trim() || 'User';

  const input         = document.createElement('input');
  input.type          = 'text';
  input.id            = 'username-input';
  input.value         = currentName === 'User' ? '' : currentName;
  input.maxLength     = 30;
  input.placeholder   = 'Your name...';
  input.autocomplete  = 'off';
  input.setAttribute('aria-label', 'Edit name for greeting');

  // Size the input to its content dynamically
  const syncWidth = () => {
    const len = Math.max(input.value.length, input.placeholder.length, 4);
    input.style.width = `${len + 1}ch`;
  };
  input.addEventListener('input', syncWidth);
  syncWidth();

  // Replace span with input
  nameSpan.replaceWith(input);
  input.focus();
  input.select();

  let saved = false;

  const commitEdit = () => {
    if (saved) return;
    saved = true;

    const newName = input.value.trim();
    AppState.customName = newName;
    Storage_Handler.saveName(newName);

    // Re-render the full greeting text
    const hour = new Date().getHours();
    _renderGreetingText(hour);
  };

  input.addEventListener('blur',    commitEdit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') {
      saved = true; // discard changes
      const hour = new Date().getHours();
      _renderGreetingText(hour);
    }
  });
}

/** Challenge 2: no-op — inline edit is wired in _renderGreetingText */
function initCustomName() {
  // Inline edit is attached directly in _renderGreetingText().
  // Nothing to init here — kept for compatibility.
}

/* ══════════════════════════════════════════════════════════
   TOAST SYSTEM
   Sleek slide-in/out notification, auto-dismisses after 10s.
══════════════════════════════════════════════════════════ */

/**
 * Show a toast notification.
 * @param {string} message   - Text to display.
 * @param {string} [type]    - 'warning' | 'info' (default 'warning').
 * @param {number} [duration]- Auto-dismiss after ms (default 10000).
 */
function showToast(message, type = 'warning', duration = 10000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { warning: '⚠️', info: 'ℹ️', success: '✅' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  const iconEl       = document.createElement('span');
  iconEl.className   = 'toast-icon';
  iconEl.textContent = icons[type] || icons.info;
  iconEl.setAttribute('aria-hidden', 'true');

  const msgEl       = document.createElement('span');
  msgEl.className   = 'toast-message';
  msgEl.textContent = message;

  const closeBtn       = document.createElement('button');
  closeBtn.className   = 'toast-close';
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'Close notification');

  const dismiss = () => {
    if (toast.classList.contains('toast-dismissing')) return;
    toast.classList.add('toast-dismissing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };

  closeBtn.addEventListener('click', dismiss);

  toast.append(iconEl, msgEl, closeBtn);
  container.appendChild(toast);

  // Auto-dismiss after `duration` ms
  setTimeout(dismiss, duration);
}

/* ══════════════════════════════════════════════════════════
   FOCUS TIMER MODULE
   — Countdown timer with Start / Stop / Reset
   — [−] / [+] buttons to adjust duration (±1 min)
   — Toast when trying to adjust while running
══════════════════════════════════════════════════════════ */

const timerState = {
  durationMins: 25,       // user-set duration in minutes
  remaining:    25 * 60,  // current countdown in seconds
  intervalId:   null,
  isRunning:    false,
};

function renderTimer() {
  const mins = Math.floor(timerState.remaining / 60);
  const secs = timerState.remaining % 60;

  const elMins = document.getElementById('timer-minutes');
  const elSecs = document.getElementById('timer-seconds');
  if (elMins) elMins.textContent = pad(mins);
  if (elSecs) elSecs.textContent = pad(secs);
}

function updateTimerButtons() {
  const btnStart = document.getElementById('btn-timer-start');
  const btnStop  = document.getElementById('btn-timer-stop');
  if (btnStart) btnStart.disabled = timerState.isRunning;
  if (btnStop)  btnStop.disabled  = !timerState.isRunning;
}

function timerTick() {
  if (timerState.remaining <= 0) {
    stopTimer();
    renderTimer();
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Focus Timer', {
        body: `Your ${timerState.durationMins}-minute session is done! Time for a break.`,
      });
    }
    return;
  }
  timerState.remaining -= 1;
  renderTimer();
}

function startTimer() {
  if (timerState.isRunning || timerState.remaining <= 0) return;
  timerState.isRunning  = true;
  timerState.intervalId = setInterval(timerTick, 1000);
  updateTimerButtons();
}

function stopTimer() {
  if (!timerState.isRunning) return;
  clearInterval(timerState.intervalId);
  timerState.intervalId = null;
  timerState.isRunning  = false;
  updateTimerButtons();
}

function resetTimer() {
  stopTimer();
  timerState.remaining = timerState.durationMins * 60;
  renderTimer();
  updateTimerButtons();
}

function initTimer() {
  // Load saved duration
  timerState.durationMins = Storage_Handler.loadDuration();
  timerState.remaining    = timerState.durationMins * 60;

  renderTimer();
  updateTimerButtons();

  document.getElementById('btn-timer-start')
    ?.addEventListener('click', startTimer);
  document.getElementById('btn-timer-stop')
    ?.addEventListener('click', stopTimer);
  document.getElementById('btn-timer-reset')
    ?.addEventListener('click', resetTimer);

  // +/- duration buttons
  const adjustDuration = (delta) => {
    if (timerState.isRunning) {
      showToast(
        'Please pause or reset the timer before adjusting the duration!',
        'warning',
        10000
      );
      return;
    }
    const newMins = timerState.durationMins + delta;
    if (newMins < 1 || newMins > 60) return;   // clamp 1–60

    timerState.durationMins = newMins;
    timerState.remaining    = newMins * 60;
    Storage_Handler.saveDuration(newMins);
    renderTimer();
  };

  document.getElementById('btn-timer-minus')
    ?.addEventListener('click', () => adjustDuration(-1));
  document.getElementById('btn-timer-plus')
    ?.addEventListener('click', () => adjustDuration(+1));

  // Request notification permission
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

/* ══════════════════════════════════════════════════════════
   TASK MANAGER
   CRUD + toggle + duplicate check (Challenge 1)
══════════════════════════════════════════════════════════ */

const Task_Manager = {

  validateTitle(title) {
    if (!title || !title.trim()) {
      return { valid: false, error: 'Task title cannot be empty.' };
    }
    return { valid: true, error: null };
  },

  /**
   * Challenge 1: Check for duplicate task title (case-insensitive).
   * Returns true if a task with the same trimmed title already exists.
   */
  isDuplicate(title) {
    const normalized = title.trim().toLowerCase();
    return AppState.tasks.some(t => t.title.toLowerCase() === normalized);
  },

  createTask(title, categoryId, priority) {
    const { valid, error } = this.validateTitle(title);
    if (!valid) return { task: null, error };

    // Challenge 1: Prevent duplicate
    if (this.isDuplicate(title)) {
      alert('Task already exists!');
      return { task: null, error: null }; // silently return, alert already shown
    }

    const task = {
      id:         genId(),
      title:      title.trim(),
      categoryId: categoryId || 'work',
      priority:   priority   || 'medium',
      status:     'pending',
      createdAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
    };

    AppState.tasks.push(task);
    Storage_Handler.saveTasks(AppState.tasks);
    return { task, error: null };
  },

  updateTask(id, updates) {
    const idx = AppState.tasks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    AppState.tasks[idx] = {
      ...AppState.tasks[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    Storage_Handler.saveTasks(AppState.tasks);
    return true;
  },

  /**
   * Rename task — also checks for duplicates, excluding self.
   */
  renameTask(id, newTitle) {
    if (!newTitle || !newTitle.trim()) return { ok: false, error: 'Title cannot be empty.' };

    const normalized = newTitle.trim().toLowerCase();
    const duplicate  = AppState.tasks.find(
      t => t.id !== id && t.title.toLowerCase() === normalized
    );
    if (duplicate) {
      alert('Task already exists!');
      return { ok: false, error: null };
    }

    return { ok: this.updateTask(id, { title: newTitle.trim() }), error: null };
  },

  deleteTask(id) {
    const idx = AppState.tasks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    AppState.tasks.splice(idx, 1);
    Storage_Handler.saveTasks(AppState.tasks);
    return true;
  },

  toggleStatus(id) {
    const task = AppState.tasks.find(t => t.id === id);
    if (!task) return false;
    task.status    = task.status === 'pending' ? 'completed' : 'pending';
    task.updatedAt = new Date().toISOString();
    Storage_Handler.saveTasks(AppState.tasks);
    return true;
  },
};

/* ══════════════════════════════════════════════════════════
   LINK MANAGER
   Add / delete quick-links, persisted in localStorage.
══════════════════════════════════════════════════════════ */

const Link_Manager = {
  addLink(name, url) {
    if (!name || !name.trim()) return { link: null, error: 'Link name cannot be empty.' };
    if (!url  || !url.trim())  return { link: null, error: 'URL cannot be empty.' };

    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const link = { id: genId(), name: name.trim(), url: normalizedUrl };
    AppState.links.push(link);
    Storage_Handler.saveLinks(AppState.links);
    return { link, error: null };
  },

  deleteLink(id) {
    const idx = AppState.links.findIndex(l => l.id === id);
    if (idx === -1) return false;
    AppState.links.splice(idx, 1);
    Storage_Handler.saveLinks(AppState.links);
    return true;
  },
};

/* ══════════════════════════════════════════════════════════
   UI RENDERER
══════════════════════════════════════════════════════════ */

const CATEGORY_LABELS = {
  work:     'Work',
  personal: 'Personal',
  health:   'Health',
  study:    'Study',
};

const UI_Renderer = {

  applyFilters(tasks, filters, searchQuery) {
    return tasks.filter(task => {
      if (filters.category !== 'all' && task.categoryId !== filters.category) return false;
      if (filters.status   !== 'all' && task.status     !== filters.status)   return false;
      if (filters.priority !== 'all' && task.priority   !== filters.priority) return false;
      if (searchQuery.trim()) {
        if (!task.title.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
      }
      return true;
    });
  },

  renderSummary(tasks) {
    const total     = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending   = total - completed;
    const percent   = total > 0 ? Math.round((completed / total) * 100) : 0;

    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    set('summary-total',     `${total} task${total !== 1 ? 's' : ''}`);
    set('summary-completed', `${completed} done`);
    set('summary-pending',   `${pending} pending`);
    set('summary-percent',   `${percent}%`);
  },

  /** Build a single task list item, including inline-edit capability */
  renderTaskCard(task) {
    const li = document.createElement('li');
    li.className  = `todo-item${task.status === 'completed' ? ' task-completed' : ''}`;
    li.dataset.id = task.id;

    // ── Checkbox ──
    const checkbox    = document.createElement('input');
    checkbox.type     = 'checkbox';
    checkbox.checked  = task.status === 'completed';
    checkbox.setAttribute('aria-label', `Mark "${task.title}" as done`);
    checkbox.addEventListener('change', () => {
      Task_Manager.toggleStatus(task.id);
      UI_Renderer.renderDashboard();
    });

    // ── Title ──
    const titleSpan       = document.createElement('span');
    titleSpan.className   = 'task-title';
    titleSpan.textContent = task.title;

    // ── Category badge ──
    const catBadge       = document.createElement('span');
    catBadge.className   = 'category-badge';
    catBadge.textContent = CATEGORY_LABELS[task.categoryId] || task.categoryId;

    // ── Priority badge ──
    const prioBadge       = document.createElement('span');
    prioBadge.className   = `priority-badge priority-${task.priority}`;
    prioBadge.textContent = task.priority;

    // ── Edit button ──
    const btnEdit       = document.createElement('button');
    btnEdit.type        = 'button';
    btnEdit.className   = 'btn-edit';
    btnEdit.textContent = '✏️';
    btnEdit.setAttribute('aria-label', `Edit task "${task.title}"`);
    btnEdit.addEventListener('click', () => {
      this._activateInlineEdit(li, task, titleSpan, catBadge, prioBadge, btnEdit, btnDelete);
    });

    // ── Delete button ──
    const btnDelete       = document.createElement('button');
    btnDelete.type        = 'button';
    btnDelete.className   = 'btn-delete';
    btnDelete.textContent = '✕';
    btnDelete.setAttribute('aria-label', `Delete task "${task.title}"`);
    btnDelete.addEventListener('click', () => {
      Task_Manager.deleteTask(task.id);
      UI_Renderer.renderDashboard();
    });

    li.append(checkbox, titleSpan, catBadge, prioBadge, btnEdit, btnDelete);
    return li;
  },

  /** Replace title span with an inline form for editing title, category, and priority */
  _activateInlineEdit(li, task, titleSpan, catBadge, prioBadge, btnEdit, btnDelete) {
    // Hide original display elements while editing
    titleSpan.style.display = 'none';
    catBadge.style.display  = 'none';
    prioBadge.style.display = 'none';
    btnEdit.style.display   = 'none';
    btnDelete.style.display = 'none';

    const form     = document.createElement('div');
    form.className = 'edit-inline-form';

    // ── Title input ──
    const input     = document.createElement('input');
    input.type      = 'text';
    input.value     = task.title;
    input.className = 'edit-inline-input';
    input.setAttribute('aria-label', 'Edit task title');

    // ── Category select ──
    const catSelect = document.createElement('select');
    catSelect.className = 'edit-inline-select';
    catSelect.setAttribute('aria-label', 'Edit category');
    [
      { value: 'work',     label: 'Work'     },
      { value: 'personal', label: 'Personal' },
      { value: 'health',   label: 'Health'   },
      { value: 'study',    label: 'Study'    },
    ].forEach(({ value, label }) => {
      const opt       = document.createElement('option');
      opt.value       = value;
      opt.textContent = label;
      opt.selected    = value === task.categoryId;
      catSelect.appendChild(opt);
    });

    // ── Priority select ──
    const prioSelect = document.createElement('select');
    prioSelect.className = 'edit-inline-select';
    prioSelect.setAttribute('aria-label', 'Edit priority');
    [
      { value: 'high',   label: 'High'   },
      { value: 'medium', label: 'Medium' },
      { value: 'low',    label: 'Low'    },
    ].forEach(({ value, label }) => {
      const opt       = document.createElement('option');
      opt.value       = value;
      opt.textContent = label;
      opt.selected    = value === task.priority;
      prioSelect.appendChild(opt);
    });

    // ── Save button ──
    const btnSave       = document.createElement('button');
    btnSave.type        = 'button';
    btnSave.className   = 'btn-edit-save';
    btnSave.textContent = '✓ Save';
    btnSave.setAttribute('aria-label', 'Save changes');

    // ── Cancel button ──
    const btnCancel       = document.createElement('button');
    btnCancel.type        = 'button';
    btnCancel.className   = 'btn-edit-cancel';
    btnCancel.textContent = '✕';
    btnCancel.setAttribute('aria-label', 'Cancel changes');

    const save = () => {
      const newTitle    = input.value.trim();
      const newCategory = catSelect.value;
      const newPriority = prioSelect.value;

      // Validate title
      if (!newTitle) {
        input.style.borderColor = 'var(--color-danger)';
        input.focus();
        return;
      }

      // Check duplicate title (excluding self)
      const normalized = newTitle.toLowerCase();
      const duplicate  = AppState.tasks.find(
        t => t.id !== task.id && t.title.toLowerCase() === normalized
      );
      if (duplicate) {
        alert('Task already exists!');
        return;
      }

      Task_Manager.updateTask(task.id, {
        title:      newTitle,
        categoryId: newCategory,
        priority:   newPriority,
      });
      UI_Renderer.renderDashboard();
    };

    const cancelEdit = () => {
      form.remove();
      titleSpan.style.display = '';
      catBadge.style.display  = '';
      prioBadge.style.display = '';
      btnEdit.style.display   = '';
      btnDelete.style.display = '';
    };

    btnSave.addEventListener('click', save);
    btnCancel.addEventListener('click', cancelEdit);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter')  save();
      if (e.key === 'Escape') cancelEdit();
    });

    form.append(input, catSelect, prioSelect, btnSave, btnCancel);
    li.insertBefore(form, btnEdit.nextSibling);
    input.focus();
    input.select();
  },

  renderTaskList(tasks, filters, searchQuery) {
    const ul       = document.getElementById('todo-items');
    const emptyMsg = document.getElementById('todo-empty-msg');
    if (!ul) return;

    ul.innerHTML = '';

    if (tasks.length === 0) {
      if (emptyMsg) emptyMsg.textContent = 'No tasks yet. Add your first task! 🚀';
      return;
    }

    const allDone  = tasks.every(t => t.status === 'completed');
    const filtered = this.applyFilters(tasks, filters, searchQuery);

    if (allDone) {
      if (emptyMsg) emptyMsg.textContent = 'All tasks done! Great work! 🎉';
    } else if (filtered.length === 0) {
      if (emptyMsg) emptyMsg.textContent = 'No tasks match the current filters.';
    } else {
      if (emptyMsg) emptyMsg.textContent = '';
    }

    filtered.forEach(task => ul.appendChild(this.renderTaskCard(task)));
  },

  renderLinks(links) {
    const container = document.getElementById('link-shortcuts');
    if (!container) return;
    container.innerHTML = '';

    if (links.length === 0) {
      container.innerHTML = '<p style="color:var(--color-text-dim);font-size:0.875rem;">No links yet. Add your favourite shortcuts!</p>';
      return;
    }

    links.forEach(link => {
      const wrapper         = document.createElement('div');
      wrapper.style.cssText = 'display:flex;align-items:center;gap:4px;flex-shrink:0';

      // Ensure URL always has a protocol
      let safeUrl = (link.url || '').trim();
      if (safeUrl && !/^https?:\/\//i.test(safeUrl)) {
        safeUrl = 'https://' + safeUrl;
      }

      const a       = document.createElement('a');
      a.href        = safeUrl;
      a.textContent = link.name;
      a.target      = '_blank';
      a.rel         = 'noopener noreferrer';
      a.className   = 'link-btn';
      a.style.pointerEvents = 'auto';
      a.setAttribute('aria-label', `Open ${link.name}`);

      const btnDel       = document.createElement('button');
      btnDel.type        = 'button';
      btnDel.className   = 'btn-delete';
      btnDel.textContent = '✕';
      btnDel.style.flexShrink = '0';
      btnDel.setAttribute('aria-label', `Remove link "${link.name}"`);
      btnDel.addEventListener('click', e => {
        e.stopPropagation();
        Link_Manager.deleteLink(link.id);
        UI_Renderer.renderLinks(AppState.links);
      });

      wrapper.append(a, btnDel);
      container.appendChild(wrapper);
    });
  },

  renderDashboard() {
    this.renderSummary(AppState.tasks);
    this.renderTaskList(AppState.tasks, AppState.filters, AppState.searchQuery);
    this.renderLinks(AppState.links);
  },
};

/* ══════════════════════════════════════════════════════════
   NOTIFICATION HELPER
══════════════════════════════════════════════════════════ */

function showStorageWarning(message) {
  const area = document.getElementById('notification-area');
  if (!area) return;
  const banner       = document.createElement('div');
  banner.className   = 'notification-banner';
  banner.textContent = `⚠️ ${message}`;
  area.appendChild(banner);
  setTimeout(() => banner.remove(), 5000);
}

/* ══════════════════════════════════════════════════════════
   EVENT HANDLER SETUP
══════════════════════════════════════════════════════════ */

function initTodoForm() {
  const form    = document.getElementById('todo-form');
  const input   = document.getElementById('todo-input');
  const errEl   = document.getElementById('todo-error');
  const catSel  = document.getElementById('todo-category');
  const prioSel = document.getElementById('todo-priority');

  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (errEl) errEl.textContent = '';

    const title    = input?.value   ?? '';
    const category = catSel?.value  ?? 'work';
    const priority = prioSel?.value ?? 'medium';

    const { error } = Task_Manager.createTask(title, category, priority);

    if (error) {
      if (errEl) errEl.textContent = error;
      return;
    }

    if (input) input.value = '';
    UI_Renderer.renderDashboard();
  });
}

function initFilters() {
  const searchInput    = document.getElementById('search-input');
  const filterCategory = document.getElementById('filter-category');
  const filterStatus   = document.getElementById('filter-status');
  const filterPriority = document.getElementById('filter-priority');

  searchInput?.addEventListener('input', () => {
    AppState.searchQuery = searchInput.value;
    UI_Renderer.renderTaskList(AppState.tasks, AppState.filters, AppState.searchQuery);
  });

  filterCategory?.addEventListener('change', () => {
    AppState.filters.category = filterCategory.value;
    UI_Renderer.renderTaskList(AppState.tasks, AppState.filters, AppState.searchQuery);
  });

  filterStatus?.addEventListener('change', () => {
    AppState.filters.status = filterStatus.value;
    UI_Renderer.renderTaskList(AppState.tasks, AppState.filters, AppState.searchQuery);
  });

  filterPriority?.addEventListener('change', () => {
    AppState.filters.priority = filterPriority.value;
    UI_Renderer.renderTaskList(AppState.tasks, AppState.filters, AppState.searchQuery);
  });
}

function initLinkForm() {
  const form   = document.getElementById('link-form');
  const nameEl = document.getElementById('link-name-input');
  const urlEl  = document.getElementById('link-url-input');
  const errEl  = document.getElementById('link-error');

  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (errEl) errEl.textContent = '';

    const { error } = Link_Manager.addLink(nameEl?.value ?? '', urlEl?.value ?? '');

    if (error) {
      if (errEl) errEl.textContent = error;
      return;
    }

    if (nameEl) nameEl.value = '';
    if (urlEl)  urlEl.value  = '';
    UI_Renderer.renderLinks(AppState.links);
  });
}

/* ══════════════════════════════════════════════════════════
   INIT — entry point
══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Load persisted data ──
  AppState.tasks      = Storage_Handler.loadTasks();
  AppState.links      = Storage_Handler.loadLinks();
  AppState.customName = Storage_Handler.loadName();

  // ── Greeting (runs every second) ──
  updateGreeting();
  setInterval(updateGreeting, 1000);
  initCustomName();       // Challenge 2

  // ── Focus Timer ──
  initTimer();            // Challenge 3

  // ── Dashboard (initial render) ──
  UI_Renderer.renderDashboard();

  // ── Event handlers ──
  initTodoForm();         // Challenge 1 (duplicate check inside Task_Manager)
  initFilters();
  initLinkForm();
});
