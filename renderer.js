// ==========================================================================
// SprintFlow - Scrum Sprint Tracker Renderer
// ==========================================================================

const defaultStatuses = [
  { id: 'todo', label: 'Backlog / To Do', color: '#71717a' },
  { id: 'in_design', label: 'In Design', color: '#a855f7' },
  { id: 'in_dev', label: 'In Development', color: '#3b82f6' },
  { id: 'code_review', label: 'Code Review', color: '#6366f1' },
  { id: 'qa_testing', label: 'Testing / QA', color: '#f59e0b' },
  { id: 'blocked', label: 'Blocked', color: '#ef4444' },
  { id: 'done', label: 'Done / Deployed', color: '#10b981' }
];

// Application State
let appData = {
  theme: 'dark',
  activeSprintId: 'sprint-1',
  statuses: defaultStatuses,
  sprints: [
    {
      id: 'sprint-1',
      name: 'Sprint 1',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      goal: 'Core authentication & responsive design overhaul',
      active: true
    },
    {
      id: 'backlog',
      name: 'Product Backlog',
      startDate: '',
      endDate: '',
      goal: 'Future backlog items',
      active: false
    }
  ],
  tasks: [
    {
      id: 'task-1',
      sprintId: 'sprint-1',
      title: 'Draft OpenAPI 3.1 schema for telemetry v2',
      status: 'todo',
      priority: 'medium',
      note: 'Requirements finalized in sprint planning',
      createdAt: Date.now() - 18000000
    },
    {
      id: 'task-2',
      sprintId: 'sprint-1',
      title: 'Design user activity dashboard analytics UI',
      status: 'in_design',
      priority: 'medium',
      note: 'Figma component library updated',
      createdAt: Date.now() - 15000000
    },
    {
      id: 'task-3',
      sprintId: 'sprint-1',
      title: 'Implement OAuth2 token rotation & session refresh',
      status: 'in_dev',
      priority: 'high',
      note: 'Backend service branch feature/auth-refresh',
      createdAt: Date.now() - 12000000
    },
    {
      id: 'task-4',
      sprintId: 'sprint-1',
      title: 'Refactor Stripe webhook signature validation',
      status: 'code_review',
      priority: 'high',
      note: 'PR #108 awaiting review from senior dev',
      createdAt: Date.now() - 9000000
    },
    {
      id: 'task-5',
      sprintId: 'sprint-1',
      title: 'End-to-end integration tests for checkout flow',
      status: 'qa_testing',
      priority: 'medium',
      note: 'Automated Playwright test suite passing on staging',
      createdAt: Date.now() - 6000000
    },
    {
      id: 'task-6',
      sprintId: 'sprint-1',
      title: 'Staging DB memory connection leak',
      status: 'blocked',
      priority: 'high',
      note: 'Blocked: Waiting on DevOps memory profile analysis',
      createdAt: Date.now() - 3600000
    },
    {
      id: 'task-7',
      sprintId: 'sprint-1',
      title: 'Database schema migration and index optimizations',
      status: 'done',
      priority: 'high',
      note: 'Applied and verified on production cluster',
      createdAt: Date.now() - 1800000
    }
  ]
};

let currentFilterStatus = 'all';
let searchQuery = '';
let currentViewMode = 'grouped'; // 'grouped' (Board) | 'list'

function getStatuses() {
  if (!appData.statuses || !Array.isArray(appData.statuses) || appData.statuses.length === 0) {
    appData.statuses = defaultStatuses;
  }
  return appData.statuses;
}

