// fileReader.js
// Job of this file: ONLY ONE THING - find all files inside a folder (and its subfolders)
// It does NOT check for secrets here. That happens later in scanner.js

const fs = require("fs");
const path = require("path");

// Folders we should NEVER scan (waste of time + huge + not user code)
const IGNORE_FOLDERS = ["node_modules", ".git", "dist", "build", ".next"];

/**
 * Recursively collects all file paths inside a folder.
 * @param {string} folderPath - the folder to scan
 * @returns {string[]} - list of full file paths
 */
function getAllFiles(folderPath) {
  let fileList = [];

  // Step 1: read everything inside this folder (files + subfolders)
  const items = fs.readdirSync(folderPath);

  for (const item of items) {
    // Skip ignored folders
    if (IGNORE_FOLDERS.includes(item)) continue;

    const fullPath = path.join(folderPath, item);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      // It's a folder -> go inside it too (recursion)
      const nestedFiles = getAllFiles(fullPath);
      fileList = fileList.concat(nestedFiles);
    } else {
      // It's a file -> add it to our list
      fileList.push(fullPath);
    }
  }

  return fileList;
}

/**
 * Reads the content of a file as text, split into lines.
 * We need line numbers later to tell the user WHERE the secret is.
 * @param {string} filePath
 * @returns {string[]} - array of lines
 */
function readFileLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return content.split("\n");
  } catch (err) {
    // Some files are binary (images, .exe) and can't be read as text - just skip them
    return [];
  }
}

module.exports = { getAllFiles, readFileLines };
