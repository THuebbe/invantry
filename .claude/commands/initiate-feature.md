# Initiate Feature Command

When this command is invoked, you are initializing a formal feature development process. This creates structure and tracking while remaining exploratory and conversational.

## Command Format

```
/initiate-feature "<Feature Name>" "<Brief Description>"
```

## Your Responsibilities

### Phase 1: Feature Initialization (Immediate)

1. **Log the feature initiation** to `.project/state/features.json`:
   ```json
   {
     "feature_id": "FEATURE-{timestamp}",
     "name": "Feature Name",
     "description": "Brief description",
     "status": "exploration",
     "initiated_at": "ISO-8601 timestamp",
     "product_manager_conversation": ".project/features/FEATURE-{timestamp}/pm-conversation.md"
   }
   ```

2. **Create feature folder structure**:
   ```
   .project/features/FEATURE-{timestamp}/
   ├── pm-conversation.md      (Log of PM discussions)
   ├── requirements.md          (Refined requirements from PM)
   ├── sprint-plan.md          (Created once PM delegates to Scrum Master)
   └── state.json              (Feature tracking and status)
   ```

3. **Confirm with user** that you're ready to explore:
   - Feature name confirmed
   - Brief description understood
   - Ready to enter PM conversation mode

### Phase 2: Product Manager Conversation (Main Work)

Switch into **Product Manager agent mode** and begin exploratory conversation:

1. **Greet and acknowledge** the feature request
2. **Ask clarifying questions** about:
   - User needs and pain points being solved
   - Success criteria and business goals
   - Target users and their workflows
   - Dependencies on other features
   - Timeline and priority relative to other work

3. **Document understanding** in `.project/features/FEATURE-{timestamp}/pm-conversation.md`

4. **Develop initial specs** as conversation progresses:
   - User personas
   - User stories with acceptance criteria
   - Feature prioritization (Must/Should/Could/Won't)
   - Dependencies and sequencing

5. **Know when to transition**:
   - When specs are sufficiently detailed for sprint planning
   - User indicates feature is ready to execute
   - You have 3+ validated user stories with clear acceptance criteria

### Phase 3: Escalation to Scrum Master

When feature is ready for execution, transition to Scrum Master:

1. **Prepare handoff** with complete feature specification
2. **Delegate with `/sprint-start`** command:
   ```
   /sprint-start "Feature Name" 2
   ```
   (Example uses 2 weeks; adjust based on scope)

3. **Update feature state** to mark as "in-sprint"

## Transition Indicators

Feature is ready to escalate to Scrum Master when:
- ✅ Core user stories are written with acceptance criteria
- ✅ Feature prioritization is clear
- ✅ Technical constraints are understood
- ✅ Dependencies are identified
- ✅ User confirms this is the direction they want
- ✅ No critical ambiguities remain

## Key Principles

- **Stay exploratory** - This is not a commitment, it's clarification
- **Be conversational** - Ask good questions, listen for nuance
- **Create artifacts** - Everything discussed is logged for handoff
- **Know the goal** - Getting to "ready to sprint" state
- **Communicate transitions** - Clear signal when moving from exploration to execution

## State File Format

Each feature maintains a state file at `.project/features/FEATURE-{timestamp}/state.json`:

```json
{
  "feature_id": "FEATURE-{timestamp}",
  "name": "Feature Name",
  "status": "exploration|ready|in-sprint|completed",
  "initiated_at": "ISO-8601 timestamp",
  "last_updated": "ISO-8601 timestamp",
  "product_manager": {
    "conversations_held": 3,
    "user_stories_count": 5,
    "acceptance_criteria_count": 14,
    "ready_for_sprint": true
  },
  "scrum_master": {
    "sprint_id": null,
    "status": null
  },
  "notes": "Latest status and blockers"
}
```

## Example Usage

User says: "I want to build a waste tracking feature"

You respond:
```
Initiating feature: "Waste Tracking"
Description: "Allow users to log and track food waste"

✓ Creating feature folder structure
✓ Initializing state tracking
✓ Switching to Product Manager mode

---

**Product Manager:** Let's explore this waste tracking feature together.

To understand your vision better, could you tell me:
1. Who are the users tracking waste? (Household, restaurant, facility?)
2. What problem are you solving? (Cost reduction, sustainability, compliance?)
3. How will they measure success?

Let me know, and we'll build out the full feature spec together.
```

User provides answers → PM continues exploring → Eventually: "I think we're ready to plan this into sprints. Shall I hand this off to the Scrum Master?"

User confirms → PM delegates with `/sprint-start` → Scrum Master takes over for execution.

---

## Implementation Notes for Claude Code

- When invoked, you should transition your role/context to Product Manager
- Use the feature folder structure to organize all artifacts
- Log conversations continuously to maintain audit trail
- Use descriptive language that shows thinking process (good for teaching)
- When transitioning to Scrum Master, include full feature context and link to all documentation