// DOM references
const elements = {
  // Titlebar
  btnMinimize: document.getElementById('btn-minimize'),
  btnMaximize: document.getElementById('btn-maximize'),
  btnClose: document.getElementById('btn-close'),
  titlebarSprintPill: document.getElementById('titlebar-sprint-pill'),

  // Sidebar
  btnCreateSprint: document.getElementById('btn-create-sprint'),
  sprintNavList: document.getElementById('sprint-nav-list'),
  btnManageStatuses: document.getElementById('btn-manage-statuses'),
  statusFilterList: document.getElementById('status-filter-list'),
  btnOpenStandup: document.getElementById('btn-open-standup'),
  btnExport: document.getElementById('btn-export'),
  btnImport: document.getElementById('btn-import'),
  btnThemeToggle: document.getElementById('btn-theme-toggle'),
  themeIconSun: document.getElementById('theme-icon-sun'),
  themeIconMoon: document.getElementById('theme-icon-moon'),
  themeLabelText: document.getElementById('theme-label-text'),

  // Header
  currentSprintTitle: document.getElementById('current-sprint-title'),
  currentSprintDates: document.getElementById('current-sprint-dates'),
  sprintHeaderActions: document.getElementById('sprint-header-actions'),
  btnEditCurrentSprint: document.getElementById('btn-edit-current-sprint'),
  btnDeleteCurrentSprint: document.getElementById('btn-delete-current-sprint'),
  viewModeGrouped: document.getElementById('view-mode-grouped'),
  viewModeList: document.getElementById('view-mode-list'),
  btnQuickStandup: document.getElementById('btn-quick-standup'),
  sprintProgressFill: document.getElementById('sprint-progress-fill'),
  sprintProgressText: document.getElementById('sprint-progress-text'),

  // Toolbar
  searchInput: document.getElementById('search-input'),
  searchClear: document.getElementById('search-clear'),
  filterStatusTag: document.getElementById('filter-status-tag'),
  filterStatusLabel: document.getElementById('filter-status-label'),
  filterClearBtn: document.getElementById('filter-clear-btn'),

  // Task Creator
  taskCreatorForm: document.getElementById('task-creator-form'),
  inputTaskTitle: document.getElementById('input-task-title'),
  inputTaskStatus: document.getElementById('input-task-status'),
  inputTaskPriority: document.getElementById('input-task-priority'),
  inputTaskNote: document.getElementById('input-task-note'),

  // Tasks views
  boardView: document.getElementById('board-view'),
  flatListView: document.getElementById('flat-list-view'),
  emptyState: document.getElementById('empty-state'),
  emptyStateText: document.getElementById('empty-state-text'),

  // Modals
  standupModal: document.getElementById('standup-modal'),
  btnCloseStandup: document.getElementById('btn-close-standup'),
  btnCancelStandup: document.getElementById('btn-cancel-standup'),
  standupText: document.getElementById('standup-text'),
  btnCopyStandupModal: document.getElementById('btn-copy-standup-modal'),

  createSprintModal: document.getElementById('create-sprint-modal'),
  createSprintForm: document.getElementById('create-sprint-form'),
  btnCloseCreateSprint: document.getElementById('btn-close-create-sprint'),
  btnCancelCreateSprint: document.getElementById('btn-cancel-create-sprint'),
  sprintNameInput: document.getElementById('sprint-name-input'),
  sprintStartDate: document.getElementById('sprint-start-date'),
  sprintEndDate: document.getElementById('sprint-end-date'),
  sprintGoalInput: document.getElementById('sprint-goal-input'),

  editSprintModal: document.getElementById('edit-sprint-modal'),
  editSprintForm: document.getElementById('edit-sprint-form'),
  btnCloseEditSprint: document.getElementById('btn-close-edit-sprint'),
  btnCancelEditSprint: document.getElementById('btn-cancel-edit-sprint'),
  editSprintId: document.getElementById('edit-sprint-id'),
  editSprintName: document.getElementById('edit-sprint-name'),
  editSprintStart: document.getElementById('edit-sprint-start'),
  editSprintEnd: document.getElementById('edit-sprint-end'),
  editSprintGoal: document.getElementById('edit-sprint-goal'),

  manageStatusesModal: document.getElementById('manage-statuses-modal'),
  btnCloseManageStatuses: document.getElementById('btn-close-manage-statuses'),
  btnDoneManageStatuses: document.getElementById('btn-done-manage-statuses'),
  btnResetDefaultStatuses: document.getElementById('btn-reset-default-statuses'),
  addStatusForm: document.getElementById('add-status-form'),
  newStatusName: document.getElementById('new-status-name'),
  newStatusColor: document.getElementById('new-status-color'),
  customStatusList: document.getElementById('custom-status-list'),

  editTaskModal: document.getElementById('edit-task-modal'),
  editTaskForm: document.getElementById('edit-task-form'),
  btnCloseEditTask: document.getElementById('btn-close-edit-task'),
  btnCancelEditTask: document.getElementById('btn-cancel-edit-task'),
  editTaskId: document.getElementById('edit-task-id'),
  editTaskTitle: document.getElementById('edit-task-title'),
  editTaskStatus: document.getElementById('edit-task-status'),
  editTaskPriority: document.getElementById('edit-task-priority'),
  editTaskSprint: document.getElementById('edit-task-sprint'),
  editTaskNote: document.getElementById('edit-task-note'),

  toastHub: document.getElementById('toast-hub')
};

// ==========================================================================
// Initialization & Persistence
// ==========================================================================

