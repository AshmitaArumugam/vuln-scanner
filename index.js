#!/usr/bin/env node
// index.js
// Job of this file: ONLY ONE THING - be the entry point for the CLI
// This is what runs when user types: node index.js scan ./some-folder

const { Command } = require("commander");
const chalk = require("chalk");
const { runFullScan } = require("./src/scanner");

const program = new Command();

program
  .name("vuln-scanner")
  .description("Scans a folder (and its git history) for leaked secrets like API keys and passwords")
  .version("1.0.0");

program
  .command("scan <folderPath>")
  .description("Scan a folder for secrets")
  .option("--no-git", "skip scanning git history (current files only)")
  .action((folderPath, options) => {
    console.log(chalk.blue(`\nScanning: ${folderPath}\n`));

    const includeGitHistory = options.git !== false;
    const results = runFullScan(folderPath, includeGitHistory);

    if (results.length === 0) {
      console.log(chalk.green("✔ No secrets found. Looks clean!\n"));
      return;
    }

    console.log(chalk.red(`⚠ Found ${results.length} potential secret(s):\n`));

    results.forEach((result, i) => {
      const severityColor =
        result.severity === "critical"
          ? chalk.bgRed.white
          : result.severity === "high"
          ? chalk.red
          : chalk.yellow;

      console.log(
        `${i + 1}. ${severityColor(`[${result.severity.toUpperCase()}]`)} ${chalk.bold(result.type)}`
      );
      console.log(`   File: ${result.file}${result.line ? `  Line: ${result.line}` : ""}`);
      console.log(`   Source: ${result.source}`);
      console.log(`   Match: ${chalk.gray(result.matchedText)}\n`);
    });

    console.log(chalk.red(`\nTotal issues found: ${results.length}\n`));
  });

program.parse(process.argv);
