/**
 * Storage Service - Decoupled persistence layer
 */

export class StorageService {
  static async load() {
    try {
      if (window.electronAPI && window.electronAPI.loadTodos) {
        const stored = await window.electronAPI.loadTodos();
        if (stored && stored.sprints && stored.tasks) {
          return stored;
        }
      }
      const local = localStorage.getItem('sprintflow_data');
      return local ? JSON.parse(local) : null;
    } catch (err) {
      console.error('StorageService.load error:', err);
      return null;
    }
  }

  static async save(data) {
    try {
      if (window.electronAPI && window.electronAPI.saveTodos) {
        await window.electronAPI.saveTodos(data);
      } else {
        localStorage.setItem('sprintflow_data', JSON.stringify(data));
      }
      return true;
    } catch (err) {
      console.error('StorageService.save error:', err);
      return false;
    }
  }

  static async export(data) {
    if (window.electronAPI && window.electronAPI.exportTodos) {
      return await window.electronAPI.exportTodos(data);
    }
    // Web fallback
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `sprintflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return { success: true };
  }

  static async import() {
    if (window.electronAPI && window.electronAPI.importTodos) {
      return await window.electronAPI.importTodos();
    }
    return { success: false, error: 'Import not supported in browser environment' };
  }
}
