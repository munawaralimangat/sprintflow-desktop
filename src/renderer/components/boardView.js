/**
 * Board View Component - Kanban swimlanes with full Drag & Drop and Quick Navigation for Statuses & Tasks
 */
import { store } from '../state/store.js';
import { escapeHtml } from '../utils/helpers.js';
import { showToast } from './toast.js';
import { openEditTaskModal } from './modals.js';

let draggedPayload = null; // { type: 'task'|'column', id: string, fromIndex?: number, fromStatus?: string }

export function renderBoardView(tasks, state) {
  const container = document.getElementById('board-view');
  if (!container) return;

  container.innerHTML = '';

  const columnsToShow = state.filterStatus === 'all'
    ? state.statuses
    : state.statuses.filter(s => s.id === state.filterStatus);

  const canReorderColumns = state.filterStatus === 'all' && columnsToShow.length > 1;

  columnsToShow.forEach((colDef, colIndex) => {
    const colTasks = tasks.filter(t => t.status === colDef.id);
    const isFirstCol = colIndex === 0;
    const isLastCol = colIndex === columnsToShow.length - 1;

    const colEl = document.createElement('div');
    colEl.className = 'board-column';
    colEl.dataset.statusId = colDef.id;
    colEl.dataset.colIndex = String(colIndex);

    // Header with status indicator, drag handle, quick arrow navigators, count and add button
    colEl.innerHTML = `
      <div class="column-header" ${canReorderColumns ? 'draggable="true" title="Drag column or use arrows to reorder"' : ''}>
        <div class="col-title-wrap">
          ${canReorderColumns ? `
            <span class="col-drag-handle" title="Drag to reorder column">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="8" cy="5" r="2"/>
                <circle cx="16" cy="5" r="2"/>
                <circle cx="8" cy="12" r="2"/>
                <circle cx="16" cy="12" r="2"/>
                <circle cx="8" cy="19" r="2"/>
                <circle cx="16" cy="19" r="2"/>
              </svg>
            </span>
            <div class="col-reorder-nav">
              <button class="col-nav-btn col-move-left" title="Move column left" ${isFirstCol ? 'disabled' : ''}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button class="col-nav-btn col-move-right" title="Move column right" ${isLastCol ? 'disabled' : ''}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          ` : ''}
          <span class="col-dot" style="background-color: ${colDef.color || '#71717a'}"></span>
          <span class="col-name" title="${escapeHtml(colDef.label)}">${escapeHtml(colDef.label)}</span>
        </div>
        <div class="col-header-right">
          <span class="col-count">${colTasks.length}</span>
          <button class="col-add-btn" title="Add task to ${escapeHtml(colDef.label)}">+</button>
        </div>
      </div>
      <div class="column-cards" id="cards-${colDef.id}"></div>
    `;

    const cardsContainer = colEl.querySelector('.column-cards');

    // Populate task cards or empty state
    if (colTasks.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'empty-column-placeholder';
      placeholder.innerHTML = `
        <span class="placeholder-icon">+</span>
        <span>Add task to ${escapeHtml(colDef.label)}</span>
      `;
      placeholder.addEventListener('click', () => {
        triggerQuickAddForStatus(colDef.id);
      });
      cardsContainer.appendChild(placeholder);
    } else {
      colTasks.forEach(task => {
        cardsContainer.appendChild(createTaskCard(task, state));
      });
    }

    colEl.querySelector('.col-add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      triggerQuickAddForStatus(colDef.id);
    });

    if (canReorderColumns) {
      colEl.querySelector('.col-move-left')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (colIndex > 0) {
          await store.moveStatus(colIndex, colIndex - 1);
          showToast(`Moved "${colDef.label}" left`);
        }
      });

      colEl.querySelector('.col-move-right')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (colIndex < columnsToShow.length - 1) {
          await store.moveStatus(colIndex, colIndex + 1);
          showToast(`Moved "${colDef.label}" right`);
        }
      });

      setupColumnDragAndDrop(colEl, colDef, colIndex);
    }

    // --- Task Drop Zone on Column ---
    setupTaskDropZone(colEl, cardsContainer, colDef);

    container.appendChild(colEl);
  });
}

