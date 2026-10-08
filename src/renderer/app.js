/**
 * Application Entry Point - Modular architecture orchestrator
 */
import { store } from './state/store.js';
import { escapeHtml, generateId } from './utils/helpers.js';
import { renderSidebar, setupSidebarListeners, handleDeleteSprint } from './components/sidebar.js';
import { renderBoardView } from './components/boardView.js';
import { renderListView } from './components/listView.js';
import { setupModals, openEditSprintModal } from './components/modals.js';
import { showToast } from './components/toast.js';

// --- Window Controls (Native Titlebar) ---
function setupWindowControls() {
  if (!window.electronAPI) return;
  document.getElementById('btn-minimize')?.addEventListener('click', () => window.electronAPI.minimizeWindow());
  document.getElementById('btn-maximize')?.addEventListener('click', () => window.electronAPI.toggleMaximizeWindow());
  document.getElementById('btn-close')?.addEventListener('click', () => window.electronAPI.closeWindow());
}

// --- Header & Progress Render ---
function renderHeader(state) {
  const currentSprint = state.sprints.find(s => s.id === state.activeSprintId) || { name: 'Sprint' };
  const titleEl = document.getElementById('current-sprint-title');
  const datesEl = document.getElementById('current-sprint-dates');
  const pillEl = document.getElementById('titlebar-sprint-pill');
  const actionsEl = document.getElementById('sprint-header-actions');
  const progressFill = document.getElementById('sprint-progress-fill');
  const progressText = document.getElementById('sprint-progress-text');

  if (titleEl) titleEl.textContent = currentSprint.name;
  if (pillEl) pillEl.textContent = currentSprint.name;

  if (datesEl) {
    if (currentSprint.startDate && currentSprint.endDate) {
      datesEl.textContent = `${currentSprint.startDate} - ${currentSprint.endDate}`;
    } else {
      datesEl.textContent = currentSprint.goal || 'Backlog';
    }
  }

  if (actionsEl) {
    actionsEl.style.display = currentSprint.id === 'backlog' ? 'none' : 'inline-flex';
  }

  // Progress metrics
  const sprintTasks = state.tasks.filter(t => t.sprintId === state.activeSprintId);
  const total = sprintTasks.length;
  const doneCount = sprintTasks.filter(t => t.status === 'done').length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  if (progressFill) progressFill.style.width = `${percent}%`;
  if (progressText) progressText.textContent = `${doneCount} of ${total} done (${percent}%)`;
}

// --- Task Creator Options Sync ---
function renderTaskCreatorOptions(state) {
  const select = document.getElementById('input-task-status');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = state.statuses.map(s =>
    `<option value="${s.id}" ${s.id === currentVal ? 'selected' : ''}>${escapeHtml(s.label)}</option>`
  ).join('');
}

// --- Toolbar & Filters ---
function renderToolbar(state) {
  const filterTag = document.getElementById('filter-status-tag');
  const filterLabel = document.getElementById('filter-status-label');

  if (state.filterStatus !== 'all') {
    if (filterTag) filterTag.style.display = 'flex';
    const statusDef = state.statuses.find(s => s.id === state.filterStatus) || { label: state.filterStatus };
    if (filterLabel) filterLabel.textContent = `Status: ${statusDef.label}`;
  } else {
    if (filterTag) filterTag.style.display = 'none';
  }
}

// --- Filtered Tasks Query ---
function getFilteredTasks(state) {
  let list = state.tasks.filter(t => t.sprintId === state.activeSprintId);

  if (state.filterStatus !== 'all') {
    list = list.filter(t => t.status === state.filterStatus);
  }

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    list = list.filter(t => {
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchNote = (t.note || '').toLowerCase().includes(q);
      return matchTitle || matchNote;
    });
  }

  return list;
}

