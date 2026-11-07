#!/usr/bin/env node
// Run the Go binary from this platform's optional dependency — NO network/GitHub
// download. stdout is the MCP transport → all wrapper logs go to stderr.
"use strict";
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

function fail(m) {
  process.stderr.write(`figrelay: ${m}\n`);
  process.exit(1);
}

// The platform packages are named after npm's own os/cpu values, so this needs
// no mapping table; npm installs exactly the one matching this machine.
const platformPkg = `figrelay-${process.platform}-${process.arch}`;
function resolveBinary() {
  const exe = process.platform === "win32" ? ".exe" : "";
  try {
    const dir = path.dirname(require.resolve(`${platformPkg}/package.json`));
    return path.join(dir, `figma-mcp${exe}`);
  } catch (_) {
    return null; // not installed: unsupported platform, or an npm --no-optional install
  }
}

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
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "explorer"
        : "xdg-open";
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
    "\nThree steps are left, and only you can do them:\n" +
      "  1. Figma Desktop → Plugins → Development → right-click Figma Relay → Remove\n" +
      "  2. Remove the server from your AI client, e.g. claude mcp remove figma-relay\n" +
      "     (other clients: delete the figma-relay entry from their MCP config file)\n" +
      "  3. Drop the package itself: npm uninstall -g figrelay\n" +
      "     (npx users: npm cache clean --force)\n\n",
  );
  process.exit(0);
}

const binPath = resolveBinary();
if (!binPath || !fs.existsSync(binPath))
  fail(
    `no prebuilt server for ${process.platform}/${process.arch}.\n` +
      `  Expected the optional dependency ${platformPkg}.\n` +
      `  If you installed with --no-optional or --omit=optional, reinstall without it.`,
  );
try {
  fs.chmodSync(binPath, 0o755);
} catch (_) {}
const r = spawnSync(binPath, process.argv.slice(2), { stdio: "inherit" });
if (r.error) fail(`failed to start server: ${r.error.message}`);
process.exit(r.status === null ? 1 : r.status);
