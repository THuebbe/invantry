---
name: validate-output
description: Validate agent deliverables against sprint task acceptance criteria. Checks completeness, quality, and readiness before moving to next phase.
argument-hint: <agent-name> <task-id>
allowed-tools: Read, Write
model: sonnet
---

# Quality Gate Validation

**Agent:** $1
**Task ID:** $2

## Your Mission

Validate that the agent's deliverables meet all sprint task requirements. This is the quality gate before moving forward.

## Validation Process

### Step 1: Get Task Definition

1. **Read sprint plan:** `cat .project/sprints/current.md`
2. **Find task $2** - Extract:
   - Expected deliverables (exact list)
   - Success criteria (all must pass)
   - Quality standards (tests, coverage, accessibility, etc.)

### Step 2: Verify Deliverables Exist

For each deliverable listed in sprint plan:

- [ ] **File/Artifact Exists?**
  - Check exact file path
  - File has content (not empty)
  - Format is correct

- [ ] **Content Quality?**
  - Read first 50 lines
  - Check for completeness indicators
  - Look for TODOs or incomplete sections

### Step 3: Check Success Criteria

Go through each criterion in sprint plan's task definition:

**Completeness Criteria:**
- [ ] All promised deliverables present and verified
- [ ] Code/documentation is complete, not partial
- [ ] Tests written (if applicable): [X%] coverage
- [ ] Documentation updated (if applicable)

**Quality Criteria:**
- [ ] Code follows existing project patterns
- [ ] No console errors or warnings (if checked)
- [ ] Accessibility standards met (if UI work)
- [ ] Performance targets met (if performance work)
- [ ] Security best practices followed (if backend work)

**Acceptance Criteria:**
- [ ] Feature works as designed (acceptance criterion 1)
- [ ] Feature works as designed (acceptance criterion 2)
- [ ] All specified behavior implemented
- [ ] Edge cases handled
- [ ] Error handling complete

**Agent's Quality Check:**
- [ ] Agent reported `quality_check_passed: true` in JSON report
- [ ] Blockers field is empty: `"blockers": []`
- [ ] No escalation needed: `"escalation_needed": false`

### Step 4: Validation Result

#### ✅ PASS - All criteria met

If all criteria pass:

```json
{
  "task_id": "$2",
  "agent": "$1",
  "validation_status": "PASS",
  "timestamp": "2025-11-19T14:30:00Z",
  "checklist_items_passed": [number],
  "checklist_items_total": [number],
  "next_action": "Approved. Ready for next phase: [Phase/Task]",
  "notes": "[Any observations about quality or performance]"
}
```

**Actions:**
1. Log to completion file
2. Update TodoWrite: Mark task COMPLETED
3. Report: "✅ Validation PASS - Task $2 approved. Proceeding to next task."
4. Move to next task immediately

#### ⚠️ FAIL - Some criteria not met

If criteria fail:

```json
{
  "task_id": "$2",
  "agent": "$1",
  "validation_status": "FAIL",
  "timestamp": "2025-11-19T14:30:00Z",
  "failed_criteria": [
    {
      "criterion": "[Description]",
      "expected": "[What was required]",
      "actual": "[What we found]",
      "severity": "high|medium|low",
      "remediation": "[How to fix it]"
    }
  ],
  "action_required": "Agent remediation requested",
  "notes": "[Details about why it failed]"
}
```

**Actions:**
1. Log failure to `.project/state/blockers.json`
2. Notify agent: "Task $2 validation FAILED. Issues found: [List]. Please remediate and resubmit."
3. Reassign agent back to task with specific issues
4. Schedule re-validation after remediation

## Validation Checklist Template

Use this for any task:

### Completeness
- [ ] All deliverables from plan exist at promised paths
- [ ] No placeholder text or TODOs remaining
- [ ] Documentation complete and accurate
- [ ] Tests written (if applicable)
- [ ] Code comments added where complex logic exists

### Quality
- [ ] Code/design follows existing patterns in project
- [ ] No obvious bugs or issues
- [ ] Performance acceptable (< [specified target])
- [ ] Accessibility basics in place (if UI)
- [ ] Security considerations addressed (if backend)

### Acceptance Criteria
- [ ] Criterion 1: [From sprint plan]
- [ ] Criterion 2: [From sprint plan]
- [ ] Criterion 3: [From sprint plan]
- [ ] Criterion 4: [From sprint plan]
- [ ] Criterion 5: [From sprint plan]

### Agent Validation
- [ ] Agent reported completion in JSON format
- [ ] No blockers listed (`"blockers": []`)
- [ ] Quality check marked passed (`"quality_check_passed": true`)
- [ ] Deliverables match promised outputs
- [ ] Time spent reasonable (vs estimate)

## Special Validations

**For Frontend Components:**
- [ ] Component renders without errors
- [ ] Responsive at 375px, 768px, 1920px
- [ ] Keyboard navigation works (Tab through)
- [ ] ARIA labels present
- [ ] Color contrast passes WCAG AA (4.5:1)

**For Backend APIs:**
- [ ] All endpoints respond with correct status codes
- [ ] Request/response schemas match specification
- [ ] Authentication/authorization working
- [ ] Error handling for all scenarios
- [ ] Rate limiting (if applicable)

**For QA/Testing:**
- [ ] Test coverage >= 80% (or specified target)
- [ ] All test cases passing
- [ ] Edge cases covered
- [ ] Documentation of test scenarios
- [ ] CI integration verified

## Quick Pass/Fail Decision

**Auto-PASS if:**
✅ Agent reported completed with JSON
✅ All deliverables exist at specified paths
✅ Agent marked quality_check_passed: true
✅ No blockers listed
✅ Spot check of 1-2 deliverables looks good

**Auto-FAIL if:**
❌ Deliverables don't exist or are empty
❌ Code has obvious bugs or errors
❌ Required tests not written
❌ Agent reported blockers remain
❌ Quality check marked as failed

## Validation Success Criteria

Your validation is complete when:

- [ ] All deliverables verified to exist and have content
- [ ] All acceptance criteria checked and passed/failed noted
- [ ] Quality standards validated
- [ ] PASS or FAIL decision made with clear reasoning
- [ ] Result logged to project state
- [ ] Agent or PM notified of decision
- [ ] Next action determined (proceed or remediate)

Remember: Validation is about protecting sprint quality without being overly strict. Aim for "good enough to move forward" not "perfection." Your goal is to catch blocking issues, not nit-pick.
