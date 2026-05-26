---
name: plan-execution
description: 'Execute implementation plans by parsing plan directories and managing phased task execution with automatic progress tracking and todo list management.'
---

# Execute Implementation Plan

## Primary Directive

Your goal is to execute implementation plans by loading plan directories from the `/plan/` directory, parsing the plan.md structure, reading findings.md for context, checking feedbacks.md for customer input, creating dynamic todo lists, executing tasks phase by phase in auto-execution mode, and updating progress automatically. All execution must follow the plan's phase architecture with sequential progression and parallel task execution within phases.

## Execution Context

This skill is designed for AI-to-AI communication and automated processing. All instructions must be interpreted literally and executed systematically without human interpretation or clarification.

## Core Capabilities

- **Auto-Execution Mode**: Automatically execute all tasks in sequence without user prompts for each task
- **Plan Parsing**: Read and parse plan.md files with YAML front matter from directory structure
- **Findings Integration**: Load and utilize findings.md for development context and file analysis
- **Feedback Review**: Check feedbacks.md for customer input before execution (never modify this file)
- **Phase Management**: Enforce sequential phase progression with parallel task execution within phases
- **Todo List Management**: Create and maintain dynamic todo lists during execution
- **Progress Tracking**: Update plan.md files with real-time completion status and timestamps
- **Checkpoint System**: Resume from last completed phase if execution is interrupted

## Plan Directory Specification

Implementation plans must be located in `/plan/` directory using directory-based structure:

```
[purpose]-[component]-[version]/
├── plan.md        # Main implementation plan with structured phases, tasks, requirements, risks
├── findings.md    # Development strategies, file paths, and analysis to reduce data search
└── feedbacks.md   # Customer feedback (AI MUST NOT modify this file)
```

- Directory naming: `[purpose]-[component]-[version]`
- Example: `feature-auth-module-1`, `upgrade-system-command-4`
- Purpose prefixes: `upgrade|refactor|feature|data|infrastructure|process|architecture|design`

## File Responsibilities

| File           | Purpose                                                                                      | AI Can Modify |
| -------------- | -------------------------------------------------------------------------------------------- | ------------- |
| `plan.md`      | Main implementation plan with structured phases, tasks, requirements, risks                  | ✅ Yes        |
| `findings.md`  | Development strategies, file paths, analysis of what files do/don't do, relevant discoveries | ✅ Yes        |
| `feedbacks.md` | Customer feedback collection - user-reported issues and requirements                         | ❌ NO         |

## Execution Workflow

### Phase 1: Load and Parse Plan Directory

1. **Locate Plan Directory**
   - Check `/plan/` directory for available plan directories
   - Use provided plan directory name or list available plans
   - Validate directory exists and contains required files (plan.md, findings.md, feedbacks.md)

2. **Read Findings.md First**
   - Load findings.md to understand development strategies
   - Review file analysis section for context on what files do/don't do
   - Note any technical discoveries or architecture decisions
   - This reduces redundant data searching during execution

3. **Check feedbacks.md**
   - Read feedbacks.md to review customer-reported issues and requirements
   - **IMPORTANT**: Never modify this file - it is the customer source of truth
   - Incorporate feedback insights into plan understanding
   - Update plan.md if feedback requires adjustments

4. **Parse plan.md Front Matter**
   Extract from YAML front matter:
   - `goal`: Plan title
   - `status`: Current status (Planned, In progress, Completed, Deprecated, On Hold)
   - `version`: Version identifier
   - `date_created`: Creation date
   - `owner`: Owner/responsible team

5. **Extract Implementation Phases**
   - Parse section "## 2. Implementation Steps"
   - Identify each "### Implementation Phase N" section
   - Extract GOAL-\* identifiers and descriptions
   - Parse task tables with columns: Task, Description, Completed, Date

### Phase 2: Create Execution Todo List

1. **Initialize Todo List**
   Create a tracking structure:

   ```markdown
   ## Execution Progress: [Plan Name]

   ### Phase 1: [GOAL-001 Description]

   - [ ] TASK-001: [Description]
   - [ ] TASK-002: [Description]
   - [ ] TASK-003: [Description]

   ### Phase 2: [GOAL-002 Description]

   - [ ] TASK-004: [Description]
   - [ ] TASK-005: [Description]
   ```

2. **Track in Task Progress**
   Use the `task_progress` parameter to track overall execution state:
   - Mark tasks complete as [x]
   - Keep pending as [ ]
   - Update as execution progresses

