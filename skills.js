#!/usr/bin/env node

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const INDEX_URL =
  'https://raw.githubusercontent.com/gabrielqmatos88/ai-skills/refs/heads/main/skills.json';
const RAW_BASE_URL =
  'https://raw.githubusercontent.com/gabrielqmatos88/ai-skills/refs/heads/main/';
const TREE_URL =
  'https://api.github.com/repos/gabrielqmatos88/ai-skills/git/trees/main?recursive=1';
const APP_DIR = path.join(os.homedir(), '.local', 'share', 'gm-skills');
const CONFIG_PATH = path.join(APP_DIR, 'config.json');
const HARNESS_OPTIONS = [
  { value: '.claude', label: 'Claude (.claude)' },
  { value: '.codex', label: 'Codex (.codex)' },
  { value: '.gemini', label: 'Gemini (.gemini)' },
  { value: '.clinerules', label: 'Cline (.clinerules)' },
  { value: '.agents', label: '.agents' },
];

const rawUrlFor = (repoPath) =>
  RAW_BASE_URL + repoPath.split('/').map(encodeURIComponent).join('/');

function isSafeRepoPath(repoPath) {
  return (
    typeof repoPath === 'string' &&
    !repoPath.startsWith('/') &&
    !repoPath.includes('\\') &&
    repoPath.split('/').every((part) => part && part !== '.' && part !== '..')
  );
}

function isValidSkill(skill) {
  if (!skill || typeof skill !== 'object') return false;
  if (typeof skill.name !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(skill.name)) {
    return false;
  }
  return (
    isSafeRepoPath(skill.path) &&
    skill.path === `.agents/skills/${skill.name}/SKILL.md`
  );
}

async function fetchResponse(url) {
  return fetch(url, {
    headers: {
      'User-Agent': 'ai-skills-installer',
      Accept: 'application/vnd.github+json',
    },
    signal: AbortSignal.timeout(20_000),
  });
}

async function fetchSkillsIndex() {
  const response = await fetchResponse(INDEX_URL);
  if (!response.ok) {
    throw new Error(`Could not fetch skills.json (HTTP ${response.status}).`);
  }

  const index = await response.json();
  if (!index || !Array.isArray(index.skills)) {
    throw new Error('skills.json must contain a skills array.');
  }

  const validSkills = index.skills.filter(isValidSkill);
  if (validSkills.length !== index.skills.length) {
    console.error('Some entries in skills.json are invalid and will be ignored.');
  }
  if (validSkills.length === 0) {
    throw new Error('skills.json contains no valid skills.');
  }
  return validSkills;
}

async function fetchRepositoryTree() {
  const response = await fetchResponse(TREE_URL);
  if (!response.ok) {
    throw new Error(`Could not list repository files (HTTP ${response.status}).`);
  }
  const tree = await response.json();
  if (!Array.isArray(tree.tree)) {
    throw new Error('GitHub returned an invalid repository file listing.');
  }
  if (tree.truncated) {
    throw new Error('GitHub returned a truncated repository file listing.');
  }
  return tree.tree;
}

async function readPreset(log) {
  try {
    const config = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf8'));
    if (!config || !Array.isArray(config.skills)) {
      log.warn(`Ignoring invalid preset at ${CONFIG_PATH}.`);
      return { skills: [], harnesses: [] };
    }
    const harnesses = Array.isArray(config.harnesses) ? config.harnesses : [];
    return {
      skills: [...new Set(config.skills.filter((name) => typeof name === 'string'))],
      harnesses: [...new Set(
        harnesses.filter((name) => HARNESS_OPTIONS.some((option) => option.value === name)),
      )],
    };
  } catch (error) {
    if (error.code !== 'ENOENT') {
      log.warn(`Could not read preset at ${CONFIG_PATH}: ${error.message}`);
    }
    return { skills: [], harnesses: [] };
  }
}

async function savePreset(skillNames, harnessNames) {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  const temporaryConfigPath = `${CONFIG_PATH}.${process.pid}.tmp`;
  try {
    await fs.writeFile(
      temporaryConfigPath,
      `${JSON.stringify({ skills: skillNames, harnesses: harnessNames }, null, 2)}\n`,
      { encoding: 'utf8', mode: 0o600, flag: 'wx' },
    );
    await fs.rename(temporaryConfigPath, CONFIG_PATH);
  } finally {
    await fs.rm(temporaryConfigPath, { force: true });
  }
}

