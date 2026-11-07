#!/usr/bin/env node
// Run the Go binary bundled in the npm package — NO network/GitHub download.
// stdout is the MCP transport → all wrapper logs go to stderr.
"use strict";
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const plat = process.platform === "win32" ? "windows" : process.platform; // darwin|linux|windows
const arch = { x64: "amd64", arm64: "arm64" }[process.arch];
function fail(m) {
  process.stderr.write(`figrelay: ${m}\n`);
  process.exit(1);
}
if (!arch || !["darwin", "linux", "windows"].includes(plat))
  fail(`unsupported platform: ${process.platform}/${process.arch}`);

const exe = plat === "windows" ? ".exe" : "";
const binPath = path.join(
  __dirname,
  "bin",
  `${plat}-${arch}`,
  `figma-mcp${exe}`,
);

// Subcommand: install-plugin — extract the plugin into a VISIBLE folder (no leading dot)
// and open that folder so the user sees manifest.json right away.
if (process.argv[2] === "install-plugin") {
  const srcDir = path.join(__dirname, "bin", "plugin");
  const destDir = path.join(os.homedir(), "figrelay-plugin");
  fs.mkdirSync(destDir, { recursive: true });
  for (const f of ["code.js", "ui.html", "manifest.json"])
    fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f));

  process.stdout.write(
    "\n✅ Figma plugin ready.\n\n" +
      "In Figma Desktop → Plugins → Development → Import plugin from manifest…\n" +
      "and select this file:\n\n" +
      "   " +
      path.join(destDir, "manifest.json") +
      "\n\n",
  );

  // Open the folder in the file manager (best-effort; ignore errors).
  const opener =
    plat === "darwin" ? "open" : plat === "windows" ? "explorer" : "xdg-open";
  try {
    spawnSync(opener, [destDir], { stdio: "ignore", detached: true });
  } catch (_) {}
  process.exit(0);
}

// Subcommand: install-skills — copy the agent skills into the current project
// so the AI client picks them up from .claude/skills/<name>/SKILL.md.
if (process.argv[2] === "install-skills") {
  const srcDir = path.join(__dirname, "bin", "skills");
  const destDir = path.join(process.cwd(), ".claude", "skills");
  if (!fs.existsSync(srcDir)) fail("skills not found in this package");
  for (const name of fs.readdirSync(srcDir)) {
    fs.mkdirSync(path.join(destDir, name), { recursive: true });
    fs.copyFileSync(
      path.join(srcDir, name, "SKILL.md"),
      path.join(destDir, name, "SKILL.md"),
    );
    process.stdout.write(`  ${name}\n`);
  }
  process.stdout.write(`\n✅ Skills installed into ${destDir}\n`);
  process.exit(0);
}

// Subcommand: uninstall — remove only what install-plugin/install-skills wrote.
// The Figma side and the MCP client config are the user's to undo: no API
// reaches either, so print them rather than pretend the machine is clean.
if (process.argv[2] === "uninstall") {
  const pluginDir = path.join(os.homedir(), "figrelay-plugin");
  const skillsDir = path.join(process.cwd(), ".claude", "skills");
  let removed = 0;
  if (fs.existsSync(pluginDir)) {
    fs.rmSync(pluginDir, { recursive: true, force: true });
    process.stdout.write(`  removed ${pluginDir}\n`);
    removed++;
  }
  if (fs.existsSync(skillsDir)) {
    for (const name of fs.readdirSync(skillsDir)) {
      if (!name.startsWith("figrelay-")) continue;
      fs.rmSync(path.join(skillsDir, name), { recursive: true, force: true });
      process.stdout.write(`  removed ${path.join(skillsDir, name)}\n`);
      removed++;
    }
  }
  if (!removed) process.stdout.write("  nothing to remove\n");
  process.stdout.write(
    "\nTwo steps are left, and only you can do them:\n" +
      "  1. Figma Desktop → Plugins → Development → right-click Figma Relay → Remove\n" +
      "  2. Remove the server from your AI client, e.g. claude mcp remove figma-relay\n" +
      "     (other clients: delete the figma-relay entry from their MCP config file)\n\n",
  );
  process.exit(0);
}

if (!fs.existsSync(binPath)) fail(`binary not found for ${plat}-${arch}`);
try {
  fs.chmodSync(binPath, 0o755);
} catch (_) {}
const r = spawnSync(binPath, process.argv.slice(2), { stdio: "inherit" });
if (r.error) fail(`failed to start server: ${r.error.message}`);
process.exit(r.status === null ? 1 : r.status);
