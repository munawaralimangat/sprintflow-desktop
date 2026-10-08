/**
 * Default configurations and constant definitions
 */

export const DEFAULT_STATUSES = [
  { id: 'todo', label: 'Backlog / To Do', color: '#71717a' },
  { id: 'in_design', label: 'In Design', color: '#a855f7' },
  { id: 'in_dev', label: 'In Development', color: '#3b82f6' },
  { id: 'code_review', label: 'Code Review', color: '#6366f1' },
  { id: 'qa_testing', label: 'Testing / QA', color: '#f59e0b' },
  { id: 'blocked', label: 'Blocked', color: '#ef4444' },
  { id: 'done', label: 'Done / Deployed', color: '#10b981' }
];

export const INITIAL_SPRINTS = [
  {
    id: 'sprint-1',
    name: 'Sprint 1',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    goal: 'Core architecture & feature delivery',
    active: true
  },
  {
    id: 'backlog',
    name: 'Product Backlog',
    startDate: '',
    endDate: '',
    goal: 'Future unassigned backlog items',
    active: false
  }
];

export const INITIAL_TASKS = [
  {
    id: 'task-1',
    sprintId: 'sprint-1',
    title: 'Draft OpenAPI 3.1 schema for telemetry v2',
    status: 'todo',
    priority: 'medium',
    note: 'Requirements finalized in sprint planning',
    createdAt: Date.now() - 18000000
  },
  {
    id: 'task-2',
    sprintId: 'sprint-1',
    title: 'Design user activity dashboard analytics UI',
    status: 'in_design',
    priority: 'medium',
    note: 'Figma component library updated',
    createdAt: Date.now() - 15000000
  },
  {
    id: 'task-3',
    sprintId: 'sprint-1',
    title: 'Implement OAuth2 token rotation & session refresh',
    status: 'in_dev',
    priority: 'high',
    note: 'Backend service branch feature/auth-refresh',
    createdAt: Date.now() - 12000000
  },
  {
    id: 'task-4',
    sprintId: 'sprint-1',
    title: 'Refactor Stripe webhook signature validation',
    status: 'code_review',
    priority: 'high',
    note: 'PR #108 awaiting review from senior dev',
    createdAt: Date.now() - 9000000
  },
  {
    id: 'task-5',
    sprintId: 'sprint-1',
    title: 'End-to-end integration tests for checkout flow',
    status: 'qa_testing',
    priority: 'medium',
    note: 'Automated Playwright test suite passing on staging',
    createdAt: Date.now() - 6000000
  },
  {
    id: 'task-6',
    sprintId: 'sprint-1',
    title: 'Staging DB memory connection leak',
    status: 'blocked',
    priority: 'high',
    note: 'Blocked: Waiting on DevOps memory profile analysis',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'task-7',
    sprintId: 'sprint-1',
    title: 'Database schema migration and index optimizations',
    status: 'done',
    priority: 'high',
    note: 'Applied and verified on production cluster',
    createdAt: Date.now() - 1800000
  }
];