async function downloadSkill(skill, repositoryTree, tempRoot, log) {
  const skillRoot = path.posix.dirname(skill.path);
  const files = repositoryTree.filter(
    (entry) =>
      entry.type === 'blob' &&
      entry.mode !== '120000' &&
      entry.path.startsWith(`${skillRoot}/`),
  );
  const skillMd = files.find((entry) => entry.path === skill.path);

  // Fetch the indexed entry directly so stale index paths are reported clearly.
  const entryResponse = await fetchResponse(rawUrlFor(skill.path));
  if (!entryResponse.ok) {
    log.error(
      `Skill "${skill.name}" is unavailable at ${skill.path} (HTTP ${entryResponse.status}); skipping it.`,
    );
    return null;
  }

  const selectedFiles = skillMd
    ? files
    : [{ path: skill.path, type: 'blob', mode: '100644' }];
  const destinationRoot = path.join(tempRoot, skill.name);
  let entrySaved = false;

  for (const file of selectedFiles) {
    const relativePath = path.posix.relative(skillRoot, file.path);
    if (!isSafeRepoPath(relativePath)) {
      log.error(`Unsafe repository file path was skipped: ${file.path}`);
      continue;
    }

    const destination = path.resolve(destinationRoot, ...relativePath.split('/'));
    if (!destination.startsWith(`${path.resolve(destinationRoot)}${path.sep}`)) {
      log.error(`Unsafe download destination was skipped: ${file.path}`);
      continue;
    }

    let content;
    if (file.path === skill.path) {
      content = await entryResponse.text();
      entrySaved = true;
    } else {
      const response = await fetchResponse(rawUrlFor(file.path));
      if (!response.ok) {
        log.error(
          `Could not download ${file.path} (HTTP ${response.status}); continuing with remaining files.`,
        );
        continue;
      }
      content = Buffer.from(await response.arrayBuffer());
    }

    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, content, { flag: 'wx' });
  }

  if (!entrySaved) {
    log.error(`Required skill file ${skill.path} could not be saved; skipping this skill.`);
    await fs.rm(destinationRoot, { recursive: true, force: true });
    return null;
  }
  return destinationRoot;
}

