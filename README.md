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

Save a default skill selection with:

```sh
gm-skills --config
```

The preset is stored in `~/.local/share/gm-skills/config.json`. On later runs, preset skills and harnesses are preselected and listed first.

Update catalog skills already installed in the current project:

```sh
gm-skills --update
```

The command lists matching skills found under supported harness directories in the current project. Select the installations to update; each replacement requires confirmation and replaces the skill folder with the repository version.

Upgrade the `gm-skills` utility itself:

```sh
gm-skills --upgrade
```

The upgrade fetches the latest utility files from the repository and refreshes its dependencies. It preserves the saved preset, launcher, and bundled Node.js runtime.

The command is installed in `~/.local/bin`. If that directory is not on your `PATH`, the install script prints the required `PATH` entry.

To install the current checkout as `gm-skills`—including uncommitted changes—run this from the repository root:

```sh
./local_install.sh
```

This uses the local `skills.js` and `package.json` while keeping the standard installer’s launcher and runtime setup. `npm install` may fetch dependencies from the npm registry; if Node.js and npm are unavailable, it may also download the bundled Node.js runtime from nodejs.org.

To run the installer directly from a local checkout instead, install dependencies and start it with:

```sh
npm install
npm run skills
```

Choose one or more skills and harnesses (`.claude`, `.codex`, `.gemini`, `.clinerules`, or `.agents`). Skills are installed under each selected harness's `skills/` directory. If a skill folder already exists, the installer asks before replacing it with the repository version; declining preserves the existing folder.