async function initApp() {
  setupWindowControls();
  setupEventListeners();

  try {
    if (window.electronAPI && window.electronAPI.loadTodos) {
      const stored = await window.electronAPI.loadTodos();
      if (stored && stored.sprints && stored.tasks) {
        appData = stored;
      } else if (stored && Array.isArray(stored)) {
        appData.tasks = stored.map(t => ({
          ...t,
          sprintId: 'sprint-1',
          status: t.completed ? 'done' : 'in_dev',
          note: ''
        }));
        await saveAppData();
      } else {
        await saveAppData();
      }
    }
  } catch (err) {
    console.error('Persistence error:', err);
  }

  // Ensure default statuses exist
  if (!appData.statuses || appData.statuses.length === 0) {
    appData.statuses = defaultStatuses;
  }

  // Apply saved theme
  applyTheme(appData.theme || 'dark');

  // Pre-fill next sprint dates
  const today = new Date();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  elements.sprintStartDate.value = today.toISOString().slice(0, 10);
  elements.sprintEndDate.value = nextWeek.toISOString().slice(0, 10);

  render();
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (elements.themeIconSun && elements.themeIconMoon && elements.themeLabelText) {
    if (theme === 'light') {
      elements.themeIconSun.style.display = 'block';
      elements.themeIconMoon.style.display = 'none';
      elements.themeLabelText.textContent = 'Light';
    } else {
      elements.themeIconSun.style.display = 'none';
      elements.themeIconMoon.style.display = 'block';
      elements.themeLabelText.textContent = 'Dark';
    }
  }
}

async function saveAppData() {
  try {
    if (window.electronAPI && window.electronAPI.saveTodos) {
      await window.electronAPI.saveTodos(appData);
    } else {
      localStorage.setItem('sprintflow_data', JSON.stringify(appData));
    }
  } catch (err) {
    console.error(err);
  }
}

function setupWindowControls() {
  if (!window.electronAPI) return;
  elements.btnMinimize?.addEventListener('click', () => window.electronAPI.minimizeWindow());
  elements.btnMaximize?.addEventListener('click', () => window.electronAPI.toggleMaximizeWindow());
  elements.btnClose?.addEventListener('click', () => window.electronAPI.closeWindow());
}

// ==========================================================================
// Event Listeners
// ==========================================================================

