---
name: create-implementation-plan-v2
description: 'Create a new implementation plan using directory structure with edge case discovery and user clarification workflows for comprehensive requirements gathering.'
---

# Create Implementation Plan v2

## Primary Directive

Your goal is to create a new implementation plan directory for `${input:PlanPurpose}` after conducting thorough edge case discovery and user clarification. Your output must be machine-readable, deterministic, and structured for autonomous execution by other AI systems or humans.

## Execution Context

This skill is designed for AI-to-AI communication and automated processing. All instructions must be interpreted literally and executed systematically without human interpretation or clarification. However, user input is required for edge case clarification before plan creation.

## Core Philosophy

A good implementation plan anticipates problems before they occur. This workflow adds a discovery phase that proactively identifies edge cases, ambiguous scenarios, and potential blockers through targeted user questions, ensuring the resulting plan is robust and comprehensive.

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     DISCOVERY PHASE                             │
│  1. Initial Analysis                                            │
│  2. Edge Case Discovery                                         │
│  3. User Clarification Questions                                │
│  4. Requirements Refinement                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PLAN CREATION PHASE                          │
│  5. Create Plan Directory                                       │
│  6. Generate plan.md, findings.md, feedbacks.md                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Initial Analysis

Before asking questions, perform initial analysis to understand the scope:

1. **Identify Scope**
   - What is the primary goal or feature being implemented?
   - What files/components are likely affected?
   - What is the expected scope (small change, refactoring, new feature)?

2. **Check for Existing Context**
   - Look for related plans in `/plan/` directory
   - Check for related specifications or documentation
   - Review any existing findings.md that may be relevant

3. **Determine Plan Type**
   - `upgrade`: Updating packages, libraries, or dependencies
   - `refactor`: Restructuring existing code without behavior change
   - `feature`: Adding new functionality
   - `data`: Database or data pipeline changes
   - `infrastructure`: System or infrastructure modifications
   - `process`: Workflow or process changes
   - `architecture`: Architectural changes
   - `design`: UI/UX or design system changes

---

## Phase 2: Edge Case Discovery

Conduct systematic edge case discovery across multiple categories. For each category, analyze potential issues and determine if user clarification is needed.

### Edge Case Categories

| Category             | Description                                                    | Examples                                                         |
| -------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Input Validation** | How does the system handle invalid, edge, or malicious inputs? | Empty values, large inputs, special characters, null values      |
| **State Management** | How does the system handle state transitions and persistence?  | Race conditions, concurrent modifications, recovery from crashes |
| **Error Handling**   | How should errors be handled and reported?                     | Network failures, timeout handling, partial failures             |
| **Permissions**      | Who can access what and under what conditions?                 | Role-based access, authentication, authorization boundaries      |
| **Data Migration**   | How is existing data affected by changes?                      | Schema changes, data transformation, rollback scenarios          |
| **Compatibility**    | What systems or versions must remain compatible?               | API versions, browser support, backward compatibility            |
| **Performance**      | Are there performance requirements or constraints?             | Response time, memory usage, throughput limits                   |
| **Rollback**         | How can changes be safely reverted?                            | Backup strategies, migration reversibility, state recovery       |
| **Testing**          | What testing requirements exist?                               | Unit tests, integration tests, manual verification               |
| **Deployment**       | What deployment considerations exist?                          | Zero-downtime, canary releases, rollback procedures              |

### Edge Case Analysis Questions

For each category, consider these questions:

#### Input Validation

- What happens with empty/null inputs?
- What are the size limits for inputs?
- How are special characters or encoding handled?
- What happens with duplicate inputs?
- Are there format requirements (regex, specific patterns)?

#### State Management

- Can the operation be retried safely?
- What happens if the process is interrupted mid-way?
- Are there any race conditions to consider?
- How is state persisted and recovered?

#### Error Handling

- What are the failure modes?
- How should errors be logged and reported?
- Is partial success acceptable?
- What happens to already-completed steps on failure?

#### Permissions & Access

- Are there specific users or roles affected?
- Do new permissions need to be created?
- Are there external dependencies on current permissions?
- How does this interact with existing access control?

#### Data Migration

- Is existing data affected?
- What transformation is needed?
- Can we roll back data changes?
- Are there migration scripts required?

#### Compatibility

- Does this work with existing API contracts?
- Are there version dependencies?
- Is backward compatibility required?
- What about API versioning?

#### Performance

- Are there SLAs or performance targets?
- What are the expected load patterns?
- Are there memory or storage constraints?
- Should we implement caching or optimization?

#### Rollback Strategy