/**
 * Creates a draggable task card element
 */
function createTaskCard(task, state) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.draggable = true;
  card.dataset.taskId = task.id;
  card.dataset.status = task.status;

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
      <div class="card-drag-indicator" title="Drag to move task">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="8" cy="6" r="2.5"/>
          <circle cx="16" cy="6" r="2.5"/>
          <circle cx="8" cy="18" r="2.5"/>
          <circle cx="16" cy="18" r="2.5"/>
        </svg>
      </div>
      <span class="card-title">${escapeHtml(task.title)}</span>
      <div class="card-actions">
        <button class="card-btn btn-edit" title="Edit task" draggable="false">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="card-btn btn-del" title="Delete task" draggable="false">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
    ${noteHtml}
    <div class="card-bottom-row">
      <select class="status-changer-select" title="Change status" draggable="false">
        ${statusOptions}
      </select>
      ${priorityHtml}
    </div>
  `;

  // Status changer quick selector
  card.querySelector('.status-changer-select').addEventListener('change', async (e) => {
    await store.updateTask({ id: task.id, status: e.target.value });
  });

  // Edit task button
  card.querySelector('.btn-edit').addEventListener('click', (e) => {
    e.stopPropagation();
    openEditTaskModal(task);
  });

  // Delete task button
  card.querySelector('.btn-del').addEventListener('click', async (e) => {
    e.stopPropagation();
    await store.deleteTask(task.id);
    showToast('Task removed');
  });

  // Dragstart & Dragend handlers for Task Card
  card.addEventListener('dragstart', (e) => {
    // Prevent drag if initiated from interactive elements
    if (e.target.closest('button, select, input, a')) {
      e.preventDefault();
      return;
    }

    draggedPayload = {
      type: 'task',
      id: task.id,
      fromStatus: task.status
    };

    e.dataTransfer.setData('text/plain', JSON.stringify(draggedPayload));
    e.dataTransfer.effectAllowed = 'move';
    card.classList.add('is-dragging');
    document.body.classList.add('is-dragging-active');
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('is-dragging');
    document.body.classList.remove('is-dragging-active');
    cleanupAllDropIndicators();
    draggedPayload = null;
  });

  return card;
}

/**
 * Setup Column Header Drag and Drop for Reordering Statuses
 */
function setupColumnDragAndDrop(colEl, colDef, colIndex) {
  const header = colEl.querySelector('.column-header');

  header.addEventListener('dragstart', (e) => {
    if (e.target.closest('button, input, select')) {
      e.preventDefault();
      return;
    }

    draggedPayload = {
      type: 'column',
      id: colDef.id,
      fromIndex: colIndex
    };

    e.dataTransfer.setData('text/plain', JSON.stringify(draggedPayload));
    e.dataTransfer.effectAllowed = 'move';
    colEl.classList.add('is-dragging-column');
    document.body.classList.add('is-dragging-active');
  });

  header.addEventListener('dragend', () => {
    colEl.classList.remove('is-dragging-column');
    document.body.classList.remove('is-dragging-active');
    cleanupAllDropIndicators();
    draggedPayload = null;
  });

  colEl.addEventListener('dragover', (e) => {
    if (!draggedPayload || draggedPayload.type !== 'column') return;
    if (draggedPayload.id === colDef.id) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = colEl.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const isRight = e.clientX > midpoint;

    colEl.classList.remove('column-drop-left', 'column-drop-right');
    if (isRight) {
      colEl.classList.add('column-drop-right');
    } else {
      colEl.classList.add('column-drop-left');
    }
  });

  colEl.addEventListener('dragleave', (e) => {
    if (!colEl.contains(e.relatedTarget)) {
      colEl.classList.remove('column-drop-left', 'column-drop-right');
    }
  });

  colEl.addEventListener('drop', async (e) => {
    if (!draggedPayload || draggedPayload.type !== 'column') return;
    if (draggedPayload.id === colDef.id) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = colEl.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const isRight = e.clientX > midpoint;

    const fromIdx = draggedPayload.fromIndex;
    let targetIdx = colIndex;

    if (isRight && fromIdx > colIndex) {
      targetIdx = colIndex + 1;
    } else if (!isRight && fromIdx < colIndex) {
      targetIdx = Math.max(0, colIndex - 1);
    }

    cleanupAllDropIndicators();
    colEl.classList.remove('is-dragging-column');
    draggedPayload = null;

    if (fromIdx !== targetIdx) {
      await store.moveStatus(fromIdx, targetIdx);
      showToast(`Status order updated`);
    }
  });
}

/**
 * Setup Task Drop Zone on a Column
 */
function setupTaskDropZone(colEl, cardsContainer, colDef) {
  colEl.addEventListener('dragover', (e) => {
    if (!draggedPayload || draggedPayload.type !== 'task') return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    cardsContainer.classList.add('cards-drop-active');

    // Calculate nearest card and insert drop indicator
    const afterElement = getDragAfterElement(cardsContainer, e.clientY);
    let indicator = cardsContainer.querySelector('.task-drop-indicator');

    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'task-drop-indicator';
    }

    if (afterElement == null) {
      cardsContainer.appendChild(indicator);
    } else {
      cardsContainer.insertBefore(indicator, afterElement);
    }
  });

  colEl.addEventListener('dragleave', (e) => {
    if (!colEl.contains(e.relatedTarget)) {
      cardsContainer.classList.remove('cards-drop-active');
      const indicator = cardsContainer.querySelector('.task-drop-indicator');
      if (indicator) indicator.remove();
    }
  });

  colEl.addEventListener('drop', async (e) => {
    if (!draggedPayload || draggedPayload.type !== 'task') return;

    e.preventDefault();
    e.stopPropagation();

    const taskId = draggedPayload.id;
    const fromStatus = draggedPayload.fromStatus;
    const toStatus = colDef.id;

    // Find insertion target
    const afterElement = getDragAfterElement(cardsContainer, e.clientY);
    let targetTaskId = null;
    let insertAfter = false;

    if (afterElement) {
      targetTaskId = afterElement.dataset.taskId;
      insertAfter = false;
    } else {
      // Placed at the end of the cards in this column
      const existingCards = cardsContainer.querySelectorAll('.task-card:not(.is-dragging)');
      if (existingCards.length > 0) {
        targetTaskId = existingCards[existingCards.length - 1].dataset.taskId;
        insertAfter = true;
      }
    }

    cardsContainer.classList.remove('cards-drop-active');
    cleanupAllDropIndicators();
    draggedPayload = null;

    await store.moveTask(taskId, toStatus, targetTaskId, insertAfter);

    if (fromStatus !== toStatus) {
      showToast(`Task moved to ${colDef.label}`);
    }
  });
}

/**
 * Determines which task card element the cursor is currently above
 */
function getDragAfterElement(container, y) {
  const draggableCards = [...container.querySelectorAll('.task-card:not(.is-dragging)')];

  return draggableCards.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * Removes all temporary drop indicators and highlights across the board
 */
function cleanupAllDropIndicators() {
  document.querySelectorAll('.task-drop-indicator').forEach(el => el.remove());
  document.querySelectorAll('.cards-drop-active').forEach(el => el.classList.remove('cards-drop-active'));
  document.querySelectorAll('.column-drop-left, .column-drop-right').forEach(el => {
    el.classList.remove('column-drop-left', 'column-drop-right');
  });
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