function setupEventListeners() {
  // Theme Toggle
  elements.btnThemeToggle?.addEventListener('click', async () => {
    const nextTheme = appData.theme === 'light' ? 'dark' : 'light';
    appData.theme = nextTheme;
    applyTheme(nextTheme);
    await saveAppData();
    showToast(nextTheme === 'light' ? 'Switched to light mode ☀️' : 'Switched to dark mode 🌙');
  });

  // Clear status filter tag
  elements.filterClearBtn?.addEventListener('click', () => {
    currentFilterStatus = 'all';
    render();
  });

  // View modes
  elements.viewModeGrouped?.addEventListener('click', () => {
    currentViewMode = 'grouped';
    elements.viewModeGrouped.classList.add('active');
    elements.viewModeList.classList.remove('active');
    renderViews();
  });

  elements.viewModeList?.addEventListener('click', () => {
    currentViewMode = 'list';
    elements.viewModeList.classList.add('active');
    elements.viewModeGrouped.classList.remove('active');
    renderViews();
  });

  // Search
  elements.searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    elements.searchClear.style.display = searchQuery ? 'block' : 'none';
    render();
  });

  elements.searchClear?.addEventListener('click', () => {
    elements.searchInput.value = '';
    searchQuery = '';
    elements.searchClear.style.display = 'none';
    render();
  });

  // Create Task
  elements.taskCreatorForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = elements.inputTaskTitle.value.trim();
    if (!title) return;

    const statuses = getStatuses();
    const defaultStatus = statuses[0]?.id || 'todo';

    const newTask = {
      id: 'task-' + Date.now(),
      sprintId: appData.activeSprintId,
      title: title,
      status: elements.inputTaskStatus.value || defaultStatus,
      priority: elements.inputTaskPriority.value,
      note: elements.inputTaskNote.value.trim(),
      createdAt: Date.now()
    };

    appData.tasks.unshift(newTask);
    await saveAppData();

    elements.inputTaskTitle.value = '';
    elements.inputTaskNote.value = '';
    showToast('Task added to sprint');
    render();
  });

  // Sprints creation modal
  elements.btnCreateSprint?.addEventListener('click', () => {
    elements.createSprintModal.style.display = 'flex';
    elements.sprintNameInput.focus();
  });

  elements.btnCloseCreateSprint?.addEventListener('click', () => elements.createSprintModal.style.display = 'none');
  elements.btnCancelCreateSprint?.addEventListener('click', () => elements.createSprintModal.style.display = 'none');

  elements.createSprintForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = elements.sprintNameInput.value.trim();
    if (!name) return;

    const newSprint = {
      id: 'sprint-' + Date.now(),
      name: name,
      startDate: elements.sprintStartDate.value,
      endDate: elements.sprintEndDate.value,
      goal: elements.sprintGoalInput.value.trim(),
      active: true
    };

    appData.sprints.push(newSprint);
    appData.activeSprintId = newSprint.id;
    await saveAppData();

    elements.createSprintModal.style.display = 'none';
    elements.sprintNameInput.value = '';
    elements.sprintGoalInput.value = '';
    showToast(`Created ${name}`);
    render();
  });

  // Edit Sprint Header Actions
  elements.btnEditCurrentSprint?.addEventListener('click', () => {
    const currentSprint = appData.sprints.find(s => s.id === appData.activeSprintId);
    if (currentSprint) openEditSprintModal(currentSprint);
  });

  elements.btnDeleteCurrentSprint?.addEventListener('click', () => {
    deleteSprint(appData.activeSprintId);
  });

  // Edit Sprint Modal Form
  elements.btnCloseEditSprint?.addEventListener('click', () => elements.editSprintModal.style.display = 'none');
  elements.btnCancelEditSprint?.addEventListener('click', () => elements.editSprintModal.style.display = 'none');

  elements.editSprintForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = elements.editSprintId.value;
    const sprint = appData.sprints.find(s => s.id === id);
    if (sprint) {
      sprint.name = elements.editSprintName.value.trim();
      sprint.startDate = elements.editSprintStart.value;
      sprint.endDate = elements.editSprintEnd.value;
      sprint.goal = elements.editSprintGoal.value.trim();

      await saveAppData();
      elements.editSprintModal.style.display = 'none';
      showToast('Sprint details updated');
      render();
    }
  });

  // Manage Development Statuses
  elements.btnManageStatuses?.addEventListener('click', openManageStatusesModal);
  elements.btnCloseManageStatuses?.addEventListener('click', () => elements.manageStatusesModal.style.display = 'none');
  elements.btnDoneManageStatuses?.addEventListener('click', () => elements.manageStatusesModal.style.display = 'none');

  elements.addStatusForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = elements.newStatusName.value.trim();
    const color = elements.newStatusColor.value;
    if (!name) return;

    const id = 'status_' + Date.now();
    appData.statuses.push({ id, label: name, color });
    await saveAppData();

    elements.newStatusName.value = '';
    showToast(`Added status: ${name}`);
    renderManageStatusesList();
    render();
  });

  elements.btnResetDefaultStatuses?.addEventListener('click', async () => {
    if (confirm('Reset development statuses to default SDLC statuses?')) {
      appData.statuses = JSON.parse(JSON.stringify(defaultStatuses));
      await saveAppData();
      showToast('Reset to default SDLC statuses');
      renderManageStatusesList();
      render();
    }
  });

  // Standup Generator
  elements.btnOpenStandup?.addEventListener('click', openStandupModal);
  elements.btnQuickStandup?.addEventListener('click', copyStandupDirect);
  elements.btnCloseStandup?.addEventListener('click', () => elements.standupModal.style.display = 'none');
  elements.btnCancelStandup?.addEventListener('click', () => elements.standupModal.style.display = 'none');

  elements.btnCopyStandupModal?.addEventListener('click', () => {
    navigator.clipboard.writeText(elements.standupText.value);
    showToast('Standup copied to clipboard! 📋');
  });

  // Edit Task Modal
  elements.btnCloseEditTask?.addEventListener('click', () => elements.editTaskModal.style.display = 'none');
  elements.btnCancelEditTask?.addEventListener('click', () => elements.editTaskModal.style.display = 'none');

  elements.editTaskForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskId = elements.editTaskId.value;
    const task = appData.tasks.find(t => t.id === taskId);
    if (task) {
      task.title = elements.editTaskTitle.value.trim();
      task.status = elements.editTaskStatus.value;
      task.priority = elements.editTaskPriority.value;
      task.sprintId = elements.editTaskSprint.value;
      task.note = elements.editTaskNote.value.trim();
      await saveAppData();
      elements.editTaskModal.style.display = 'none';
      showToast('Task updated');
      render();
    }
  });

  // Export / Import
  elements.btnExport?.addEventListener('click', async () => {
    if (window.electronAPI && window.electronAPI.exportTodos) {
      const res = await window.electronAPI.exportTodos(appData);
      if (res.success) showToast('Exported sprint backup');
    }
  });

  elements.btnImport?.addEventListener('click', async () => {
    if (window.electronAPI && window.electronAPI.importTodos) {
      const res = await window.electronAPI.importTodos();
      if (res.success && res.data) {
        appData = res.data;
        await saveAppData();
        showToast('Sprint backup imported');
        render();
      }
    }
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      elements.searchInput.focus();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      elements.inputTaskTitle.focus();
    } else if (e.key === 'Escape') {
      elements.standupModal.style.display = 'none';
      elements.createSprintModal.style.display = 'none';
      elements.editSprintModal.style.display = 'none';
      elements.manageStatusesModal.style.display = 'none';
      elements.editTaskModal.style.display = 'none';
      elements.searchInput.blur();
    }
  });
}

