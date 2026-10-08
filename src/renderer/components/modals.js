/**
 * Modals Component Module
 */
import { store } from '../state/store.js';
import { escapeHtml, generateId } from '../utils/helpers.js';
import { StandupService } from '../services/standupService.js';
import { showToast } from './toast.js';

export function setupModals() {
  setupCreateSprintModal();
  setupEditSprintModal();
  setupManageStatusesModal();
  setupEditTaskModal();
  setupStandupModal();
}

// --- Create Sprint Modal ---
function setupCreateSprintModal() {
  const modal = document.getElementById('create-sprint-modal');
  const openBtn = document.getElementById('btn-create-sprint');
  const closeBtn = document.getElementById('btn-close-create-sprint');
  const cancelBtn = document.getElementById('btn-cancel-create-sprint');
  const form = document.getElementById('create-sprint-form');
  const nameInput = document.getElementById('sprint-name-input');
  const startInput = document.getElementById('sprint-start-date');
  const endInput = document.getElementById('sprint-end-date');
  const goalInput = document.getElementById('sprint-goal-input');

  // Pre-fill dates
  if (startInput && endInput) {
    const today = new Date();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    startInput.value = today.toISOString().slice(0, 10);
    endInput.value = nextWeek.toISOString().slice(0, 10);
  }

  openBtn?.addEventListener('click', () => {
    modal.style.display = 'flex';
    nameInput.focus();
  });

  const close = () => { modal.style.display = 'none'; };
  closeBtn?.addEventListener('click', close);
  cancelBtn?.addEventListener('click', close);

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;

    await store.addSprint({
      id: generateId('sprint'),
      name,
      startDate: startInput.value,
      endDate: endInput.value,
      goal: goalInput.value.trim(),
      active: true
    });

    close();
    nameInput.value = '';
    goalInput.value = '';
    showToast(`Created ${name}`);
  });
}

// --- Edit Sprint Modal ---
export function openEditSprintModal(sprint) {
  const modal = document.getElementById('edit-sprint-modal');
  const idInput = document.getElementById('edit-sprint-id');
  const nameInput = document.getElementById('edit-sprint-name');
  const startInput = document.getElementById('edit-sprint-start');
  const endInput = document.getElementById('edit-sprint-end');
  const goalInput = document.getElementById('edit-sprint-goal');

  if (!modal) return;

  idInput.value = sprint.id;
  nameInput.value = sprint.name;
  startInput.value = sprint.startDate || '';
  endInput.value = sprint.endDate || '';
  goalInput.value = sprint.goal || '';

  modal.style.display = 'flex';
  nameInput.focus();
}

function setupEditSprintModal() {
  const modal = document.getElementById('edit-sprint-modal');
  const closeBtn = document.getElementById('btn-close-edit-sprint');
  const cancelBtn = document.getElementById('btn-cancel-edit-sprint');
  const form = document.getElementById('edit-sprint-form');

  const close = () => { modal.style.display = 'none'; };
  closeBtn?.addEventListener('click', close);
  cancelBtn?.addEventListener('click', close);

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-sprint-id').value;
    const name = document.getElementById('edit-sprint-name').value.trim();
    const startDate = document.getElementById('edit-sprint-start').value;
    const endDate = document.getElementById('edit-sprint-end').value;
    const goal = document.getElementById('edit-sprint-goal').value.trim();

    await store.updateSprint({ id, name, startDate, endDate, goal });
    close();
    showToast('Sprint details updated');
  });
}

// --- Manage Development Statuses Modal ---
export function openManageStatusesModal() {
  const modal = document.getElementById('manage-statuses-modal');
  renderManageStatusesList();
  modal.style.display = 'flex';
  document.getElementById('new-status-name')?.focus();
}

