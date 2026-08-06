// scanner.js
// Job of this file: COMBINE everything - fileReader + patterns + entropyCheck + gitReader
// This is the "brain" that runs the full scan and returns final results.

const { getAllFiles, readFileLines } = require("./fileReader");
const { SECRET_PATTERNS } = require("./patterns");
const { isHighEntropy } = require("./entropyCheck");
const { isGitRepo, getAllCommitHashes, getCommitDiff } = require("./gitReader");

/**
 * Scans a single line of text against all known regex patterns.
 * @param {string} line
 * @returns {Array} list of matches found in this line
 */
function scanLineForSecrets(line) {
  const findings = [];

  for (const pattern of SECRET_PATTERNS) {
    const matches = line.match(pattern.regex);
    if (matches) {
      for (const match of matches) {
        findings.push({
          type: pattern.name,
          severity: pattern.severity,
          matchedText: match,
        });
      }
    }
  }

  return findings;
}

/**
 * Scans all current files in a folder (NOT git history - just what's on disk right now).
 * @param {string} folderPath
 * @returns {Array} list of findings
 */
function scanCurrentFiles(folderPath) {
  const allFiles = getAllFiles(folderPath);
  const results = [];

  for (const file of allFiles) {
    const lines = readFileLines(file);

    lines.forEach((line, index) => {
      const findings = scanLineForSecrets(line);

      findings.forEach((finding) => {
        results.push({
          file: file,
          line: index + 1, // humans count lines starting from 1, not 0
          type: finding.type,
          severity: finding.severity,
          matchedText: finding.matchedText,
          source: "current-files",
        });
      });
    });
  }

  return results;
}

/**
 * Scans full git commit history for secrets that may have been
 * deleted from current files but still exist in old commits.
 * @param {string} repoPath
 * @returns {Array} list of findings
 */
function scanGitHistory(repoPath) {
  const results = [];

  if (!isGitRepo(repoPath)) {
    return results; // not a git repo, skip silently
  }

  const commitHashes = getAllCommitHashes(repoPath);

  for (const hash of commitHashes) {
    const diffText = getCommitDiff(repoPath, hash);
    const lines = diffText.split("\n");

    lines.forEach((line) => {
      const findings = scanLineForSecrets(line);

      findings.forEach((finding) => {
        results.push({
          file: `(git commit ${hash.substring(0, 7)})`,
          line: null,
          type: finding.type,
          severity: finding.severity,
          matchedText: finding.matchedText,
          source: "git-history",
        });
      });
    });
  }

  return results;
}

/**
 * Full scan: current files + git history combined.
 * @param {string} folderPath
 * @param {boolean} includeGitHistory
 * @returns {Array} combined results
 */
function runFullScan(folderPath, includeGitHistory = true) {
  let allResults = [];

  allResults = allResults.concat(scanCurrentFiles(folderPath));

  if (includeGitHistory) {
    allResults = allResults.concat(scanGitHistory(folderPath));
  }

  return allResults;
}

module.exports = { scanLineForSecrets, scanCurrentFiles, scanGitHistory, runFullScan };