// ==========================================================================
// Sprint Edit & Delete Handlers
// ==========================================================================

function openEditSprintModal(sprint) {
  elements.editSprintId.value = sprint.id;
  elements.editSprintName.value = sprint.name;
  elements.editSprintStart.value = sprint.startDate || '';
  elements.editSprintEnd.value = sprint.endDate || '';
  elements.editSprintGoal.value = sprint.goal || '';

  elements.editSprintModal.style.display = 'flex';
  elements.editSprintName.focus();
}

async function deleteSprint(sprintId) {
  if (sprintId === 'backlog') {
    showToast('The Product Backlog cannot be deleted.');
    return;
  }

  const sprint = appData.sprints.find(s => s.id === sprintId);
  const sprintName = sprint ? sprint.name : 'this sprint';

  const taskCount = appData.tasks.filter(t => t.sprintId === sprintId).length;
  const msg = taskCount > 0
    ? `Delete "${sprintName}"? Its ${taskCount} task(s) will be safely moved to the Product Backlog.`
    : `Are you sure you want to delete "${sprintName}"?`;

  if (!confirm(msg)) return;

  // Move all tasks to backlog
  appData.tasks.forEach(t => {
    if (t.sprintId === sprintId) {
      t.sprintId = 'backlog';
    }
  });

  // Remove sprint
  appData.sprints = appData.sprints.filter(s => s.id !== sprintId);

  // If active sprint was deleted, switch to the next sprint or backlog
  if (appData.activeSprintId === sprintId) {
    const nextSprint = appData.sprints.find(s => s.id !== 'backlog') || appData.sprints[0] || { id: 'backlog' };
    appData.activeSprintId = nextSprint.id;
  }

  await saveAppData();
  showToast(`Deleted ${sprintName}`);
  render();
}

// ==========================================================================
// Manage Development Statuses
// ==========================================================================

function openManageStatusesModal() {
  renderManageStatusesList();
  elements.manageStatusesModal.style.display = 'flex';
  elements.newStatusName.focus();
}

