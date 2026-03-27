#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import os from "node:os";
import { spawnSync } from "node:child_process";

const DEFAULT_DATA_FILE = "data/dataset_crawler-google-places_2026-03-19_08-24-12-839.json";

function printUsage() {
  console.log("Usage:");
  console.log("  node scripts/review-titles.mjs [json-file-path] [--no-backup]");
  console.log("");
  console.log("Examples:");
  console.log("  node scripts/review-titles.mjs");
  console.log("  node scripts/review-titles.mjs data/local-db.json");
}

function resolveArgs() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const noBackup = args.includes("--no-backup");
  const fileArg = args.find((arg) => !arg.startsWith("-"));
  const filePath = path.resolve(process.cwd(), fileArg ?? DEFAULT_DATA_FILE);

  return { filePath, noBackup };
}

function loadData(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    throw new Error("Target JSON must be an array.");
  }

  return data;
}

function writeData(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function createBackup(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(dir, `${base}.bak-${ts}`);
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

function question(rl, promptText) {
  return new Promise((resolve) => {
    rl.question(promptText, resolve);
  });
}

function questionWithPrefill(rl, promptText, prefillText) {
  return new Promise((resolve) => {
    rl.question(promptText, (answer) => resolve(answer));
    if (prefillText) {
      rl.write(prefillText);
    }
  });
}

function copyToClipboard(text) {
  if (typeof text !== "string" || text.length === 0) return false;
  const result = spawnSync("pbcopy", { input: text, encoding: "utf8" });
  return !result.error && result.status === 0;
}

function editInExternalEditor(initialText) {
  const editor = process.env.EDITOR || process.env.VISUAL || "nano";
  const tempPath = path.join(os.tmpdir(), `title-edit-${process.pid}-${Date.now()}.txt`);
  fs.writeFileSync(tempPath, `${initialText}\n`, "utf8");

  const result = spawnSync(editor, [tempPath], { stdio: "inherit" });
  if (result.error) {
    throw new Error(`Cannot launch editor '${editor}': ${result.error.message}`);
  }

  const edited = fs.readFileSync(tempPath, "utf8").replace(/\r\n/g, "\n").trim();
  fs.unlinkSync(tempPath);
  return edited;
}

function printHeader(index, total, currentTitle) {
  console.log("\n----------------------------------------");
  console.log(`Item ${index + 1} / ${total}`);
  console.log(`Current title: ${currentTitle ?? "<missing>"}`);
  console.log("Commands: ](next), /next, /prev, /edit, /save, /quit");
  console.log("Edit: type new title text and press Enter");
}

async function reviewTitles(data, filePath) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let index = 0;
  let changedCount = 0;

  while (index >= 0 && index < data.length) {
    const item = data[index];
    const existingTitle = typeof item?.title === "string" ? item.title : "";

    printHeader(index, data.length, existingTitle || null);
    if (copyToClipboard(existingTitle)) {
      console.log("(Copied current title to clipboard)");
    }

    const input = (await question(rl, "> ")).trim();

    if (input === "/next" || input === "]") {
      index += 1;
      continue;
    }

    if (input === "/prev") {
      index = Math.max(0, index - 1);
      continue;
    }

    if (input === "/save") {
      writeData(filePath, data);
      console.log("Saved.");
      continue;
    }

    if (input === "/edit") {
      let nextTitle = "";

      try {
        console.log("Opening editor with current title... (save and close to continue)");
        nextTitle = editInExternalEditor(existingTitle);
      } catch {
        // Fallback for environments where external editor is unavailable.
        console.log("Editor unavailable, fallback to inline prefill edit.");
        const edited = await questionWithPrefill(rl, "edit> ", existingTitle);
        nextTitle = edited.trim();
      }

      if (nextTitle.length === 0) {
        console.log("Title unchanged (empty edit). Use /next to continue.");
        continue;
      }

      if (!item || typeof item !== "object") {
        console.log("Current item is not an object; cannot set title.");
        continue;
      }

      item.title = nextTitle;
      changedCount += 1;
      console.log(`Updated title to: ${item.title}`);
      continue;
    }

    if (input === "/quit") {
      writeData(filePath, data);
      rl.close();
      return changedCount;
    }

    if (input.length === 0) {
      console.log("No input. Use /next to continue.");
      continue;
    }

    if (!item || typeof item !== "object") {
      console.log("Current item is not an object; cannot set title.");
      continue;
    }

    item.title = input;
    changedCount += 1;
    console.log(`Updated title to: ${item.title}`);
  }

  writeData(filePath, data);
  rl.close();
  return changedCount;
}

async function main() {
  const { filePath, noBackup } = resolveArgs();
  const data = loadData(filePath);

  if (!noBackup) {
    const backupPath = createBackup(filePath);
    console.log(`Backup created: ${backupPath}`);
  }

  console.log(`Loaded ${data.length} items from: ${filePath}`);

  const changedCount = await reviewTitles(data, filePath);
  console.log(`\nDone. Updated ${changedCount} title(s).`);
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