// --- Views Dispatcher ---
function renderViews(state) {
  const boardEl = document.getElementById('board-view');
  const listEl = document.getElementById('flat-list-view');
  const emptyEl = document.getElementById('empty-state');
  const emptyText = document.getElementById('empty-state-text');

  const filteredTasks = getFilteredTasks(state);

  if (filteredTasks.length === 0) {
    if (emptyEl) emptyEl.style.display = 'flex';
    if (emptyText) {
      emptyText.textContent = state.searchQuery
        ? `No tasks matching "${state.searchQuery}"`
        : 'No tasks found for this status in current sprint.';
    }
    if (boardEl) boardEl.style.display = 'none';
    if (listEl) listEl.style.display = 'none';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  if (state.viewMode === 'grouped') {
    if (boardEl) boardEl.style.display = 'grid';
    if (listEl) listEl.style.display = 'none';
    renderBoardView(filteredTasks, state);
  } else {
    if (boardEl) boardEl.style.display = 'none';
    if (listEl) listEl.style.display = 'flex';
    renderListView(filteredTasks, state);
  }
}

// --- Main App Render Cycle ---
function renderApp(state) {
  renderSidebar(state);
  renderHeader(state);
  renderTaskCreatorOptions(state);
  renderToolbar(state);
  renderViews(state);
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  setupWindowControls();
  setupSidebarListeners();
  setupModals();

  // Header sprint buttons
  document.getElementById('btn-edit-current-sprint')?.addEventListener('click', () => {
    const current = store.getState().sprints.find(s => s.id === store.getState().activeSprintId);
    if (current) openEditSprintModal(current);
  });

  document.getElementById('btn-delete-current-sprint')?.addEventListener('click', () => {
    const state = store.getState();
    const current = state.sprints.find(s => s.id === state.activeSprintId);
    if (current) handleDeleteSprint(current.id, current.name, state);
  });

  // View modes
  const btnGrouped = document.getElementById('view-mode-grouped');
  const btnList = document.getElementById('view-mode-list');

  btnGrouped?.addEventListener('click', () => {
    btnGrouped.classList.add('active');
    btnList?.classList.remove('active');
    store.setViewMode('grouped');
  });

  btnList?.addEventListener('click', () => {
    btnList.classList.add('active');
    btnGrouped?.classList.remove('active');
    store.setViewMode('list');
  });

  // Search input
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');

  searchInput?.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    if (searchClear) searchClear.style.display = q ? 'block' : 'none';
    store.setSearchQuery(q);
  });

  searchClear?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (searchClear) searchClear.style.display = 'none';
    store.setSearchQuery('');
  });

  // Clear filter tag button
  document.getElementById('filter-clear-btn')?.addEventListener('click', () => {
    store.setFilterStatus('all');
  });

  // Task creation form
  const taskForm = document.getElementById('task-creator-form');
  const taskTitleInput = document.getElementById('input-task-title');
  const taskStatusSelect = document.getElementById('input-task-status');
  const taskPrioritySelect = document.getElementById('input-task-priority');
  const taskNoteInput = document.getElementById('input-task-note');

  taskForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = taskTitleInput.value.trim();
    if (!title) return;

    const state = store.getState();
    const status = taskStatusSelect.value || state.statuses[0]?.id || 'todo';

    await store.addTask({
      id: generateId('task'),
      sprintId: state.activeSprintId,
      title,
      status,
      priority: taskPrioritySelect.value || 'medium',
      note: taskNoteInput.value.trim(),
      createdAt: Date.now()
    });

    taskTitleInput.value = '';
    taskNoteInput.value = '';
    showToast('Task added to sprint');
  });

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      searchInput?.focus();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      taskTitleInput?.focus();
    } else if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => { m.style.display = 'none'; });
      searchInput?.blur();
    }
  });
}

// --- Initialize App ---
async function bootstrap() {
  setupEventListeners();
  store.subscribe(renderApp);
  await store.init();
}

document.addEventListener('DOMContentLoaded', bootstrap);
