#!/usr/bin/env node

/**
 * Completion Hook: Triggered when SubagentStop event occurs
 * Logs agent completion to both JSON (Tier 1 backward compatibility) and SQLite (Tier 2)
 */

const fs = require('fs');
const path = require('path');
const db = require('./database');
const queries = require('./queries');

const PROJECT_ROOT = path.join(__dirname, '..');
const COMPLETIONS_FILE = path.join(PROJECT_ROOT, 'state', 'completions.json');

async function logCompletion(report) {
  try {
    // 1. Log to JSON file (Tier 1 backward compatibility)
    const timestamp = new Date().toISOString();
    const jsonEntry = {
      timestamp,
      event: 'agent_completed',
      agent: report.agent,
      task_id: report.task_id,
      sprint_id: report.sprint_id,
      status: report.status,
      time_spent: report.time_spent_hours,
      estimated_hours: report.estimated_hours,
      quality_check_passed: report.quality_check_passed,
      blockers: report.blockers
    };

    // Append to JSON file
    let completions = { entries: [] };
    if (fs.existsSync(COMPLETIONS_FILE)) {
      try {
        completions = JSON.parse(fs.readFileSync(COMPLETIONS_FILE, 'utf-8'));
      } catch (err) {
        console.error('[Hook] Error reading completions file:', err.message);
      }
    }

    if (!Array.isArray(completions.entries)) {
      completions.entries = [];
    }
    completions.entries.push(jsonEntry);
    fs.writeFileSync(COMPLETIONS_FILE, JSON.stringify(completions, null, 2));

    // 2. Log to database (Tier 2)
    await db.initialize();
    await queries.recordCompletion(
      report.task_id,
      report.agent,
      report.status,
      report.deliverables || [],
      report.blockers || [],
      report.time_spent_hours || 0,
      report.estimated_hours || 0,
      report.quality_check_passed !== false,
      report
    );

    console.log(`[Completion Hook] Logged: ${report.agent} - ${report.task_id}`);
  } catch (err) {
    console.error('[Completion Hook] Error:', err.message);
    // Don't fail the hook - just log the error
  }
}

// If invoked from command line with JSON input
if (require.main === module) {
  // Read report from stdin or command line argument
  const report = JSON.parse(process.argv[2] || '{}');
  logCompletion(report).then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { logCompletion };
