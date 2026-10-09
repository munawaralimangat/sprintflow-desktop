/**
 * Centralized Reactive State Store
 */
import { DEFAULT_STATUSES, INITIAL_SPRINTS, INITIAL_TASKS } from '../utils/constants.js';
import { StorageService } from '../services/storageService.js';

class Store {
  constructor() {
    this.state = {
      theme: 'dark',
      activeSprintId: 'sprint-1',
      filterStatus: 'all',
      searchQuery: '',
      viewMode: 'grouped', // 'grouped' (Board) | 'list'
      statuses: DEFAULT_STATUSES,
      sprints: INITIAL_SPRINTS,
      tasks: INITIAL_TASKS
    };

    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  async init() {
    const saved = await StorageService.load();
    if (saved) {
      this.state.theme = saved.theme || 'dark';
      this.state.activeSprintId = saved.activeSprintId || (saved.sprints && saved.sprints[0]?.id) || 'sprint-1';
      this.state.statuses = (saved.statuses && saved.statuses.length > 0) ? saved.statuses : DEFAULT_STATUSES;
      this.state.sprints = (saved.sprints && saved.sprints.length > 0) ? saved.sprints : INITIAL_SPRINTS;
      this.state.tasks = Array.isArray(saved.tasks) ? saved.tasks : INITIAL_TASKS;
    }
    this.notify();
  }

  async setState(partial) {
    this.state = { ...this.state, ...partial };
    await this.persist();
    this.notify();
  }

  async persist() {
    await StorageService.save({
      theme: this.state.theme,
      activeSprintId: this.state.activeSprintId,
      statuses: this.state.statuses,
      sprints: this.state.sprints,
      tasks: this.state.tasks
    });
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('Store listener error:', err);
      }
    }
  }

  // --- Actions ---

  async setTheme(theme) {
    await this.setState({ theme });
  }

  async setActiveSprint(sprintId) {
    await this.setState({ activeSprintId: sprintId });
  }

  async setFilterStatus(status) {
    this.state.filterStatus = status;
    this.notify();
  }

  async setSearchQuery(query) {
    this.state.searchQuery = query;
    this.notify();
  }

  async setViewMode(mode) {
    this.state.viewMode = mode;
    this.notify();
  }

  // Tasks actions
  async addTask(task) {
    const tasks = [task, ...this.state.tasks];
    await this.setState({ tasks });
  }

  async updateTask(updatedTask) {
    const tasks = this.state.tasks.map(t => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
    await this.setState({ tasks });
  }

  async deleteTask(taskId) {
    const tasks = this.state.tasks.filter(t => t.id !== taskId);
    await this.setState({ tasks });
  }

  async moveTask(taskId, newStatusId, targetTaskId = null, insertAfter = false) {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentSprintTasks = this.state.tasks.filter(t => t.sprintId === task.sprintId);
    const otherSprintTasks = this.state.tasks.filter(t => t.sprintId !== task.sprintId);

    // Remove moving task from current sprint
    const filteredCurrent = currentSprintTasks.filter(t => t.id !== taskId);
    const updatedTask = { ...task, status: newStatusId };

    let newCurrentTasks = [];

    if (!targetTaskId) {
      if (insertAfter) {
        newCurrentTasks = [...filteredCurrent, updatedTask];
      } else {
        // Put with other tasks of the same status if any exist
        const sameStatusTasks = filteredCurrent.filter(t => t.status === newStatusId);
        if (sameStatusTasks.length > 0) {
          const lastIdx = filteredCurrent.lastIndexOf(sameStatusTasks[sameStatusTasks.length - 1]);
          filteredCurrent.splice(lastIdx + 1, 0, updatedTask);
          newCurrentTasks = filteredCurrent;
        } else {
          newCurrentTasks = [updatedTask, ...filteredCurrent];
        }
      }
    } else {
      const targetIdx = filteredCurrent.findIndex(t => t.id === targetTaskId);
      if (targetIdx !== -1) {
        const insertIdx = insertAfter ? targetIdx + 1 : targetIdx;
        filteredCurrent.splice(insertIdx, 0, updatedTask);
        newCurrentTasks = filteredCurrent;
      } else {
        newCurrentTasks = [updatedTask, ...filteredCurrent];
      }
    }

    const allTasks = [...newCurrentTasks, ...otherSprintTasks];
    await this.setState({ tasks: allTasks });
  }

  // Sprints actions
  async addSprint(sprint) {
    const sprints = [...this.state.sprints, sprint];
    await this.setState({ sprints, activeSprintId: sprint.id });
  }

  async updateSprint(updatedSprint) {
    const sprints = this.state.sprints.map(s => (s.id === updatedSprint.id ? { ...s, ...updatedSprint } : s));
    await this.setState({ sprints });
  }

  async deleteSprint(sprintId) {
    if (sprintId === 'backlog') return;

    // Move tasks to backlog
    const tasks = this.state.tasks.map(t => (t.sprintId === sprintId ? { ...t, sprintId: 'backlog' } : t));
    const sprints = this.state.sprints.filter(s => s.id !== sprintId);

    let activeSprintId = this.state.activeSprintId;
    if (activeSprintId === sprintId) {
      const fallback = sprints.find(s => s.id !== 'backlog') || sprints[0] || { id: 'backlog' };
      activeSprintId = fallback.id;
    }

    await this.setState({ sprints, tasks, activeSprintId });
  }

  // Statuses actions
  async addStatus(status) {
    const statuses = [...this.state.statuses, status];
    await this.setState({ statuses });
  }

  async updateStatus(updatedStatus) {
    const statuses = this.state.statuses.map(s => (s.id === updatedStatus.id ? { ...s, ...updatedStatus } : s));
    await this.setState({ statuses });
  }

  async reorderStatuses(statuses) {
    await this.setState({ statuses });
  }

  async moveStatus(fromIndex, toIndex) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= this.state.statuses.length || toIndex >= this.state.statuses.length) {
      return;
    }
    const statuses = [...this.state.statuses];
    const [moved] = statuses.splice(fromIndex, 1);
    statuses.splice(toIndex, 0, moved);
    await this.setState({ statuses });
  }

  async deleteStatus(statusId) {
    if (this.state.statuses.length <= 1) return;

    const fallbackStatus = this.state.statuses.find(s => s.id !== statusId)?.id || 'todo';
    const tasks = this.state.tasks.map(t => (t.status === statusId ? { ...t, status: fallbackStatus } : t));
    const statuses = this.state.statuses.filter(s => s.id !== statusId);

    let filterStatus = this.state.filterStatus;
    if (filterStatus === statusId) filterStatus = 'all';

    await this.setState({ statuses, tasks, filterStatus });
  }

  async resetDefaultStatuses() {
    await this.setState({ statuses: JSON.parse(JSON.stringify(DEFAULT_STATUSES)) });
  }
}

export const store = new Store();
