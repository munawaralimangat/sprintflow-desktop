/**
 * Board View Component - Kanban swimlanes for SDLC statuses
 */
import { store } from '../state/store.js';
import { escapeHtml } from '../utils/helpers.js';
import { showToast } from './toast.js';
import { openEditTaskModal } from './modals.js';

export function renderBoardView(tasks, state) {
  const container = document.getElementById('board-view');
  if (!container) return;

  container.innerHTML = '';

  const columnsToShow = state.filterStatus === 'all'
    ? state.statuses
    : state.statuses.filter(s => s.id === state.filterStatus);

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
        triggerQuickAddForStatus(colDef.id);
      });
      cardsContainer.appendChild(placeholder);
    } else {
      colTasks.forEach(task => {
        cardsContainer.appendChild(createTaskCard(task, state));
      });
    }

    colEl.querySelector('.col-add-btn').addEventListener('click', () => {
      triggerQuickAddForStatus(colDef.id);
    });

    container.appendChild(colEl);
  });
}

function createTaskCard(task, state) {
  const card = document.createElement('div');
  card.className = 'task-card';

  const noteHtml = task.note
    ? `<div class="card-note ${task.status === 'blocked' ? 'blocked' : ''}">${escapeHtml(task.note)}</div>`
    : '';

  const priorityHtml = task.priority === 'high'
    ? `<span class="p-tag high">High</span>`
    : (task.priority === 'medium' ? `<span class="p-tag medium">Med</span>` : '');

  const statusOptions = state.statuses.map(s =>
    `<option value="${s.id}" ${s.id === task.status ? 'selected' : ''}>${escapeHtml(s.label)}</option>`
  ).join('');

  card.innerHTML = `
    <div class="card-top-row">
      <span class="card-title">${escapeHtml(task.title)}</span>
      <div class="card-actions">
        <button class="card-btn btn-edit" title="Edit task">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="card-btn btn-del" title="Delete task">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
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

  card.querySelector('.status-changer-select').addEventListener('change', async (e) => {
    await store.updateTask({ id: task.id, status: e.target.value });
  });

  card.querySelector('.btn-edit').addEventListener('click', (e) => {
    e.stopPropagation();
    openEditTaskModal(task);
  });

  card.querySelector('.btn-del').addEventListener('click', async (e) => {
    e.stopPropagation();
    await store.deleteTask(task.id);
    showToast('Task removed');
  });

  return card;
}

function triggerQuickAddForStatus(statusId) {
  const statusSelect = document.getElementById('input-task-status');
  const titleInput = document.getElementById('input-task-title');
  if (statusSelect && titleInput) {
    statusSelect.value = statusId;
    titleInput.focus();
    titleInput.scrollIntoView({ behavior: 'smooth' });
  }
}