function renderManageStatusesList() {
  const statuses = getStatuses();
  elements.customStatusList.innerHTML = '';

  statuses.forEach((st, idx) => {
    const row = document.createElement('div');
    row.className = 'custom-status-row';

    row.innerHTML = `
      <div class="status-row-left">
        <input type="color" class="status-color-picker" value="${st.color || '#71717a'}" title="Change status color">
        <span class="status-row-name">${escapeHtml(st.label)}</span>
      </div>
      <div class="status-row-actions">
        <button class="status-btn-icon btn-rename-status" title="Rename status">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="status-btn-icon del btn-del-status" title="Delete status">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    // Change color event
    const colorPicker = row.querySelector('.status-color-picker');
    colorPicker.addEventListener('change', async (e) => {
      st.color = e.target.value;
      await saveAppData();
      render();
    });

    // Rename event
    const renameBtn = row.querySelector('.btn-rename-status');
    renameBtn.addEventListener('click', async () => {
      const newName = prompt('Rename status:', st.label);
      if (newName && newName.trim()) {
        st.label = newName.trim();
        await saveAppData();
        renderManageStatusesList();
        render();
      }
    });

    // Delete event
    const delBtn = row.querySelector('.btn-del-status');
    delBtn.addEventListener('click', async () => {
      if (statuses.length <= 1) {
        alert('At least one status is required in the workflow.');
        return;
      }

      const tasksUsingStatus = appData.tasks.filter(t => t.status === st.id).length;
      const targetFallback = statuses.find(s => s.id !== st.id)?.id || 'todo';

      const promptMsg = tasksUsingStatus > 0
        ? `Delete status "${st.label}"? ${tasksUsingStatus} task(s) currently using this status will be reassigned to "${statuses.find(s => s.id === targetFallback)?.label}".`
        : `Delete status "${st.label}"?`;

      if (!confirm(promptMsg)) return;

      // Reassign tasks
      appData.tasks.forEach(t => {
        if (t.status === st.id) t.status = targetFallback;
      });

      appData.statuses = appData.statuses.filter(s => s.id !== st.id);
      if (currentFilterStatus === st.id) currentFilterStatus = 'all';

      await saveAppData();
      showToast(`Deleted status ${st.label}`);
      renderManageStatusesList();
      render();
    });

    elements.customStatusList.appendChild(row);
  });
}

// ==========================================================================
// Standup Text Generator
// ==========================================================================

function generateStandupText() {
  const sprint = appData.sprints.find(s => s.id === appData.activeSprintId) || { name: 'Current Sprint' };
  const sprintTasks = appData.tasks.filter(t => t.sprintId === appData.activeSprintId);
  const statuses = getStatuses();

  const doneTasks = sprintTasks.filter(t => t.status === 'done');
  const activeDevTasks = sprintTasks.filter(t => ['in_dev', 'in_design'].includes(t.status) || (!['done', 'blocked', 'todo'].includes(t.status)));
  const blockedTasks = sprintTasks.filter(t => t.status === 'blocked');

  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  let text = `🚀 Daily Standup · ${sprint.name} (${todayStr})\n\n`;

  // Completed
  text += `✅ Completed / Deployed:\n`;
  if (doneTasks.length === 0) {
    text += `  • (None completed today yet)\n`;
  } else {
    doneTasks.forEach(t => {
      text += `  • ${t.title}${t.note ? ` (${t.note})` : ''}\n`;
    });
  }
  text += `\n`;

  // In Progress & Active Work
  text += `💻 Active Sprint Work:\n`;
  if (activeDevTasks.length === 0) {
    text += `  • (None in active dev)\n`;
  } else {
    activeDevTasks.forEach(t => {
      const statusLabel = statuses.find(s => s.id === t.status)?.label || t.status;
      text += `  • [${statusLabel}] ${t.title}${t.note ? ` — Note: ${t.note}` : ''}\n`;
    });
  }
  text += `\n`;

  // Blockers
  text += `⚠️ Blockers / Blocked Items:\n`;
  if (blockedTasks.length === 0) {
    text += `  • None / No blockers 🎉\n`;
  } else {
    blockedTasks.forEach(t => {
      text += `  • [Blocked] ${t.title}${t.note ? ` — ${t.note}` : ''}\n`;
    });
  }

  return text;
}

function openStandupModal() {
  elements.standupText.value = generateStandupText();
  elements.standupModal.style.display = 'flex';
}

function copyStandupDirect() {
  const text = generateStandupText();
  navigator.clipboard.writeText(text);
  showToast('Standup update copied to clipboard! 📋');
}

// ==========================================================================
// Rendering
// ==========================================================================

function render() {
  renderSprintNav();
  renderSprintHeader();
  renderSidebarStatusFilters();
  renderTaskCreatorOptions();
  renderViews();
}

function renderSprintNav() {
  elements.sprintNavList.innerHTML = '';
  appData.sprints.forEach(sprint => {
    const isBacklog = sprint.id === 'backlog';
    const isActive = sprint.id === appData.activeSprintId;

    const div = document.createElement('div');
    div.className = `sprint-nav-item ${isActive ? 'active' : ''}`;
    const taskCount = appData.tasks.filter(t => t.sprintId === sprint.id).length;

    let actionsHtml = '';
    if (!isBacklog) {
      actionsHtml = `
        <div class="sprint-actions-hover">
          <button class="sprint-btn-mini btn-edit-sprint" title="Edit sprint">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="sprint-btn-mini del btn-del-sprint" title="Delete sprint">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
    }

    div.innerHTML = `
      <span class="sprint-nav-title">${escapeHtml(sprint.name)}</span>
      ${actionsHtml}
      <span class="sprint-tag-status">${taskCount}</span>
    `;

    // Click to select sprint
    div.addEventListener('click', (e) => {
      if (e.target.closest('.sprint-actions-hover')) return;
      appData.activeSprintId = sprint.id;
      render();
    });

    // Edit sprint
    if (!isBacklog) {
      div.querySelector('.btn-edit-sprint')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditSprintModal(sprint);
      });

      div.querySelector('.btn-del-sprint')?.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSprint(sprint.id);
      });
    }

    elements.sprintNavList.appendChild(div);
  });
}

function renderSprintHeader() {
  const currentSprint = appData.sprints.find(s => s.id === appData.activeSprintId) || { name: 'Sprint' };
  elements.currentSprintTitle.textContent = currentSprint.name;
  elements.titlebarSprintPill.textContent = currentSprint.name;

  if (currentSprint.startDate && currentSprint.endDate) {
    elements.currentSprintDates.textContent = `${currentSprint.startDate} - ${currentSprint.endDate}`;
  } else {
    elements.currentSprintDates.textContent = currentSprint.goal || 'Backlog';
  }

  // Hide or show sprint header delete button for backlog
  if (currentSprint.id === 'backlog') {
    elements.sprintHeaderActions.style.display = 'none';
  } else {
    elements.sprintHeaderActions.style.display = 'inline-flex';
  }

  // Progress metrics
  const sprintTasks = appData.tasks.filter(t => t.sprintId === appData.activeSprintId);
  const total = sprintTasks.length;
  const doneCount = sprintTasks.filter(t => t.status === 'done').length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  elements.sprintProgressFill.style.width = `${percent}%`;
  elements.sprintProgressText.textContent = `${doneCount} of ${total} done (${percent}%)`;
}

