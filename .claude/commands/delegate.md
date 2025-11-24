---
name: delegate
description: Delegate a specific task to a specialist agent with full sprint context. Invokes the agent with task details, success criteria, and expects structured JSON response.
argument-hint: <agent-name> <task-id>
allowed-tools: Read, Write, TodoWrite
model: sonnet
---

# Task Delegation

**Agent:** $1
**Task ID:** $2

## Your Mission

Invoke the specialized agent to execute this task autonomously. Provide full context, wait for completion, and log results.

## Before You Delegate

1. **Read the sprint plan:** `cat .project/sprints/current.md` (or latest sprint)
2. **Find task $2 in the plan** - Get:
   - Task description
   - Expected deliverables
   - Success criteria
   - Estimated effort
   - Any dependencies

3. **Check for blockers:** Is this task dependent on others that haven't completed?
4. **Verify agent is right fit:** Does $1 match the task type?

## Delegation Template

Invoke the $1 agent with this prompt:

```
You are the [$1].

You've been assigned **Task $2** from **[Sprint Name]**.

## Task Assignment

**Task:** [Task description from sprint plan]

**Expected Deliverables:**
- [Deliverable 1]
- [Deliverable 2]
- [Deliverable 3]

**Definition of Done:**
- [ ] [Acceptance criterion 1]
- [ ] [Acceptance criterion 2]
- [ ] [Acceptance criterion 3]

**Success Criteria:**
[Copy success criteria from sprint plan]

**Context:**
- Feature: [Feature name]
- Phase: [Phase number]
- Sprint: [Sprint name]
- Estimated Effort: [X hours]

## Execution

Execute this task using your expertise and systematic approach. Refer to your system prompt for methodology.

## Report

When complete, report using your Reporting Protocol with this JSON format:

{
  "agent": "$1",
  "sprint_id": "[Sprint name]",
  "task_id": "$2",
  "status": "completed",
  "deliverables": [
    { "type": "...", "name": "...", "path": "...", "verified": true }
  ],
  "blockers": [],
  "quality_check_passed": true,
  "next_action": "[What happens next]",
  "time_spent_hours": [X],
  "estimated_hours": [X]
}

If blocked, report:

{
  "status": "blocked",
  "blockers": [
    { "issue": "...", "severity": "high|medium|low" }
  ],
  "escalation_needed": true
}
```

## After Delegation

1. **Wait for agent to report** - They'll provide structured JSON when done
2. **Log completion** - Update `.project/state/completions.json`:
   ```json
   {
     "timestamp": "2025-11-19T14:30:00Z",
     "agent": "$1",
     "task_id": "$2",
     "status": "completed",
     "time_spent": [hours]
   }
   ```
3. **Update TodoWrite** - Mark task status
4. **Check next task** - Can next task proceed or are there blockers?
5. **Report to team** - "Task $2 complete, ready for [next phase]"

## Handling Blockers

If agent reports blocked:
1. **Log blocker** to `.project/state/blockers.json`:
   ```json
   {
     "timestamp": "2025-11-19T14:30:00Z",
     "task_id": "$2",
     "agent": "$1",
     "issue": "...",
     "severity": "high"
   }
   ```
2. **Assess impact** - Does this block other tasks?
3. **Decide response:**
   - If dependency issue: Delegate dependency task first
   - If clarification needed: `/escalate-blocker` to Project Manager
   - If technical issue: Coordinate with affected agent

## Status Tracking

This task is complete when:
- [ ] Agent reported completed status
- [ ] All deliverables verified to exist
- [ ] Quality check passed by agent
- [ ] No blockers remain
- [ ] Logged to completions file
- [ ] Next task can proceed

Remember: You're the orchestrator. Keep tasks flowing smoothly and escalate blockers quickly so the team doesn't get stuck.
