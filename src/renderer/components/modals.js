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

  let draggedStatusIndex = null;

  state.statuses.forEach((st, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === state.statuses.length - 1;

    const row = document.createElement('div');
    row.className = 'custom-status-row';
    row.draggable = true;
    row.dataset.statusIndex = String(idx);

    row.innerHTML = `
      <div class="status-row-left">
        <span class="status-drag-handle" title="Drag to reorder status">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="8" cy="5" r="2"/>
            <circle cx="16" cy="5" r="2"/>
            <circle cx="8" cy="12" r="2"/>
            <circle cx="16" cy="12" r="2"/>
            <circle cx="8" cy="19" r="2"/>
            <circle cx="16" cy="19" r="2"/>
          </svg>
        </span>
        <input type="color" class="status-color-picker" value="${st.color || '#71717a'}" title="Change status color">
        <input type="text" class="status-inline-input" value="${escapeHtml(st.label)}" title="Click to edit status name" placeholder="Status name" maxlength="30" />
      </div>
      <div class="status-row-actions">
        <button class="status-btn-icon btn-move-up" title="Move Up" ${isFirst ? 'disabled' : ''}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
        <button class="status-btn-icon btn-move-down" title="Move Down" ${isLast ? 'disabled' : ''}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="6 9 12 15 18 9"></polyline>
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

    const colorPicker = row.querySelector('.status-color-picker');
    const nameInput = row.querySelector('.status-inline-input');
    const upBtn = row.querySelector('.btn-move-up');
    const downBtn = row.querySelector('.btn-move-down');
    const delBtn = row.querySelector('.btn-del-status');

    // Move Up
    upBtn?.addEventListener('click', async () => {
      if (idx > 0) {
        await store.moveStatus(idx, idx - 1);
        renderManageStatusesList();
      }
    });

    // Move Down
    downBtn?.addEventListener('click', async () => {
      if (idx < state.statuses.length - 1) {
        await store.moveStatus(idx, idx + 1);
        renderManageStatusesList();
      }
    });

    // Drag and Drop for Status Row in Modal
    row.addEventListener('dragstart', (e) => {
      if (e.target.closest('input, button')) {
        e.preventDefault();
        return;
      }
      draggedStatusIndex = idx;
      row.classList.add('is-dragging-row');
      e.dataTransfer.effectAllowed = 'move';
    });

    row.addEventListener('dragend', () => {
      row.classList.remove('is-dragging-row');
      container.querySelectorAll('.custom-status-row').forEach(r => r.classList.remove('drag-over-top', 'drag-over-bottom'));
      draggedStatusIndex = null;
    });

    row.addEventListener('dragover', (e) => {
      if (draggedStatusIndex === null || draggedStatusIndex === idx) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const rect = row.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      row.classList.remove('drag-over-top', 'drag-over-bottom');
      if (e.clientY < midpoint) {
        row.classList.add('drag-over-top');
      } else {
        row.classList.add('drag-over-bottom');
      }
    });

    row.addEventListener('dragleave', (e) => {
      if (!row.contains(e.relatedTarget)) {
        row.classList.remove('drag-over-top', 'drag-over-bottom');
      }
    });

    row.addEventListener('drop', async (e) => {
      if (draggedStatusIndex === null || draggedStatusIndex === idx) return;
      e.preventDefault();

      const rect = row.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const dropAbove = e.clientY < midpoint;

      let targetIndex = idx;
      if (!dropAbove && draggedStatusIndex < idx) {
        targetIndex = idx;
      } else if (dropAbove && draggedStatusIndex > idx) {
        targetIndex = idx;
      }

      const fromIdx = draggedStatusIndex;
      draggedStatusIndex = null;

      await store.moveStatus(fromIdx, targetIndex);
      renderManageStatusesList();
      showToast('Status order updated');
    });

    colorPicker.addEventListener('change', async (e) => {
      await store.updateStatus({ id: st.id, color: e.target.value });
      showToast(`Updated color for ${st.label}`);
    });

    const saveName = async () => {
      const newName = nameInput.value.trim();
      if (newName && newName !== st.label) {
        await store.updateStatus({ id: st.id, label: newName });
        showToast(`Renamed to "${newName}"`);
      } else if (!newName) {
        nameInput.value = st.label;
      }
    };

    nameInput.addEventListener('blur', saveName);
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        nameInput.blur();
      }
      if (e.key === 'Escape') {
        nameInput.value = st.label;
        nameInput.blur();
      }
    });

    delBtn.addEventListener('click', async () => {
      if (state.statuses.length <= 1) {
        alert('At least one status is required in the workflow.');
        return;
      }
      const count = state.tasks.filter(t => t.status === st.id).length;
      const msg = count > 0
        ? `Delete "${st.label}"? ${count} task(s) using it will be moved to another status.`
        : `Delete status "${st.label}"?`;

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