function renderSidebarStatusFilters() {
  const statuses = getStatuses();
  const sprintTasks = appData.tasks.filter(t => t.sprintId === appData.activeSprintId);

  elements.statusFilterList.innerHTML = '';

  // All Tasks button
  const allBtn = document.createElement('button');
  allBtn.className = `status-filter-item ${currentFilterStatus === 'all' ? 'active' : ''}`;
  allBtn.innerHTML = `
    <span class="status-filter-dot dot-all"></span>
    <span class="filter-label">All Tasks</span>
    <span class="filter-count">${sprintTasks.length}</span>
  `;
  allBtn.addEventListener('click', () => {
    currentFilterStatus = 'all';
    render();
  });
  elements.statusFilterList.appendChild(allBtn);

  // Each dynamic status
  statuses.forEach(st => {
    const count = sprintTasks.filter(t => t.status === st.id).length;
    const btn = document.createElement('button');
    btn.className = `status-filter-item ${currentFilterStatus === st.id ? 'active' : ''}`;
    btn.innerHTML = `
      <span class="status-filter-dot" style="background-color: ${st.color || '#71717a'}"></span>
      <span class="filter-label">${escapeHtml(st.label)}</span>
      <span class="filter-count ${st.id === 'blocked' && count > 0 ? 'alert-count' : ''}">${count}</span>
    `;
    btn.addEventListener('click', () => {
      currentFilterStatus = st.id;
      render();
    });
    elements.statusFilterList.appendChild(btn);
  });

  if (currentFilterStatus !== 'all') {
    elements.filterStatusTag.style.display = 'flex';
    const label = statuses.find(s => s.id === currentFilterStatus)?.label || currentFilterStatus;
    elements.filterStatusLabel.textContent = `Status: ${label}`;
  } else {
    elements.filterStatusTag.style.display = 'none';
  }
}

function renderTaskCreatorOptions() {
  const statuses = getStatuses();
  const currentVal = elements.inputTaskStatus.value;

  elements.inputTaskStatus.innerHTML = statuses.map(s =>
    `<option value="${s.id}" ${s.id === currentVal ? 'selected' : ''}>${escapeHtml(s.label)}</option>`
  ).join('');
}

function getFilteredTasks() {
  let list = appData.tasks.filter(t => t.sprintId === appData.activeSprintId);

  if (currentFilterStatus !== 'all') {
    list = list.filter(t => t.status === currentFilterStatus);
  }

  if (searchQuery) {
    list = list.filter(t => {
      const matchTitle = t.title.toLowerCase().includes(searchQuery);
      const matchNote = (t.note || '').toLowerCase().includes(searchQuery);
      return matchTitle || matchNote;
    });
  }

  return list;
}

function renderViews() {
  const tasks = getFilteredTasks();

  if (tasks.length === 0) {
    elements.emptyState.style.display = 'flex';
    elements.emptyStateText.textContent = searchQuery
      ? `No tasks matching "${searchQuery}"`
      : 'No tasks found for this status in current sprint.';
    elements.boardView.style.display = 'none';
    elements.flatListView.style.display = 'none';
    return;
  }

  elements.emptyState.style.display = 'none';

  if (currentViewMode === 'grouped') {
    elements.boardView.style.display = 'grid';
    elements.flatListView.style.display = 'none';
    renderBoardView(tasks);
  } else {
    elements.boardView.style.display = 'none';
    elements.flatListView.style.display = 'flex';
    renderFlatListView(tasks);
  }
}

