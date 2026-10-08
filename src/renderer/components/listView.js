/**
 * List View Component - Compact flat list view
 */
import { escapeHtml } from '../utils/helpers.js';
import { openEditTaskModal } from './modals.js';

export function renderListView(tasks, state) {
  const container = document.getElementById('flat-list-view');
  if (!container) return;

  container.innerHTML = '';

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'flat-item';

    const statusDef = state.statuses.find(s => s.id === task.status) || { label: task.status, color: '#71717a' };

    li.innerHTML = `
      <span class="flat-status-badge" style="background: rgba(255,255,255,0.08); color: ${statusDef.color}; border: 1px solid ${statusDef.color}40">${escapeHtml(statusDef.label)}</span>
      <span class="flat-title">${escapeHtml(task.title)}</span>
      ${task.note ? `<span class="flat-note">💬 ${escapeHtml(task.note)}</span>` : ''}
      <button class="card-btn btn-edit-flat" title="Edit">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
    `;

    li.querySelector('.btn-edit-flat').addEventListener('click', () => openEditTaskModal(task));
    container.appendChild(li);
  });
}