export function renderManageStatusesList() {
  const container = document.getElementById('custom-status-list');
  if (!container) return;

  const state = store.getState();
  container.innerHTML = '';

  state.statuses.forEach(st => {
    const row = document.createElement('div');
    row.className = 'custom-status-row';

    row.innerHTML = `
      <div class="status-row-left">
        <input type="color" class="status-color-picker" value="${st.color || '#71717a'}" title="Change color">
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

    row.querySelector('.status-color-picker').addEventListener('change', async (e) => {
      await store.updateStatus({ id: st.id, color: e.target.value });
    });

    row.querySelector('.btn-rename-status').addEventListener('click', async () => {
      const newName = prompt('Rename status:', st.label);
      if (newName && newName.trim()) {
        await store.updateStatus({ id: st.id, label: newName.trim() });
        renderManageStatusesList();
      }
    });

    row.querySelector('.btn-del-status').addEventListener('click', async () => {
      if (state.statuses.length <= 1) {
        alert('At least one status is required in the workflow.');
        return;
      }
      const count = state.tasks.filter(t => t.status === st.id).length;
      const msg = count > 0
        ? `Delete "${st.label}"? ${count} task(s) using it will be moved to another status.`
        : `Delete "${st.label}"?`;

      if (!confirm(msg)) return;

      await store.deleteStatus(st.id);
      showToast(`Deleted status ${st.label}`);
      renderManageStatusesList();
    });

    container.appendChild(row);
  });
}

function setupManageStatusesModal() {
  const modal = document.getElementById('manage-statuses-modal');
  const openBtn = document.getElementById('btn-manage-statuses');
  const closeBtn = document.getElementById('btn-close-manage-statuses');
  const doneBtn = document.getElementById('btn-done-manage-statuses');
  const form = document.getElementById('add-status-form');
  const nameInput = document.getElementById('new-status-name');
  const colorInput = document.getElementById('new-status-color');
  const resetBtn = document.getElementById('btn-reset-default-statuses');

  openBtn?.addEventListener('click', openManageStatusesModal);

  const close = () => { modal.style.display = 'none'; };
  closeBtn?.addEventListener('click', close);
  doneBtn?.addEventListener('click', close);

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;

    await store.addStatus({
      id: generateId('status'),
      label: name,
      color: colorInput.value
    });

    nameInput.value = '';
    showToast(`Added status: ${name}`);
    renderManageStatusesList();
  });

  resetBtn?.addEventListener('click', async () => {
    if (confirm('Reset statuses to standard SDLC defaults?')) {
      await store.resetDefaultStatuses();
      showToast('Reset to default SDLC statuses');
      renderManageStatusesList();
    }
  });
}

// --- Edit Task Modal ---
export function openEditTaskModal(task) {
  const modal = document.getElementById('edit-task-modal');
  const idInput = document.getElementById('edit-task-id');
  const titleInput = document.getElementById('edit-task-title');
  const statusSelect = document.getElementById('edit-task-status');
  const prioritySelect = document.getElementById('edit-task-priority');
  const sprintSelect = document.getElementById('edit-task-sprint');
  const noteInput = document.getElementById('edit-task-note');

  if (!modal) return;

  const state = store.getState();

  idInput.value = task.id;
  titleInput.value = task.title;
  prioritySelect.value = task.priority;
  noteInput.value = task.note || '';

  // Populate dynamic statuses
  statusSelect.innerHTML = state.statuses.map(s =>
    `<option value="${s.id}" ${s.id === task.status ? 'selected' : ''}>${escapeHtml(s.label)}</option>`
  ).join('');

  // Populate sprints
  sprintSelect.innerHTML = state.sprints.map(s =>
    `<option value="${s.id}" ${s.id === task.sprintId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`
  ).join('');

  modal.style.display = 'flex';
  titleInput.focus();
}

function setupEditTaskModal() {
  const modal = document.getElementById('edit-task-modal');
  const closeBtn = document.getElementById('btn-close-edit-task');
  const cancelBtn = document.getElementById('btn-cancel-edit-task');
  const form = document.getElementById('edit-task-form');

  const close = () => { modal.style.display = 'none'; };
  closeBtn?.addEventListener('click', close);
  cancelBtn?.addEventListener('click', close);

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-task-id').value;
    const title = document.getElementById('edit-task-title').value.trim();
    const status = document.getElementById('edit-task-status').value;
    const priority = document.getElementById('edit-task-priority').value;
    const sprintId = document.getElementById('edit-task-sprint').value;
    const note = document.getElementById('edit-task-note').value.trim();

    await store.updateTask({ id, title, status, priority, sprintId, note });
    close();
    showToast('Task updated');
  });
}

// --- Daily Standup Modal ---
function setupStandupModal() {
  const modal = document.getElementById('standup-modal');
  const openBtn = document.getElementById('btn-open-standup');
  const quickCopyBtn = document.getElementById('btn-quick-standup');
  const closeBtn = document.getElementById('btn-close-standup');
  const cancelBtn = document.getElementById('btn-cancel-standup');
  const copyModalBtn = document.getElementById('btn-copy-standup-modal');
  const textarea = document.getElementById('standup-text');

  const open = () => {
    textarea.value = StandupService.generate(store.getState());
    modal.style.display = 'flex';
  };

  const close = () => { modal.style.display = 'none'; };

  openBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  cancelBtn?.addEventListener('click', close);

  quickCopyBtn?.addEventListener('click', () => {
    const text = StandupService.generate(store.getState());
    navigator.clipboard.writeText(text);
    showToast('Standup update copied to clipboard! 📋');
  });

  copyModalBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(textarea.value);
    showToast('Standup copied to clipboard! 📋');
  });
}
