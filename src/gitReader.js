// gitReader.js
// Job of this file: ONLY ONE THING - talk to git and get commit history
//
// WHY do we need this?
// Even if you DELETE a secret from your current code and commit again,
// the secret still exists in the OLD commit forever (unless history is rewritten).
// So a good scanner must check git history too, not just current files.

const { execSync } = require("child_process");

/**
 * Checks if a folder is actually a git repository.
 * @param {string} repoPath
 * @returns {boolean}
 */
function isGitRepo(repoPath) {
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      cwd: repoPath,
      stdio: "pipe",
    });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Gets a list of all commit hashes in the repo.
 * @param {string} repoPath
 * @returns {string[]} array of commit hashes
 */
function getAllCommitHashes(repoPath) {
  try {
    const output = execSync("git log --pretty=format:%H", {
      cwd: repoPath,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return output.split("\n").filter(Boolean);
  } catch (err) {
    // no commits yet, or some other git issue - just skip git history scan safely
    return [];
  }
}
/**
 * Gets the full diff (changes) introduced by one specific commit.
 * We scan the diff text for secrets, same as we scan normal files.
 * @param {string} repoPath
 * @param {string} commitHash
 * @returns {string} diff content as text
 */
function getCommitDiff(repoPath, commitHash) {
  try {
    const output = execSync(`git show ${commitHash}`, {
      cwd: repoPath,
      encoding: "utf-8",
      maxBuffer: 1024 * 1024 * 10, // 10MB limit for big commits
    });
    return output;
  } catch (err) {
    return "";
  }
}

module.exports = { isGitRepo, getAllCommitHashes, getCommitDiff };
