/**
 * Query Helper Functions for Tier 2 Database
 * Provides clean API for common operations without writing raw SQL
 *
 * Usage:
 *   const queries = require('./.project/lib/queries');
 *   const features = await queries.getActiveFeatures();
 *   const metrics = await queries.getSprintVelocity('SPRINT-1');
 */

const db = require('./database');

// ============================================================================
// FEATURE QUERIES
// ============================================================================

async function getAllFeatures() {
  return db.query('SELECT * FROM features ORDER BY initiated_at DESC');
}

async function getFeatureById(featureId) {
  return db.queryOne('SELECT * FROM features WHERE id = ?', [featureId]);
}

async function getFeatureByName(name) {
  return db.queryOne('SELECT * FROM features WHERE name = ?', [name]);
}

async function getActiveFeatures() {
  return db.query(
    `SELECT * FROM features WHERE status IN ('exploration', 'ready', 'in-sprint')
     ORDER BY initiated_at DESC`
  );
}

async function createFeature(id, name, description) {
  const result = await db.run(
    `INSERT INTO features (id, name, description, status)
     VALUES (?, ?, ?, 'exploration')`,
    [id, name, description]
  );
  return { id, ...result };
}

async function updateFeatureStatus(featureId, status) {
  return db.run(
    'UPDATE features SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, featureId]
  );
}

async function completeFeature(featureId) {
  return db.run(
    'UPDATE features SET status = ?, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    ['completed', featureId]
  );
}

// ============================================================================
// SPRINT QUERIES
// ============================================================================

async function getAllSprints() {
  return db.query('SELECT * FROM sprints ORDER BY created_at DESC');
}

async function getSprintById(sprintId) {
  return db.queryOne('SELECT * FROM sprints WHERE id = ?', [sprintId]);
}

async function getSprintsByFeature(featureId) {
  return db.query('SELECT * FROM sprints WHERE feature_id = ? ORDER BY created_at ASC', [featureId]);
}

async function getActiveSprints() {
  return db.query(
    'SELECT * FROM sprints WHERE status = ? ORDER BY started_at DESC',
    ['in-progress']
  );
}

async function createSprint(id, featureId, name, durationWeeks, plannedHours) {
  return db.run(
    `INSERT INTO sprints (id, feature_id, name, duration_weeks, planned_hours)
     VALUES (?, ?, ?, ?, ?)`,
    [id, featureId, name, durationWeeks, plannedHours]
  );
}

async function startSprint(sprintId) {
  return db.run(
    'UPDATE sprints SET status = ?, started_at = CURRENT_TIMESTAMP WHERE id = ?',
    ['in-progress', sprintId]
  );
}

async function completeSprint(sprintId) {
  return db.run(
    'UPDATE sprints SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
    ['completed', sprintId]
  );
}