- Can we safely revert all changes?
- What is the rollback order?
- Are there backup requirements?
- How do we verify rollback success?

#### Testing Requirements

- What test coverage is expected?
- Are there specific test scenarios?
- Do we need integration tests?
- Is manual testing required?

#### Deployment Considerations

- Is there a deployment window?
- Are there feature flags or gradual rollouts?
- Do we need to coordinate with other systems?
- Are there environment-specific configurations?

---

## Phase 3: User Clarification Questions

Based on edge case discovery, ask the user targeted questions to clarify requirements. Use the `ask_followup_question` tool to gather necessary information.

### Question Guidelines

1. **Group Related Questions**
   - Ask about one topic at a time
   - Group similar edge cases together
   - Prioritize critical path questions first

2. **Be Specific and Actionable**
   - Ask concrete questions, not open-ended ones
   - Provide options when appropriate
   - Include examples to illustrate the question

3. **Explain Why**
   - Briefly explain why the question matters
   - Help users understand the impact of their choices
   - Reference the specific edge case being addressed

4. **Limit Question Volume**
   - Ask no more than 5-7 questions per session
   - Focus on critical decisions first
   - Save low-priority questions for later

### Recommended Question Templates

#### For Input Validation

```
What should happen when [specific input scenario] occurs?
Options:
- [Option 1 with description]
- [Option 2 with description]
- [Option 3 with description]
```

#### For Error Handling

```
If [specific error scenario] happens during implementation, should we:
- [Option 1]
- [Option 2]
- [Option 3]
```

#### For Data/State Changes

```
For the data migration/change scenario, what approach should we take?
- [Option 1: safer but slower]
- [Option 2: faster but requires manual rollback]
- [Option 3: requires coordination with team]
```

#### For Compatibility

```
Should we maintain backward compatibility for [specific component]?
- Yes, maintain full backward compatibility
- Yes, but deprecate old approach with warning
- No, breaking change is acceptable
```

#### For Performance

```
Are there specific performance requirements for this change?
- No specific requirements
- Yes: [specific targets]
- Unknown, but we should add monitoring
```

#### For Rollback

```
What is the rollback strategy for this change?
- Full rollback capability required
- Manual rollback is acceptable
- Changes are not rollbackable
- Rollback involves team coordination
```

### Example Question Sets

#### For Feature Implementation

```markdown
Before creating the implementation plan, I need to clarify some requirements:

**Q1: Input Validation**
What should happen if users submit empty or malformed data?

- Reject with clear error message
- Accept and use default values
- Accept but log warning

**Q2: Error Handling**
If the new feature partially fails, should we:

- Roll back the entire operation
- Keep successful parts and report partial failure
- Retry failed parts automatically

**Q3: Testing**
What level of testing is required?

- Unit tests only
- Unit tests + integration tests
- Full test suite including manual testing
```

#### For Refactoring

```markdown
Before creating the implementation plan for this refactoring:

**Q1: Backward Compatibility**
Should the refactored code maintain API compatibility?

- Full backward compatibility required
- Breaking changes acceptable with deprecation period
- Breaking changes acceptable immediately

**Q2: Migration**
Are there data or configuration migrations needed?

- No migration required
- Simple migration that can be automated
- Complex migration requiring careful planning

**Q3: Testing**
What test coverage is required to validate the refactoring?

- Existing tests should pass (no new tests)
- Add tests for new structure
- Complete test coverage required
```

---

## Phase 4: Requirements Refinement

After receiving user answers:

1. **Document Answers**
   - Record each answer in findings.md under "User Requirements"
   - Note the date and context for each decision

2. **Update Edge Case Status**
   - Mark addressed edge cases as "Resolved"
   - Note the chosen approach for each

3. **Identify New Edge Cases**
   - Some answers may reveal additional edge cases
   - Address these before proceeding

4. **Verify Understanding**
   - Briefly summarize key decisions
   - Confirm user agreement on critical paths

---

## Phase 5: Create Plan Directory

Follow the directory structure requirements:

```
plan-name-example/
├── plan.md        # Main implementation plan with all structured content
├── findings.md    # Relevant findings, development strategies, file paths, and analysis
└── feedbacks.md   # Empty file for customer feedback (AI must NOT modify this file)
```

### Directory Creation Instructions

1. Create the plan directory with naming convention: `[purpose]-[component]-[version]`
2. Create `plan.md` with the mandatory template structure
3. Create `findings.md` with discovery findings and user answers
4. Create `feedbacks.md` as an empty markdown file

---

## Phase 6: Generate Plan Files

### plan.md Requirements

Include all user clarifications in the plan:

1. **Front Matter**
   - Standard fields with status "Planned"

