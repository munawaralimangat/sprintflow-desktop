/**
 * Sidebar Component - Sprints navigation, status filters, theme controls
 */
import { store } from '../state/store.js';
import { escapeHtml } from '../utils/helpers.js';
import { StorageService } from '../services/storageService.js';
import { showToast } from './toast.js';
import { openEditSprintModal } from './modals.js';

export function renderSidebar(state) {
  renderSprintNav(state);
  renderStatusFilters(state);
  renderThemeToggle(state);
}

function renderSprintNav(state) {
  const container = document.getElementById('sprint-nav-list');
  if (!container) return;

  container.innerHTML = '';

  state.sprints.forEach(sprint => {
    const isBacklog = sprint.id === 'backlog';
    const isActive = sprint.id === state.activeSprintId;
    const taskCount = state.tasks.filter(t => t.sprintId === sprint.id).length;

    const div = document.createElement('div');
    div.className = `sprint-nav-item ${isActive ? 'active' : ''}`;

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

    div.addEventListener('click', (e) => {
      if (e.target.closest('.sprint-actions-hover')) return;
      store.setActiveSprint(sprint.id);
    });

    if (!isBacklog) {
      div.querySelector('.btn-edit-sprint')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditSprintModal(sprint);
      });

      div.querySelector('.btn-del-sprint')?.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDeleteSprint(sprint.id, sprint.name, state);
      });
    }

    container.appendChild(div);
  });
}

function renderStatusFilters(state) {
  const container = document.getElementById('status-filter-list');
  if (!container) return;

  container.innerHTML = '';
  const sprintTasks = state.tasks.filter(t => t.sprintId === state.activeSprintId);

  // All Tasks button
  const allBtn = document.createElement('button');
  allBtn.className = `status-filter-item ${state.filterStatus === 'all' ? 'active' : ''}`;
  allBtn.innerHTML = `
    <span class="status-filter-dot dot-all"></span>
    <span class="filter-label">All Tasks</span>
    <span class="filter-count">${sprintTasks.length}</span>
  `;
  allBtn.addEventListener('click', () => store.setFilterStatus('all'));
  container.appendChild(allBtn);

  // Dynamic Statuses
  state.statuses.forEach(st => {
    const count = sprintTasks.filter(t => t.status === st.id).length;
    const btn = document.createElement('button');
    btn.className = `status-filter-item ${state.filterStatus === st.id ? 'active' : ''}`;
    btn.innerHTML = `
      <span class="status-filter-dot" style="background-color: ${st.color || '#71717a'}"></span>
      <span class="filter-label">${escapeHtml(st.label)}</span>
      <span class="filter-count ${st.id === 'blocked' && count > 0 ? 'alert-count' : ''}">${count}</span>
    `;
    btn.addEventListener('click', () => store.setFilterStatus(st.id));
    container.appendChild(btn);
  });
}

function renderThemeToggle(state) {
  const sunIcon = document.getElementById('theme-icon-sun');
  const moonIcon = document.getElementById('theme-icon-moon');
  const themeLabel = document.getElementById('theme-label-text');

  document.documentElement.setAttribute('data-theme', state.theme);

  if (sunIcon && moonIcon && themeLabel) {
    if (state.theme === 'light') {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
      themeLabel.textContent = 'Light';
    } else {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
      themeLabel.textContent = 'Dark';
    }
  }
}

export async function handleDeleteSprint(sprintId, sprintName, state) {
  if (sprintId === 'backlog') {
    showToast('The Product Backlog cannot be deleted.');
    return;
  }

  const count = state.tasks.filter(t => t.sprintId === sprintId).length;
  const msg = count > 0
    ? `Delete "${sprintName}"? Its ${count} task(s) will be moved to the Product Backlog.`
    : `Are you sure you want to delete "${sprintName}"?`;

  if (!confirm(msg)) return;

  await store.deleteSprint(sprintId);
  showToast(`Deleted ${sprintName}`);
}

export function setupSidebarListeners() {
  const themeBtn = document.getElementById('btn-theme-toggle');
  themeBtn?.addEventListener('click', async () => {
    const nextTheme = store.getState().theme === 'light' ? 'dark' : 'light';
    await store.setTheme(nextTheme);
    showToast(nextTheme === 'light' ? 'Switched to light mode ☀️' : 'Switched to dark mode 🌙');
  });

  const exportBtn = document.getElementById('btn-export');
  exportBtn?.addEventListener('click', async () => {
    const res = await StorageService.export(store.getState());
    if (res.success) showToast('Exported sprint backup 📁');
  });

  const importBtn = document.getElementById('btn-import');
  importBtn?.addEventListener('click', async () => {
    const res = await StorageService.import();
    if (res.success && res.data) {
      await store.setState(res.data);
      showToast('Sprint backup imported 🚀');
    }
  });
}