// Render Kanban / Swimlane Board View
function renderBoardView(tasks) {
  const statuses = getStatuses();
  elements.boardView.innerHTML = '';

  const columnsToShow = currentFilterStatus === 'all'
    ? statuses
    : statuses.filter(s => s.id === currentFilterStatus);

  columnsToShow.forEach(colDef => {
    const colTasks = tasks.filter(t => t.status === colDef.id);

    const colEl = document.createElement('div');
    colEl.className = 'board-column';
    colEl.innerHTML = `
      <div class="column-header">
        <div class="col-title-wrap">
          <span class="col-dot" style="background-color: ${colDef.color || '#71717a'}"></span>
          <span class="col-name">${escapeHtml(colDef.label)}</span>
        </div>
        <div class="col-header-right">
          <span class="col-count">${colTasks.length}</span>
          <button class="col-add-btn" title="Add task to ${escapeHtml(colDef.label)}">+</button>
        </div>
      </div>
      <div class="column-cards" id="cards-${colDef.id}"></div>
    `;

    const cardsContainer = colEl.querySelector('.column-cards');
    
    if (colTasks.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'empty-column-placeholder';
      placeholder.textContent = `+ Add to ${colDef.label}`;
      placeholder.addEventListener('click', () => {
        elements.inputTaskStatus.value = colDef.id;
        elements.inputTaskTitle.focus();
        elements.inputTaskTitle.scrollIntoView({ behavior: 'smooth' });
      });
      cardsContainer.appendChild(placeholder);
    } else {
      colTasks.forEach(task => {
        cardsContainer.appendChild(createTaskCard(task));
      });
    }

    // Column Header + Button click
    colEl.querySelector('.col-add-btn').addEventListener('click', () => {
      elements.inputTaskStatus.value = colDef.id;
      elements.inputTaskTitle.focus();
      elements.inputTaskTitle.scrollIntoView({ behavior: 'smooth' });
    });

    elements.boardView.appendChild(colEl);
  });
}

function createTaskCard(task) {
  const statuses = getStatuses();
  const card = document.createElement('div');
  card.className = 'task-card';

  const noteHtml = task.note
    ? `<div class="card-note ${task.status === 'blocked' ? 'blocked' : ''}">${escapeHtml(task.note)}</div>`
    : '';

  const priorityHtml = task.priority === 'high'
    ? `<span class="p-tag high">High</span>`
    : (task.priority === 'medium' ? `<span class="p-tag medium">Med</span>` : '');

  // Status changer options
  const statusOptions = statuses.map(s =>
    `<option value="${s.id}" ${s.id === task.status ? 'selected' : ''}>${escapeHtml(s.label)}</option>`
  ).join('');

  card.innerHTML = `
    <div class="card-top-row">
      <span class="card-title">${escapeHtml(task.title)}</span>
      <div class="card-actions">
        <button class="card-btn btn-edit" title="Edit task">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="card-btn btn-del" title="Delete task">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
    ${noteHtml}
    <div class="card-bottom-row">
      <select class="status-changer-select" title="Change status">
        ${statusOptions}
      </select>
      ${priorityHtml}
    </div>
  `;

  // Status Change Event
  const statusSelect = card.querySelector('.status-changer-select');
  statusSelect.addEventListener('change', async (e) => {
    task.status = e.target.value;
    await saveAppData();
    render();
  });

  // Edit Event
  card.querySelector('.btn-edit').addEventListener('click', (e) => {
    e.stopPropagation();
    openEditTaskModal(task);
  });

  // Delete Event
  card.querySelector('.btn-del').addEventListener('click', async (e) => {
    e.stopPropagation();
    appData.tasks = appData.tasks.filter(t => t.id !== task.id);
    await saveAppData();
    showToast('Task removed');
    render();
  });

  return card;
}

// Render Flat List View
function renderFlatListView(tasks) {
  const statuses = getStatuses();
  elements.flatListView.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'flat-item';

    const colDef = statuses.find(s => s.id === task.status) || { label: task.status, color: '#71717a' };

    li.innerHTML = `
      <span class="flat-status-badge" style="background: rgba(255,255,255,0.08); color: ${colDef.color}; border: 1px solid ${colDef.color}40">${escapeHtml(colDef.label)}</span>
      <span class="flat-title">${escapeHtml(task.title)}</span>
      ${task.note ? `<span class="flat-note">💬 ${escapeHtml(task.note)}</span>` : ''}
      <button class="card-btn btn-edit-flat" title="Edit">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      </button>
    `;

    li.querySelector('.btn-edit-flat').addEventListener('click', () => openEditTaskModal(task));
    elements.flatListView.appendChild(li);
  });
}

function openEditTaskModal(task) {
  const statuses = getStatuses();
  elements.editTaskId.value = task.id;
  elements.editTaskTitle.value = task.title;
  elements.editTaskPriority.value = task.priority;
  elements.editTaskNote.value = task.note || '';

  // Populate dynamic statuses
  elements.editTaskStatus.innerHTML = statuses.map(s =>
    `<option value="${s.id}" ${s.id === task.status ? 'selected' : ''}>${escapeHtml(s.label)}</option>`
  ).join('');

  // Populate sprint selector
  elements.editTaskSprint.innerHTML = appData.sprints.map(s =>
    `<option value="${s.id}" ${s.id === task.sprintId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`
  ).join('');

  elements.editTaskModal.style.display = 'flex';
  elements.editTaskTitle.focus();
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast-item';
  t.textContent = msg;
  elements.toastHub.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

document.addEventListener('DOMContentLoaded', initApp);
