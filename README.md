# Available Skills

Skills live under `.agents/skills/`, each in its own directory with a `SKILL.md` entry file.

| Skill | Path | Description |
| ----- | ---- | ----------- |
| create-implementation-plan | `.agents/skills/create-implementation-plan/SKILL.md` | Create a new implementation plan using directory structure for new features, refactoring existing code or upgrading packages, design, architecture or infrastructure. |
| karpathy-guidelines | `.agents/skills/karpathy-guidelines/SKILL.md` | Behavioral guidelines to reduce common LLM coding mistakes. Use when writing, reviewing, or refactoring code to avoid overcomplication, make surgical changes, surface assumptions, and define verifiable success criteria. |
| plan-create | `.agents/skills/plan-create/SKILL.md` | Create a new implementation plan using directory structure with edge case discovery and user clarification workflows for comprehensive requirements gathering. |
| plan-exec | `.agents/skills/plan-exec/SKILL.md` | Execute implementation plans by parsing plan directories and managing phased task execution with automatic progress tracking and todo list management. |

## Related

Machine-readable index: [`skills.json`](skills.json)

## Install skills

Install the `gm-skills` command:

```sh
curl -fsSL https://raw.githubusercontent.com/gabrielqmatos88/ai-skills/refs/heads/main/install.sh | sh
```

Then run it from the project directory where you want skills installed:

```sh
gm-skills
```

The command is installed in `~/.local/bin`. If that directory is not on your `PATH`, the install script prints the required `PATH` entry.

To run the installer directly from a local checkout instead, install dependencies and start it with:

```sh
npm install
npm run skills
```

Choose one or more skills and harnesses (`.claude`, `.codex`, `.gemini`, `.clinerules`, or `.agents`). Skills are installed under each selected harness's `skills/` directory. Existing skill folders are preserved and skipped.
