const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const HOOK_START = "# vuln-scanner: start";
const HOOK_END = "# vuln-scanner: end";

function getGitRoot(cwd) {
  try {
    return execSync("git rev-parse --show-toplevel", {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    }).trim();
  } catch (error) {
    throw new Error("Not a git repository. Run this command from a git repository root.");
  }
}

function getHooksDirectory(repoRoot) {
  const gitPath = execSync("git rev-parse --git-path hooks", {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  }).trim();
  return path.isAbsolute(gitPath) ? gitPath : path.resolve(repoRoot, gitPath);
}

function scannerBlock(cliPath, command, action) {
  // Forward slashes keep the quoted path valid in Git's sh hooks on Windows too.
  const quotedCliPath = JSON.stringify(cliPath.replace(/\\/g, "/"));
  return `${HOOK_START}\ncd "$(git rev-parse --show-toplevel)" || exit 1\nnode ${quotedCliPath} ${command} || {\n  echo "${action} blocked: secrets detected by vuln-scanner."\n  exit 1\n}\n${HOOK_END}`;
}

function removePreviousScannerBlock(content) {
  const markedBlock = new RegExp(`${HOOK_START}[\\s\\S]*?${HOOK_END}\\s*`, "g");
  const legacyBlock = /\n?npx --no-install vuln-scanner scan-(?:staged|push) \|\| \{\s*echo "(?:Commit|Push) blocked: secrets detected by vuln-scanner\."\s*exit 1\s*\}\s*/g;
  return content.replace(markedBlock, "").replace(legacyBlock, "");
}

function ensureHook(hooksDirectory, hookName, block) {
  const hookPath = path.join(hooksDirectory, hookName);
  const existed = fs.existsSync(hookPath);
  let content = existed ? fs.readFileSync(hookPath, "utf8") : "#!/usr/bin/env sh\n";
  const cleaned = removePreviousScannerBlock(content).replace(/\s+$/, "");
  content = `${cleaned}\n\n${block}\n`;
  fs.writeFileSync(hookPath, content, { mode: 0o755 });
  return existed ? "updated" : "created";
}

function initHusky() {
  const repoRoot = getGitRoot(process.cwd());
  const hooksDirectory = getHooksDirectory(repoRoot);
  fs.mkdirSync(hooksDirectory, { recursive: true });

  // `require.main.filename` resolves the real package entry point even when the
  // executable was launched through npm's global symlink.
  const cliPath = path.resolve(require.main.filename);
  const hookStatuses = {
    "pre-commit": ensureHook(hooksDirectory, "pre-commit", scannerBlock(cliPath, "scan-commit", "Commit")),
    "pre-push": ensureHook(hooksDirectory, "pre-push", scannerBlock(cliPath, "scan-push", "Push")),
  };

  return {
    wasAlreadyInstalled: true,
    hookStatuses,
  };
}

module.exports = { initHusky };
