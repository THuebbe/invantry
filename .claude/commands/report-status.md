---
name: report-status
description: Generate current sprint status report from task tracking and completion logs. Shows progress, velocity, blockers, and next 48-hour forecast.
allowed-tools: Read, TodoWrite
model: sonnet
---

# Sprint Status Report

## Your Mission

Generate a comprehensive status snapshot of the current sprint. This report keeps the Project Manager and stakeholders informed without requiring detailed context switching.

## Status Report Generation

### Step 1: Read Current Sprint Info from Database (Tier 2)

```javascript
const queries = require('./.project/lib/queries');

// Get active sprints
const activeSprints = await queries.getActiveSprints();
const currentSprint = activeSprints[0]; // Most recent active sprint

// Get sprint details
const sprintId = currentSprint.id;
const tasks = await queries.getTasksBySprintId(sprintId);
const completions = await queries.getCompletionsByTask(sprintId);
const blockers = await queries.getActiveBlockers();

// Get velocity metrics
const velocity = await queries.getSprintVelocity(sprintId);
const blockerAnalytics = await queries.getBlockerAnalytics();
```

Extract:
- Sprint name: `currentSprint.name`
- Sprint duration: `currentSprint.duration_weeks`
- Total estimated hours: `currentSprint.planned_hours`
- Planned tasks: `tasks` array
- Actual hours: `velocity.actual_hours`
- Completion rate: `velocity.completion_rate`

### Step 2: Analyze Completion

From TodoWrite:
- Count completed tasks
- Count in-progress tasks
- Count blocked tasks
- Count pending tasks

From completions.json:
- Actual hours spent per task
- Velocity (hours completed / hours estimated)
- Tasks ahead/behind estimate

### Step 3: Generate Report

Create status report with this structure:

---

## **Sprint Status Report**

### Overview

**Sprint:** [Name]
**Duration:** [Start date] → [End date] ([days remaining])
**Status:** [On Track / At Risk / In Trouble]

### Progress

| Metric | Status |
|--------|--------|
| Tasks Completed | X of Y |
| Hours Burned | XX of XXX |
| Velocity | [%] vs Plan |
| Quality Gates | ✅ [N] Passed / ⚠️ [N] At Risk |

### Task Status

**Completed Tasks:**
- [Task 1] - [Agent] - [Hours] vs [Estimate]
- [Task 2] - [Agent] - [Hours] vs [Estimate]

**In Progress:**
- [Task N] - [Agent] - [Hours so far / Estimate]
  - Expected complete: [Date]

**Blocked:**
- [Task N] - [Agent] - Blocked by: [Issue]
  - Severity: [high/medium]
  - Age: [X hours]

**Pending:**
- [Task N] - [Agent] - [Estimate] hours

### Blockers Report

**Active Blockers:** [Number]

| Issue | Severity | Age | Impact |
|-------|----------|-----|--------|
| [Issue 1] | 🔴 High | 1.5h | Blocks Task X, Y |
| [Issue 2] | 🟡 Medium | 30m | Blocks Task Z |

### Next 48 Hours Forecast

**Ready to Start:**
- [Task A] - [Agent] - est. [X] hours - **Start immediately**
- [Task B] - [Agent] - est. [X] hours - **Start after Task A blocked**

**Dependencies Waiting:**
- [Task X] - Waiting for [Blocker] to resolve

**Critical Path Items:**
- [Task Y] - Must complete by [Date] to stay on schedule

### Health Indicators

**Velocity:**
- Plan: 40 hours
- Completed: 25 hours ([62]%)
- Pace: [On track / Ahead / Behind]

**Quality:**
- Tests Passing: [%]
- Coverage: [%]
- Accessibility Audit: [Pass / Needs work]
- Blockers Age: Avg [X] hours

**Team Status:**
- No agents blocked (they can continue work)
- Agents available: [List]
- Agents at capacity: [List]

### Scrum Master Notes

[Any observations, risks, or notes about sprint health]

### Action Items

**Immediate (Today):**
- [ ] Resolve [Blocker 1] to unblock [Task X]
- [ ] Review [Task Y] quality gate

**This Week:**
- [ ] Complete Phase 1 by [Date]
- [ ] Monitor velocity trend

---

## Report Delivery

When report is complete:

1. **Display to Scrum Master:** Present this status report
2. **Update sprint doc:** Save to `.project/sprints/current.md` (append status section)
3. **Format for PM:** Prepare summary for Project Manager if needed
4. **Track trends:** Note any velocity changes or new patterns

## Status Classifications

**On Track:**
- Completed: 50%+ of tasks or hours
- Blockers: None or resolved within 2 hours
- Velocity: 90-110% of plan
- Quality gates: All passing

**At Risk:**
- Completed: 25-50% of tasks or hours
- Blockers: 1-2 active, age < 4 hours
- Velocity: 75-90% of plan
- Quality gates: 1 failing, action plan in place

**In Trouble:**
- Completed: < 25% of tasks
- Blockers: 3+ active or age > 4 hours
- Velocity: < 75% of plan
- Quality gates: 2+ failing with no resolution

## When to Run

**Recommended:**
- Daily standup (quick 5-minute update)
- At end of each task completion
- When blocker occurs
- When sprint health changes

**Output:** Use to brief Project Manager on sprint health without context switching.

Remember: Clear status reporting keeps the team synchronized and enables quick decision-making when blockers occur.
