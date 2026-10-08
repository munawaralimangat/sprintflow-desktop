/**
 * Standup Generator Service
 */

export class StandupService {
  static generate(state) {
    const sprint = state.sprints.find(s => s.id === state.activeSprintId) || { name: 'Current Sprint' };
    const sprintTasks = state.tasks.filter(t => t.sprintId === state.activeSprintId);
    const statuses = state.statuses;

    const doneTasks = sprintTasks.filter(t => t.status === 'done');
    const activeTasks = sprintTasks.filter(t => !['done', 'blocked', 'todo'].includes(t.status));
    const blockedTasks = sprintTasks.filter(t => t.status === 'blocked');

    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    let text = `🚀 Daily Standup · ${sprint.name} (${todayStr})\n\n`;

    // Done
    text += `✅ Completed / Deployed:\n`;
    if (doneTasks.length === 0) {
      text += `  • (None completed today yet)\n`;
    } else {
      doneTasks.forEach(t => {
        text += `  • ${t.title}${t.note ? ` (${t.note})` : ''}\n`;
      });
    }
    text += `\n`;

    // Active
    text += `💻 Active Sprint Work:\n`;
    if (activeTasks.length === 0) {
      text += `  • (None in active dev)\n`;
    } else {
      activeTasks.forEach(t => {
        const label = statuses.find(s => s.id === t.status)?.label || t.status;
        text += `  • [${label}] ${t.title}${t.note ? ` — Note: ${t.note}` : ''}\n`;
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
}