2. **Introduction**
   - Brief summary of the goal
   - Reference to user clarifications that shaped the plan

3. **Requirements & Constraints**
   - Include all user-specified requirements from Phase 3
   - Note any constraints arising from edge case decisions

4. **Implementation Steps**
   - Include tasks addressing identified edge cases
   - Reference user decisions for each edge case scenario

5. **Edge Case Handling**
   - Document how each edge case will be handled
   - Reference user decisions as acceptance criteria

6. **Risks & Assumptions**
   - Include any remaining risks or unresolved edge cases
   - Document assumptions that were made

### findings.md Requirements

Document the discovery process:

1. **Discovery Date**: When the discovery was conducted
2. **Initial Analysis**: Scope and plan type determination
3. **Edge Case Categories Examined**: List of categories analyzed
4. **User Questions Asked**: All questions from Phase 3
5. **User Answers**: Documented answers to each question
6. **File Analysis**: Analysis of relevant files
7. **Development Strategies**: Strategies based on discovery

### feedbacks.md

Create as empty file - AI must NOT modify this file.

---

## File Responsibilities

| File           | Purpose                                                                           | AI Can Modify |
| -------------- | --------------------------------------------------------------------------------- | ------------- |
| `plan.md`      | Main implementation plan with structured phases, tasks, requirements, risks       | ✅ Yes        |
| `findings.md`  | Development strategies, file paths, analysis, discovery process, and user answers | ✅ Yes        |
| `feedbacks.md` | Customer feedback collection - user-reported issues and requirements              | ❌ NO         |

---

## AI-Optimized Implementation Standards

- Use explicit, unambiguous language with zero interpretation required
- Structure all content as machine-parseable formats (tables, lists, structured data)
- Include specific file paths, line numbers, and exact code references where applicable
- Define all variables, constants, and configuration values explicitly
- Provide complete context within each task description
- Use standardized prefixes for all identifiers (REQ-, TASK-, EDGE-\_, etc.)
- Include validation criteria that can be automatically verified

---

## Output Directory Specifications

- Save implementation plan directories in `/plan/` directory
- Use naming convention: `[purpose]-[component]-[version]`
- Purpose prefixes: `upgrade|refactor|feature|data|infrastructure|process|architecture|design`
- Example: `feature-auth-module-1`, `upgrade-system-command-4`
- Each directory must contain exactly three files: `plan.md`, `findings.md`, and `feedbacks.md`

---

## Edge Case Identifier Format

Use the following identifier format for edge cases:

| Prefix           | Category                     |
| ---------------- | ---------------------------- |
| EDGE-INPUT-\*    | Input validation edge cases  |
| EDGE-STATE-\*    | State management edge cases  |
| EDGE-ERROR-\*    | Error handling edge cases    |
| EDGE-PERM-\*     | Permissions edge cases       |
| EDGE-DATA-\*     | Data migration edge cases    |
| EDGE-COMPAT-\*   | Compatibility edge cases     |
| EDGE-PERF-\*     | Performance edge cases       |
| EDGE-ROLLBACK-\* | Rollback strategy edge cases |
| EDGE-TEST-\*     | Testing edge cases           |
| EDGE-DEPLOY-\*   | Deployment edge cases        |

---

## Template Validation Rules

- All front matter fields must be present and properly formatted
- All section headers must match exactly (case-sensitive)
- All identifier prefixes must follow the specified format
- Tables must include all required columns
- No placeholder text may remain in the final output
- All user clarifications must be documented
- All identified edge cases must have resolution status

---

## Status

The status of the implementation plan must be clearly defined in the front matter and must reflect the current state of the plan. The status can be one of the following (status_color in brackets): `Completed` (bright green badge), `In progress` (yellow badge), `Planned` (blue badge), `Deprecated` (red badge), or `On Hold` (orange badge). It should also be displayed as a badge in the introduction section.

---

# plan.md Template