async function installSkill(
  skill,
  downloadedPath,
  harness,
  cwd,
  log,
  confirm,
  isCancel,
) {
  const realCwd = await fs.realpath(cwd);
  const harnessRoot = path.join(cwd, harness);
  try {
    await fs.lstat(harnessRoot);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await fs.mkdir(harnessRoot);
  }
  const realHarnessRoot = await fs.realpath(harnessRoot);
  if (
    realHarnessRoot !== realCwd &&
    !realHarnessRoot.startsWith(`${realCwd}${path.sep}`)
  ) {
    throw new Error(`Harness directory resolves outside the project: ${harnessRoot}`);
  }

  const skillsRoot = path.join(harnessRoot, 'skills');
  try {
    await fs.lstat(skillsRoot);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await fs.mkdir(skillsRoot);
  }
  const realSkillsRoot = await fs.realpath(skillsRoot);
  if (
    realSkillsRoot !== realHarnessRoot &&
    !realSkillsRoot.startsWith(`${realHarnessRoot}${path.sep}`)
  ) {
    throw new Error(`Skills directory resolves outside its harness: ${skillsRoot}`);
  }

  const destination = path.join(cwd, harness, 'skills', skill.name);
  let destinationExists = false;
  try {
    await fs.lstat(destination);
    destinationExists = true;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  if (destinationExists) {
    const shouldOverwrite = await confirm({
      message: `Overwrite existing ${destination} with the repository version?`,
      initialValue: false,
    });
    if (isCancel(shouldOverwrite) || !shouldOverwrite) {
      log.warn(`Preserved existing ${destination}; not overwriting it.`);
      return false;
    }
    await fs.rm(destination, { recursive: true, force: true });
  }

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.cp(downloadedPath, destination, { recursive: true, errorOnExist: true, force: false });
  return true;
}

async function findInstalledSkills(skills, cwd) {
  const installed = [];
  for (const harness of HARNESS_OPTIONS) {
    for (const skill of skills) {
      const destination = path.join(cwd, harness.value, 'skills', skill.name);
      try {
        const skillStat = await fs.lstat(destination);
        if (!skillStat.isDirectory()) continue;
        const entryStat = await fs.lstat(path.join(destination, 'SKILL.md'));
        if (entryStat.isFile()) installed.push({ skill, harness: harness.value, harnessLabel: harness.label });
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  }
  return installed;
}

function installDependencies(prefix) {
  return new Promise((resolve, reject) => {
    const npm = spawn(
      'npm',
      ['install', '--prefix', prefix, '--omit=dev', '--no-audit', '--no-fund'],
      { stdio: 'inherit' },
    );
    npm.once('error', reject);
    npm.once('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm install failed with exit code ${code}.`));
    });
  });
}

async function upgradeUtility(log) {
  const appStat = await fs.lstat(APP_DIR).catch((error) => {
    if (error.code === 'ENOENT') {
      throw new Error(`No installed gm-skills utility found at ${APP_DIR}.`);
    }
    throw error;
  });
  if (!appStat.isDirectory()) throw new Error(`Utility path is not a directory: ${APP_DIR}`);
  for (const filename of ['skills.js', 'package.json']) {
    const fileStat = await fs.lstat(path.join(APP_DIR, filename)).catch((error) => {
      if (error.code === 'ENOENT') throw new Error(`Installed utility is missing ${filename}.`);
      throw error;
    });
    if (!fileStat.isFile()) throw new Error(`Installed utility file is not regular: ${filename}`);
  }

  const stagingDirectory = await fs.mkdtemp(path.join(APP_DIR, '.gm-skills-upgrade-'));
  const backupDirectory = path.join(stagingDirectory, 'previous');
  const filenames = ['skills.js', 'package.json', 'package-lock.json', 'node_modules'];
  const backedUp = [];
  const installed = [];

  try {
    const [scriptResponse, packageResponse] = await Promise.all([
      fetchResponse(rawUrlFor('skills.js')),
      fetchResponse(rawUrlFor('package.json')),
    ]);
    if (!scriptResponse.ok) {
      throw new Error(`Could not fetch updated skills.js (HTTP ${scriptResponse.status}).`);
    }
    if (!packageResponse.ok) {
      throw new Error(`Could not fetch updated package.json (HTTP ${packageResponse.status}).`);
    }

    const script = await scriptResponse.text();
    const packageJson = await packageResponse.text();
    JSON.parse(packageJson);
    await fs.writeFile(path.join(stagingDirectory, 'skills.js'), script, 'utf8');
    await fs.writeFile(path.join(stagingDirectory, 'package.json'), packageJson, 'utf8');
    await installDependencies(stagingDirectory);

    await fs.mkdir(backupDirectory);
    for (const filename of filenames) {
      try {
        await fs.rename(path.join(APP_DIR, filename), path.join(backupDirectory, filename));
        backedUp.push(filename);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    for (const filename of filenames) {
      await fs.rename(path.join(stagingDirectory, filename), path.join(APP_DIR, filename));
      installed.push(filename);
    }
  } catch (error) {
    for (const filename of installed.reverse()) {
      await fs.rm(path.join(APP_DIR, filename), { recursive: true, force: true });
    }
    for (const filename of backedUp.reverse()) {
      await fs.rename(path.join(backupDirectory, filename), path.join(APP_DIR, filename));
    }
    throw error;
  } finally {
    await fs.rm(stagingDirectory, { recursive: true, force: true });
  }

  log.success('gm-skills was upgraded successfully.');
}

async function main() {
  const prompts = await import('@clack/prompts');
  const { cancel, confirm, intro, isCancel, log, multiselect, outro, spinner } = prompts;
  const args = process.argv.slice(2);
  const modes = ['--config', '--update', '--upgrade'];
  const unknownArg = args.find((arg) => !modes.includes(arg));
  const repeatedArg = args.find((arg, index) => args.indexOf(arg) !== index);
  const selectedModes = args.filter((arg) => modes.includes(arg));
  if (unknownArg || repeatedArg || selectedModes.length > 1) {
    throw new Error(`Unknown, repeated, or conflicting argument: ${unknownArg || repeatedArg || selectedModes[1]}`);
  }

  const configMode = selectedModes.includes('--config');
  const updateMode = selectedModes.includes('--update');
  const upgradeMode = selectedModes.includes('--upgrade');
  intro(
    upgradeMode
      ? 'Upgrade gm-skills'
      : updateMode
        ? 'Update Installed Skills'
        : configMode
          ? 'Configure AI Skills Preset'
          : 'AI Skills Installer',
  );

  if (upgradeMode) {
    await upgradeUtility(log);
    outro('Upgrade complete.');
    return;
  }

  const skills = await fetchSkillsIndex();
  let chosenSkills;
  let deployments;

  if (updateMode) {
    const installedSkills = await findInstalledSkills(skills, process.cwd());
    if (installedSkills.length === 0) {
      log.warn('No catalog skills are installed in this project.');
      outro('Nothing to update.');
      return;
    }

    const selectedInstallations = await multiselect({
      message: 'Select installed skills to update:',
      options: installedSkills.map((item, index) => ({
        value: String(index),
        label: `${item.skill.name} (${item.harnessLabel}/skills)`,
        hint: item.skill.description,
      })),
      required: false,
    });
    if (isCancel(selectedInstallations)) {
      cancel('Update cancelled.');
      return;
    }
    deployments = selectedInstallations.map((index) => installedSkills[Number(index)]);
    if (deployments.length === 0) {
      log.warn('No skills selected for update.');
      outro('Nothing to update.');
      return;
    }
    chosenSkills = [...new Map(deployments.map(({ skill }) => [skill.name, skill])).values()];
  } else {
    const preset = await readPreset(log);
    const skillNames = new Set(skills.map((skill) => skill.name));
    const presetSkillNames = preset.skills.filter((name) => skillNames.has(name));
    const presetSkillSet = new Set(presetSkillNames);
    const orderedSkills = [
      ...skills.filter((skill) => presetSkillSet.has(skill.name)),
      ...skills.filter((skill) => !presetSkillSet.has(skill.name)),
    ];

    const selectedSkills = await multiselect({
      message: configMode ? 'Select skills for your saved preset:' : 'Select skills to download:',
      options: orderedSkills.map((skill) => ({
        value: skill.name,
        label: skill.name,
        hint: skill.description,
      })),
      initialValues: presetSkillNames,
      required: !configMode,
    });
    if (isCancel(selectedSkills)) {
      cancel('Installation cancelled.');
      return;
    }

    const presetHarnessSet = new Set(preset.harnesses);
    const orderedHarnessOptions = [
      ...HARNESS_OPTIONS.filter((option) => presetHarnessSet.has(option.value)),
      ...HARNESS_OPTIONS.filter((option) => !presetHarnessSet.has(option.value)),
    ];
    const selectedHarnesses = await multiselect({
      message: configMode ? 'Select harnesses for your saved preset:' : 'Select harnesses to install into:',
      options: orderedHarnessOptions,
      initialValues: preset.harnesses,
      required: !configMode,
    });
    if (isCancel(selectedHarnesses)) {
      cancel('Installation cancelled.');
      return;
    }

    if (configMode) {
      const selectedSkillNames = orderedSkills
        .map((skill) => skill.name)
        .filter((name) => selectedSkills.includes(name));
      const selectedHarnessNames = orderedHarnessOptions
        .map((option) => option.value)
        .filter((name) => selectedHarnesses.includes(name));
      await savePreset(selectedSkillNames, selectedHarnessNames);
      log.success(
        `Saved ${selectedSkillNames.length} skill(s) and ${selectedHarnessNames.length} harness(es) to ${CONFIG_PATH}.`,
      );
      outro('Preset saved.');
      return;
    }

    chosenSkills = skills.filter((skill) => selectedSkills.includes(skill.name));
    deployments = selectedHarnesses.flatMap((harness) =>
      chosenSkills.map((skill) => ({ skill, harness })),
    );
  }

  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-skills-'));
  const installed = [];

  try {
    let repositoryTree = [];
    try {
      repositoryTree = await fetchRepositoryTree();
    } catch (error) {
      log.error(`${error.message} Will still try each selected SKILL.md directly.`);
    }
    const downloadedSkills = new Map();
    const downloadSpinner = spinner();
    downloadSpinner.start('Downloading selected skills to a temporary directory');

    for (const skill of chosenSkills) {
      try {
        const downloadedPath = await downloadSkill(skill, repositoryTree, temporaryDirectory, log);
        if (downloadedPath) downloadedSkills.set(skill.name, downloadedPath);
      } catch (error) {
        log.error(`Failed to download ${skill.name}: ${error.message}`);
      }
    }
    downloadSpinner.stop('Download step finished');

    for (const { skill, harness } of deployments) {
      const downloadedPath = downloadedSkills.get(skill.name);
      if (!downloadedPath) continue;
      try {
        if (
          await installSkill(
            skill,
            downloadedPath,
            harness,
            process.cwd(),
            log,
            confirm,
            isCancel,
          )
        ) {
          installed.push({ skill: skill.name, harness });
        }
      } catch (error) {
        log.error(`Failed to ${updateMode ? 'update' : 'install'} ${skill.name} in ${harness}: ${error.message}`);
      }
    }
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }

  if (installed.length === 0) {
    log.warn(updateMode ? 'No skills were updated.' : 'No skills were installed.');
  } else {
    log.success(updateMode ? 'Updated skills:' : 'Installed skills:');
    for (const item of installed) {
      log.message(`  ${item.skill} → ${item.harness}/skills/${item.skill}`);
    }
  }
  outro(updateMode ? 'Update complete.' : 'Installation complete.');
}

main().catch(async (error) => {
  const { log } = await import('@clack/prompts');
  log.error(error.message);
  process.exitCode = 1;
});