### Phase 3: Execute Phase by Phase

1. **Phase Entry Validation**
   - Verify previous phase is 100% complete before starting
   - Log phase start with timestamp

2. **Task Execution within Phase**
   - Execute tasks in parallel where no dependencies specified
   - For each task:
     - Read task description from plan.md
     - Reference findings.md for relevant file analysis and strategies
     - Identify target files, functions, or changes
     - Execute the required modifications
     - Verify completion against task description
   - Mark task complete with timestamp in plan.md file

3. **Phase Completion**
   - Verify all tasks in phase are marked complete
   - Update plan.md status if appropriate
   - Log phase completion
   - Proceed to next phase

### Phase 4: Update Plan Files

For each completed task, update plan.md:

1. Add completion marker (✅) to task table
2. Add completion date in Date column
3. If all tasks in phase complete, phase is complete

When all phases complete:

1. Update front matter `status` to "Completed"
2. Update `last_updated` to current date
3. Generate final execution report

**IMPORTANT**: Do NOT modify feedbacks.md - this file must remain as customer reported.

## Status Management

Status transitions:

- `Planned` → `In progress` (when first task begins)
- `In progress` → `Completed` (when all phases done)
- Any status → `On Hold` (if user requests pause)
- Any status → `Deprecated` (if plan is abandoned)

Status colors for badges:

- Completed: brightgreen
- In progress: yellow
- Planned: blue
- Deprecated: red
- On Hold: orange

## File Modification Protocol

When executing tasks that modify files:

1. **Reference Findings.md**
   - Check findings.md for file analysis (what files do/don't do)
   - Review development strategies for the implementation approach

2. **Read Target File**
   - Use `read_file` to read current content
   - Identify exact lines to modify

3. **Execute Modification**
   - Use `replace_in_file` for targeted changes
   - Use `write_to_file` for new files
   - Use `execute_command` for CLI operations

4. **Verify Modification**
   - Read file after change
   - Confirm expected content is present

5. **Update Plan.md**
   - Mark task complete in plan.md file
   - Update todo list

6. **Update Findings.md (if needed)**
   - Add new discoveries or insights found during implementation
   - Update file analysis if new understanding emerges

## Execution Commands

### Start Execution

```
/execute-plan <plan-directory>
```

Example: `/execute-plan upgrade-system-command-4`

### Resume Execution

```
/execute-resume
```

Resume from last checkpoint if execution was interrupted.

### Show Status

```
/execute-status
```

Display current progress of active execution.

## Error Handling

1. **Task Failure**
   - Log error with task identifier
   - Attempt recovery if possible
   - Mark task for manual review if unrecoverable
   - Continue to next task if independent

2. **Phase Failure**
   - If critical task fails, halt phase
   - Log which tasks completed vs failed
   - Update plan status to reflect partial completion
   - Report specific failures to user

3. **File Access Errors**
   - Report missing files with FILE-\* identifier
   - Skip task if file truly doesn't exist
   - Document in execution log

4. **Feedback Conflicts**
   - If execution encounters feedback that conflicts with plan
   - Log the conflict for human review
   - Do not modify feedbacks.md
   - Report to user for resolution

## Validation Criteria

After execution completes, verify:

- All tasks marked with ✅ in plan.md file
- All completion dates populated
- Front matter status = "Completed"
- All modified files contain expected changes
- No placeholder text remains in plan
- findings.md has been updated with any new discoveries
- feedbacks.md has NOT been modified

## Output Requirements

Generate execution report containing:

1. Plan summary (goal, phases count, task count)
2. Phase-by-phase completion status
3. Total execution time
4. Any tasks that failed or were skipped
5. Final plan status

## Implementation Standards

- Use explicit, unambiguous language with zero interpretation required
- Structure all content as machine-parseable formats
- Include exact file paths, line numbers, and code references
- Use standardized identifiers (TASK-\_, GOAL-\_, PHASE-\*)
- Provide complete context within each task description
- Reference findings.md for development context

## Dependencies

- Requires `/plan/` directory exists
- Requires valid implementation plan directories with plan.md, findings.md, feedbacks.md
- Requires file system write access to modify plan.md and findings.md

## Assumptions

- Plan directories are well-formed with valid front matter in plan.md
- Task descriptions contain sufficient detail for execution
- No circular phase dependencies exist
- File paths in tasks are relative to workspace root
- feedbacks.md may contain customer feedback to review before execution