```md
---
goal: [Concise Title Describing the Package Implementation Plan's Goal]
version: [Optional: e.g., 1.0, Date]
date_created: [YYYY-MM-DD]
last_updated: [Optional: YYYY-MM-DD]
owner: [Optional: Team/Individual responsible for this spec]
status: 'Completed'|'In progress'|'Planned'|'Deprecated'|'On Hold'
tags: [Optional: List of relevant tags or categories, e.g., `feature`, `upgrade`, `chore`, `architecture`, `migration`, `bug` etc]
---

# Introduction

![Status: <status>](https://img.shields.io/badge/status-<status>-<status_color>)

[A short concise introduction to the plan and the goal it is intended to achieve.]

This plan was created after user clarification on [X] edge cases. Key decisions documented in findings.md.

## 1. Requirements & Constraints

[Explicitly list all requirements & constraints that affect the plan and constrain how it is implemented. Use bullet points or tables for clarity.]

- **REQ-001**: Requirement 1
- **SEC-001**: Security Requirement 1
- **[3 LETTERS]-001**: Other Requirement 1
- **CON-001**: Constraint 1
- **GUD-001**: Guideline 1
- **PAT-001**: Pattern to follow 1

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: [Describe the goal of this phase, e.g., "Implement feature X", "Refactor module Y", etc.]

| Task     | Description           | Completed | Date       |
| -------- | --------------------- | --------- | ---------- |
| TASK-001 | Description of task 1 | ✅        | 2025-04-25 |
| TASK-002 | Description of task 2 |           |            |
| TASK-003 | Description of task 3 |           |            |

### Implementation Phase 2

- GOAL-002: [Describe the goal of this phase, e.g., "Implement feature X", "Refactor module Y", etc.]

| Task     | Description           | Completed | Date |
| -------- | --------------------- | --------- | ---- |
| TASK-004 | Description of task 4 |           |      |
| TASK-005 | Description of task 5 |           |      |
| TASK-006 | Description of task 6 |           |      |

## 3. Edge Case Handling

[Document how each identified edge case will be handled based on user clarification.]

- **EDGE-INPUT-001**: [Edge case] → Resolution: [User decision]
- **EDGE-ERROR-001**: [Edge case] → Resolution: [User decision]
- **EDGE-ROLLBACK-001**: [Edge case] → Resolution: [User decision]

## 4. Alternatives

[A bullet point list of any alternative approaches that were considered and why they were not chosen. This helps to provide context and rationale for the chosen approach.]

- **ALT-001**: Alternative approach 1
- **ALT-002**: Alternative approach 2

## 5. Dependencies

[List any dependencies that need to be addressed, such as libraries, frameworks, or other components that the plan relies on.]

- **DEP-001**: Dependency 1
- **DEP-002**: Dependency 2

## 6. Files

[List the files that will be affected by the feature or refactoring task.]

- **FILE-001**: Description of file 1
- **FILE-002**: Description of file 2

## 7. Testing

[List the tests that need to be implemented to verify the feature or refactoring task.]

- **TEST-001**: Description of test 1
- **TEST-002**: Description of test 2

## 8. Risks & Assumptions

[List any risks or assumptions related to the implementation of the plan.]

- **RISK-001**: Risk 1
- **ASSUMPTION-001**: Assumption 1

## 9. Related Specifications / Further Reading

[Link to related spec 1]
[Link to relevant external documentation]
```

---

# findings.md Template

```md
# Findings

[Document relevant findings discovered during analysis that will aid development execution. This file reduces redundant data searching by consolidating key information.]

## Discovery Metadata

- **Discovery Date**: [YYYY-MM-DD]
- **Plan Purpose**: [Short description]
- **Plan Type**: [upgrade|refactor|feature|data|infrastructure|process|architecture|design]

## User Clarifications

[Document all user answers to edge case questions]

### Q1: [Question Topic]

- **Question**: [Full question text]
- **Answer**: [User's answer]
- **Date**: [YYYY-MM-DD]

### Q2: [Question Topic]

- **Question**: [Full question text]
- **Answer**: [User's answer]
- **Date**: [YYYY-MM-DD]

## Edge Case Analysis

| Edge Case ID   | Category         | Description   | Resolution      | Status   |
| -------------- | ---------------- | ------------- | --------------- | -------- |
| EDGE-INPUT-001 | Input Validation | [Description] | [User decision] | Resolved |
| EDGE-ERROR-001 | Error Handling   | [Description] | [User decision] | Resolved |

## Development Strategies

[Approaches, patterns, and strategies to follow during implementation based on user decisions]

## File Analysis

[Analysis of files involved in the implementation]

### FILE-001

- **Path**: [file path]
- **Purpose**: [what this file does]
- **Limitations**: [what this file doesn't do]
- **Key Functions/Classes**: [list of key elements]
- **Relevant Patterns**: [patterns used in this file]

## Technical Discoveries

[Any technical insights, constraints, or opportunities discovered during analysis]

## Architecture Decisions

[Decisions made regarding architecture and rationale]
```

---

# feedbacks.md Template

```md
# Feedbacks

<!-- AI MUST NOT MODIFY THIS FILE -->
<!-- This file is exclusively for customer/user feedback and must remain as reported -->

[Customer feedback will be added here - AI should not modify this content]
```
