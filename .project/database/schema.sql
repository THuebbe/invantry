-- Tier 2 Database Schema for Invantry Project Orchestration
-- SQLite Database for persistent state tracking across sessions

-- Features Table: Tracks all features from initiation through completion
CREATE TABLE IF NOT EXISTS features (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'exploration', -- exploration, ready, in-sprint, completed, archived
  initiated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Sprints Table: Tracks sprint plans and execution
CREATE TABLE IF NOT EXISTS sprints (
  id TEXT PRIMARY KEY,
  feature_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning', -- planning, in-progress, completed
  duration_weeks INTEGER,
  planned_hours INTEGER,
  actual_hours INTEGER DEFAULT 0,
  velocity_percent REAL, -- (actual / planned) * 100
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (feature_id) REFERENCES features(id)
);

-- Tasks Table: Individual sprint tasks assigned to agents
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  sprint_id TEXT NOT NULL,
  task_number TEXT NOT NULL, -- e.g., "SPRINT-1-TASK-1"
  title TEXT NOT NULL,
  description TEXT,
  assigned_agent TEXT NOT NULL, -- frontend-specialist, backend-specialist, etc.
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in-progress, completed, blocked
  planned_hours INTEGER,
  actual_hours REAL,
  dependencies TEXT, -- JSON array of task IDs this depends on
  success_criteria TEXT, -- JSON array of criteria
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (sprint_id) REFERENCES sprints(id)
);

-- Completions Table: Track when agents complete tasks
CREATE TABLE IF NOT EXISTS completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  agent TEXT NOT NULL,
  status TEXT NOT NULL, -- completed, blocked, escalated
  deliverables TEXT, -- JSON array of deliverable objects
  blockers TEXT, -- JSON array if blocked
  time_spent_hours REAL,
  estimated_hours REAL,
  quality_check_passed BOOLEAN,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reported_json TEXT, -- Full JSON report from agent
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Blockers Table: Track active and resolved blockers
CREATE TABLE IF NOT EXISTS blockers (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  agent TEXT NOT NULL,
  issue TEXT NOT NULL,
  severity TEXT NOT NULL, -- low, medium, high, critical
  status TEXT NOT NULL DEFAULT 'active', -- active, resolved, escalated
  age_minutes INTEGER,
  resolution_attempts TEXT, -- JSON array of what was tried
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  resolution TEXT,
  escalated_to TEXT, -- who it was escalated to
  escalated_at TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Agent Reports Table: Store structured agent completion reports
CREATE TABLE IF NOT EXISTS agent_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent TEXT NOT NULL,
  task_id TEXT,
  sprint_id TEXT,
  report_type TEXT NOT NULL, -- task_completion, sprint_summary, blocker_report, etc.
  status TEXT NOT NULL, -- completed, blocked
  deliverables TEXT, -- JSON array of deliverables
  blockers TEXT, -- JSON array if blocked
  quality_check_passed BOOLEAN,
  time_spent_hours REAL,
  estimated_hours REAL,
  metrics TEXT, -- JSON object of agent-specific metrics
  next_action TEXT,
  notes TEXT,
  reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  full_report TEXT -- Full JSON report for archival
);

-- Metrics Table: Aggregate metrics for dashboards and reporting
CREATE TABLE IF NOT EXISTS metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id TEXT,
  sprint_id TEXT,
  metric_type TEXT NOT NULL, -- velocity, blocker_age, completion_rate, etc.
  metric_value REAL,
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  FOREIGN KEY (feature_id) REFERENCES features(id),
  FOREIGN KEY (sprint_id) REFERENCES sprints(id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_features_status ON features(status);
CREATE INDEX IF NOT EXISTS idx_features_created ON features(initiated_at);
CREATE INDEX IF NOT EXISTS idx_sprints_feature ON sprints(feature_id);
CREATE INDEX IF NOT EXISTS idx_sprints_status ON sprints(status);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint ON tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_completions_task ON completions(task_id);
CREATE INDEX IF NOT EXISTS idx_completions_agent ON completions(agent);
CREATE INDEX IF NOT EXISTS idx_completions_date ON completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_blockers_task ON blockers(task_id);
CREATE INDEX IF NOT EXISTS idx_blockers_status ON blockers(status);
CREATE INDEX IF NOT EXISTS idx_blockers_created ON blockers(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_reports_agent ON agent_reports(agent);
CREATE INDEX IF NOT EXISTS idx_agent_reports_task ON agent_reports(task_id);
CREATE INDEX IF NOT EXISTS idx_metrics_feature ON metrics(feature_id);
CREATE INDEX IF NOT EXISTS idx_metrics_sprint ON metrics(sprint_id);