async function updateSprintHours(sprintId, plannedHours, actualHours) {
  const velocityPercent = actualHours > 0 ? (actualHours / plannedHours) * 100 : 0;
  return db.run(
    `UPDATE sprints SET actual_hours = ?, velocity_percent = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [actualHours, velocityPercent, sprintId]
  );
}

// ============================================================================
// TASK QUERIES
// ============================================================================

async function getAllTasks() {
  return db.query('SELECT * FROM tasks ORDER BY created_at DESC');
}

async function getTaskById(taskId) {
  return db.queryOne('SELECT * FROM tasks WHERE id = ?', [taskId]);
}

async function getTasksBySprintId(sprintId) {
  return db.query('SELECT * FROM tasks WHERE sprint_id = ? ORDER BY created_at ASC', [sprintId]);
}

async function getTasksByAgent(agent) {
  return db.query('SELECT * FROM tasks WHERE assigned_agent = ? ORDER BY created_at DESC', [agent]);
}

async function getTasksByStatus(status) {
  return db.query('SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC', [status]);
}

async function getBlockedTasks() {
  return db.query('SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC', ['blocked']);
}

async function createTask(id, sprintId, taskNumber, title, agent, plannedHours, successCriteria) {
  return db.run(
    `INSERT INTO tasks (id, sprint_id, task_number, title, assigned_agent, planned_hours, success_criteria, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [id, sprintId, taskNumber, title, agent, plannedHours, JSON.stringify(successCriteria)]
  );
}

async function updateTaskStatus(taskId, status) {
  return db.run(
    'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, taskId]
  );
}

async function updateTaskHours(taskId, actualHours) {
  return db.run(
    'UPDATE tasks SET actual_hours = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [actualHours, taskId]
  );
}

// ============================================================================
// COMPLETION QUERIES
// ============================================================================

async function getAllCompletions() {
  return db.query('SELECT * FROM completions ORDER BY completed_at DESC');
}

async function getCompletionsByTask(taskId) {
  return db.query('SELECT * FROM completions WHERE task_id = ? ORDER BY completed_at DESC', [taskId]);
}

async function getCompletionsByAgent(agent) {
  return db.query('SELECT * FROM completions WHERE agent = ? ORDER BY completed_at DESC', [agent]);
}

async function recordCompletion(taskId, agent, status, deliverables, blockers, timeSpent, estimatedHours, qualityCheck, fullReport) {
  return db.run(
    `INSERT INTO completions (task_id, agent, status, deliverables, blockers, time_spent_hours, estimated_hours, quality_check_passed, reported_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      taskId,
      agent,
      status,
      JSON.stringify(deliverables),
      JSON.stringify(blockers),
      timeSpent,
      estimatedHours,
      qualityCheck ? 1 : 0,
      JSON.stringify(fullReport)
    ]
  );
}

// ============================================================================
// BLOCKER QUERIES
// ============================================================================

async function getAllBlockers() {
  return db.query('SELECT * FROM blockers ORDER BY created_at DESC');
}

async function getActiveBlockers() {
  return db.query('SELECT * FROM blockers WHERE status = ? ORDER BY created_at DESC', ['active']);
}

async function getBlockersByTask(taskId) {
  return db.query('SELECT * FROM blockers WHERE task_id = ? ORDER BY created_at DESC', [taskId]);
}

async function getBlockersByAgent(agent) {
  return db.query('SELECT * FROM blockers WHERE agent = ? ORDER BY created_at DESC', [agent]);
}

async function createBlocker(id, taskId, agent, issue, severity) {
  return db.run(
    `INSERT INTO blockers (id, task_id, agent, issue, severity, status)
     VALUES (?, ?, ?, ?, ?, 'active')`,
    [id, taskId, agent, issue, severity]
  );
}

async function resolveBlocker(blockerId, resolution) {
  return db.run(
    'UPDATE blockers SET status = ?, resolution = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?',
    ['resolved', resolution, blockerId]
  );
}

async function escalateBlocker(blockerId, escalatedTo) {
  return db.run(
    'UPDATE blockers SET status = ?, escalated_to = ?, escalated_at = CURRENT_TIMESTAMP WHERE id = ?',
    ['escalated', escalatedTo, blockerId]
  );
}

// ============================================================================
// METRICS & ANALYTICS
// ============================================================================

/**
 * Get sprint velocity metrics
 * @returns {Promise<object>} Velocity data with percentages
 */
async function getSprintVelocity(sprintId) {
  const sprint = await getSprintById(sprintId);
  if (!sprint) return null;

  const tasks = await getTasksBySprintId(sprintId);
  const completions = await db.query(
    'SELECT * FROM completions WHERE task_id IN (SELECT id FROM tasks WHERE sprint_id = ?)',
    [sprintId]
  );

  const completedTasks = completions.filter(c => c.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const totalPlanned = tasks.reduce((sum, t) => sum + (t.planned_hours || 0), 0);
  const totalActual = completions.reduce((sum, c) => sum + (c.time_spent_hours || 0), 0);
  const velocity = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

  return {
    sprint_id: sprintId,
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    completion_rate: completionRate,
    planned_hours: totalPlanned,
    actual_hours: totalActual,
    velocity_percent: velocity,
    status: sprint.status
  };
}

/**
 * Get blocker analytics
 * @returns {Promise<object>} Blocker statistics
 */
async function getBlockerAnalytics() {
  const activeBlockers = await getActiveBlockers();
  const allBlockers = await getAllBlockers();

  const avgAge = activeBlockers.length > 0
    ? activeBlockers.reduce((sum, b) => sum + (b.age_minutes || 0), 0) / activeBlockers.length
    : 0;

  const bySeverity = {
    critical: allBlockers.filter(b => b.severity === 'critical').length,
    high: allBlockers.filter(b => b.severity === 'high').length,
    medium: allBlockers.filter(b => b.severity === 'medium').length,
    low: allBlockers.filter(b => b.severity === 'low').length
  };

  const byStatus = {
    active: allBlockers.filter(b => b.status === 'active').length,
    resolved: allBlockers.filter(b => b.status === 'resolved').length,
    escalated: allBlockers.filter(b => b.status === 'escalated').length
  };

  return {
    total_blockers: allBlockers.length,
    active_blockers: activeBlockers.length,
    average_age_minutes: avgAge,
    by_severity: bySeverity,
    by_status: byStatus
  };
}

/**
 * Get agent productivity metrics
 * @param {string} agent - Agent name
 * @returns {Promise<object>} Agent statistics
 */
async function getAgentMetrics(agent) {
  const tasks = await getTasksByAgent(agent);
  const completions = await getCompletionsByAgent(agent);

  const completed = completions.filter(c => c.status === 'completed');
  const blocked = completions.filter(c => c.status === 'blocked');

  const totalPlanned = completed.reduce((sum, c) => sum + (c.estimated_hours || 0), 0);
  const totalActual = completed.reduce((sum, c) => sum + (c.time_spent_hours || 0), 0);
  const velocity = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

  const qualityChecksPassed = completed.filter(c => c.quality_check_passed).length;
  const qualityRate = completed.length > 0 ? (qualityChecksPassed / completed.length) * 100 : 0;

  return {
    agent,
    total_tasks: tasks.length,
    completed_tasks: completed.length,
    blocked_tasks: blocked.length,
    planned_hours: totalPlanned,
    actual_hours: totalActual,
    velocity_percent: velocity,
    quality_check_pass_rate: qualityRate
  };
}

/**
 * Get feature timeline metrics
 * @param {string} featureId - Feature ID
 * @returns {Promise<object>} Feature progress and timeline
 */
async function getFeatureMetrics(featureId) {
  const feature = await getFeatureById(featureId);
  if (!feature) return null;

  const sprints = await getSprintsByFeature(featureId);
  const tasks = await db.query('SELECT * FROM tasks WHERE sprint_id IN (SELECT id FROM sprints WHERE feature_id = ?)', [featureId]);
  const completions = await db.query('SELECT * FROM completions WHERE task_id IN (SELECT id FROM tasks WHERE sprint_id IN (SELECT id FROM sprints WHERE feature_id = ?))', [featureId]);

  const completedTasks = completions.filter(c => c.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const totalPlanned = tasks.reduce((sum, t) => sum + (t.planned_hours || 0), 0);
  const totalActual = completions.reduce((sum, c) => sum + (c.time_spent_hours || 0), 0);
  const velocity = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

  const daysInProgress = feature.started_at
    ? Math.floor((new Date() - new Date(feature.started_at)) / (1000 * 60 * 60 * 24))
    : null;

  return {
    feature_id: featureId,
    feature_name: feature.name,
    status: feature.status,
    total_sprints: sprints.length,
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    completion_rate: completionRate,
    planned_hours: totalPlanned,
    actual_hours: totalActual,
    velocity_percent: velocity,
    days_in_progress: daysInProgress,
    initiated_at: feature.initiated_at,
    started_at: feature.started_at,
    completed_at: feature.completed_at
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Feature queries
  getAllFeatures,
  getFeatureById,
  getFeatureByName,
  getActiveFeatures,
  createFeature,
  updateFeatureStatus,
  completeFeature,

  // Sprint queries
  getAllSprints,
  getSprintById,
  getSprintsByFeature,
  getActiveSprints,
  createSprint,
  startSprint,
  completeSprint,
  updateSprintHours,

  // Task queries
  getAllTasks,
  getTaskById,
  getTasksBySprintId,
  getTasksByAgent,
  getTasksByStatus,
  getBlockedTasks,
  createTask,
  updateTaskStatus,
  updateTaskHours,

  // Completion queries
  getAllCompletions,
  getCompletionsByTask,
  getCompletionsByAgent,
  recordCompletion,

  // Blocker queries
  getAllBlockers,
  getActiveBlockers,
  getBlockersByTask,
  getBlockersByAgent,
  createBlocker,
  resolveBlocker,
  escalateBlocker,

  // Analytics
  getSprintVelocity,
  getBlockerAnalytics,
  getAgentMetrics,
  getFeatureMetrics
};
