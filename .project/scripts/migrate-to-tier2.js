#!/usr/bin/env node

/**
 * Migration Script: Tier 1 JSON → Tier 2 SQLite
 * Safely migrate all state data from file-based JSON to SQLite database
 *
 * Usage:
 *   node .project/scripts/migrate-to-tier2.js [--dry-run] [--backup]
 *
 * Options:
 *   --dry-run   Preview changes without modifying database
 *   --backup    Create backup of state files before migration (default: true)
 */

const fs = require('fs');
const path = require('path');
const db = require('../lib/database');
const queries = require('../lib/queries');

const PROJECT_ROOT = path.join(__dirname, '..');
const STATE_DIR = path.join(PROJECT_ROOT, 'state');
const BACKUP_DIR = path.join(PROJECT_ROOT, `state-backup-${new Date().toISOString().split('T')[0]}`);

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const createBackup = !args.includes('--no-backup');

// ============================================================================
// MIGRATION LOGIC
// ============================================================================

/**
 * Load JSON file if it exists
 */
function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return { entries: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`[Error] Failed to parse ${filePath}:`, err.message);
    return { entries: [] };
  }
}

/**
 * Backup state directory
 */
async function backupStateFiles() {
  console.log(`\n[Backup] Creating backup at ${BACKUP_DIR}...`);

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Copy all JSON files
  const files = ['completions.json', 'blockers.json', 'features.json'];
  for (const file of files) {
    const src = path.join(STATE_DIR, file);
    const dst = path.join(BACKUP_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
      console.log(`  ✓ Backed up ${file}`);
    }
  }
}

/**
 * Migrate completions from JSON to database
 */
async function migrateCompletions(data) {
  console.log('\n[Migrate] Processing completions...');

  const completions = Array.isArray(data) ? data : (data.entries || []);
  let count = 0;

  for (const completion of completions) {
    // Skip system entries
    if (completion.event === 'system') continue;

    try {
      // Extract data from completion
      const taskId = completion.task_id || 'UNKNOWN';
      const agent = completion.agent || 'unknown';
      const status = completion.status || 'unknown';
      const timeSpent = completion.time_spent || 0;
      const timestamp = completion.timestamp || new Date().toISOString();

      if (dryRun) {
        console.log(`  [DRY-RUN] Would record: ${agent} completed ${taskId}`);
      } else {
        await queries.recordCompletion(
          taskId,
          agent,
          status,
          completion.deliverables || [],
          completion.blockers || [],
          timeSpent,
          completion.estimated_hours || 0,
          completion.quality_check_passed !== false,
          completion // Full report as JSON
        );
      }
      count++;
    } catch (err) {
      console.error(`  [Error] Failed to migrate completion:`, err.message);
    }
  }

  console.log(`  ✓ Migrated ${count} completions`);
  return count;
}

/**
 * Migrate blockers from JSON to database
 */
async function migrateBlockers(data) {
  console.log('\n[Migrate] Processing blockers...');

  const blockers = Array.isArray(data) ? data : (data.entries || []);
  let count = 0;

  for (const blocker of blockers) {
    // Skip system entries
    if (blocker.event === 'system') continue;

    try {
      const blockerId = `BLOCKER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const taskId = blocker.task_id || 'UNKNOWN';
      const agent = blocker.agent || 'unknown';
      const issue = blocker.issue || 'Unknown issue';
      const severity = blocker.severity || 'medium';

      if (dryRun) {
        console.log(`  [DRY-RUN] Would create: ${blockerId} (${severity}) - ${issue}`);
      } else {
        await queries.createBlocker(blockerId, taskId, agent, issue, severity);
      }
      count++;
    } catch (err) {
      console.error(`  [Error] Failed to migrate blocker:`, err.message);
    }
  }

  console.log(`  ✓ Migrated ${count} blockers`);
  return count;
}

/**
 * Migrate features from JSON to database
 */
async function migrateFeatures(data) {
  console.log('\n[Migrate] Processing features...');

  const features = Array.isArray(data) ? data : (data.entries || []);
  let count = 0;

  for (const feature of features) {
    // Skip system entries
    if (feature.event === 'system') continue;

    try {
      const featureId = feature.feature_id || `FEATURE-${Date.now()}`;
      const name = feature.name || 'Unnamed Feature';
      const description = feature.description || '';

      if (dryRun) {
        console.log(`  [DRY-RUN] Would create: ${featureId} - ${name}`);
      } else {
        // Check if feature already exists
        const existing = await queries.getFeatureById(featureId);
        if (!existing) {
          await queries.createFeature(featureId, name, description);
        }
      }
      count++;
    } catch (err) {
      console.error(`  [Error] Failed to migrate feature:`, err.message);
    }
  }

  console.log(`  ✓ Migrated ${count} features`);
  return count;
}

/**
 * Run migration
 */
async function runMigration() {
  try {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║     Tier 2 Migration: JSON State Files → SQLite Database        ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');

    if (dryRun) {
      console.log('\n⚠️  DRY-RUN MODE: No changes will be made\n');
    }

    // Initialize database
    console.log('\n[Setup] Initializing database...');
    db.initialize();
    await new Promise(resolve => setTimeout(resolve, 500)); // Give DB time to initialize

    // Backup files if requested
    if (createBackup && !dryRun) {
      await backupStateFiles();
    }

    // Load and migrate data
    console.log('\n[Load] Reading state files...');
    const completionsData = loadJson(path.join(STATE_DIR, 'completions.json'));
    const blockersData = loadJson(path.join(STATE_DIR, 'blockers.json'));
    const featuresData = loadJson(path.join(STATE_DIR, 'features.json'));

    // Execute migrations
    const completionCount = await migrateCompletions(completionsData);
    const blockerCount = await migrateBlockers(blockersData);
    const featureCount = await migrateFeatures(featuresData);

    // Show summary
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    if (dryRun) {
      console.log('║                    DRY-RUN COMPLETE                           ║');
    } else {
      console.log('║                 MIGRATION COMPLETE                            ║');
    }
    console.log('╚════════════════════════════════════════════════════════════════╝');

    console.log('\n[Results]');
    console.log(`  • Features: ${featureCount} migrated`);
    console.log(`  • Completions: ${completionCount} migrated`);
    console.log(`  • Blockers: ${blockerCount} migrated`);

    if (!dryRun) {
      const stats = await db.getStats();
      console.log(`\n[Database Stats]`);
      console.log(`  • Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  • Features: ${stats.tables.features || 0}`);
      console.log(`  • Sprints: ${stats.tables.sprints || 0}`);
      console.log(`  • Tasks: ${stats.tables.tasks || 0}`);
      console.log(`  • Completions: ${stats.tables.completions || 0}`);
      console.log(`  • Blockers: ${stats.tables.blockers || 0}`);

      if (createBackup) {
        console.log(`\n[Backup] State files backed up to:`);
        console.log(`  ${BACKUP_DIR}`);
      }
    }

    console.log('\n✓ Migration script completed successfully\n');
    process.exit(0);
  } catch (err) {
    console.error('\n✗ Migration failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// ============================================================================
// RUN
// ============================================================================

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration, migrateCompletions, migrateBlockers, migrateFeatures };
