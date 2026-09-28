// scan.js - scans repository for secrets, respecting .gitignore
const fs = require('fs');
const path = require('path');
const ignore = require('ignore');
const chalk = require('chalk');

function loadGitignore() {
  const gitignorePath = path.resolve('.gitignore');
  if (!fs.existsSync(gitignorePath)) return ignore();
  const content = fs.readFileSync(gitignorePath, 'utf8');
  return ignore().add(content.split(/\r?\n/).filter(Boolean));
}

const secretPatterns = [
  /AKIA[0-9A-Z]{16}/i,
  /aws_secret_access_key[^\n]{0,40}/i,
  /AIza[0-9A-Za-z\-_]{35}/,
  /private\s+key[^\n]{0,200}/i,
  /ssh-rsa[^\n]{0,500}/,
  /(?:api|token)[\s=:]+[A-Za-z0-9\-_]{20,}/i,
];

function isBinary(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size > 1024 * 1024;
}

function scanFile(filePath, findings) {
  if (isBinary(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  secretPatterns.forEach((regex) => {
    const match = content.match(regex);
    if (match) findings.push({file: filePath, match: match[0]});
  });
}

function walk(dir, ig, findings) {
  const entries = fs.readdirSync(dir, {withFileTypes: true});
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const rel = path.relative(process.cwd(), fullPath);
    if (ig.ignores(rel)) continue;
    if (entry.isDirectory()) walk(fullPath, ig, findings);
    else if (entry.isFile()) scanFile(fullPath, findings);
  }
}

function main() {
  const ig = loadGitignore();
  const findings = [];
  walk(process.cwd(), ig, findings);
  if (findings.length === 0) {
    console.log(chalk.green('✅ No secrets found.'));
    process.exit(0);
  }
  console.log(chalk.red(`🚨 Detected ${findings.length} potential secret(s):`));
  findings.forEach(f => console.log(`${chalk.yellow(f.file)}: ${chalk.red(f.match)}`));
  process.exit(1);
}

if (require.main === module) main();
