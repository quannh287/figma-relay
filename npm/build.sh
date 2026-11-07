#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."          # go to repo root

OUT=npm/bin
PLATFORMS=npm/platform
rm -rf "$OUT" "$PLATFORMS"

# Single source of truth for the version: npm/package.json. Injected into the
# binary so the MCP server reports the same version it was published under.
VERSION=$(node -p "require('./npm/package.json').version")

# Directories carry npm's own os/cpu names, not Go's, so run.js can resolve
# `figrelay-${process.platform}-${process.arch}` with no mapping table.
TARGETS="darwin:arm64:darwin:arm64
darwin:x64:darwin:amd64
linux:arm64:linux:arm64
linux:x64:linux:amd64
win32:x64:windows:amd64
win32:arm64:windows:arm64"

echo "→ building 6 platform packages (v$VERSION)..."
NAMES=""
for t in $TARGETS; do
  IFS=: read -r npmos npmcpu goos goarch <<<"$t"
  pkg="figrelay-$npmos-$npmcpu"
  dir="$PLATFORMS/$npmos-$npmcpu"
  ext=""; [ "$goos" = "windows" ] && ext=".exe"
  echo "   $pkg"
  mkdir -p "$dir"
  CGO_ENABLED=0 GOOS=$goos GOARCH=$goarch \
    go build -trimpath -ldflags="-s -w -X main.version=$VERSION" \
    -o "$dir/figma-mcp$ext" ./cmd/figma-mcp
  # os/cpu are what make npm skip this package on every other platform.
  node -e '
    const [dir, name, version, os, cpu, bin] = process.argv.slice(1);
    require("fs").writeFileSync(dir + "/package.json", JSON.stringify({
      name, version, description: "figrelay prebuilt server for " + os + "-" + cpu,
      license: "MIT", os: [os], cpu: [cpu], files: [bin],
      repository: { type: "git", url: "git+https://github.com/quannh287/figma-relay.git" },
    }, null, 2) + "\n");
  ' "$dir" "$pkg" "$VERSION" "$npmos" "$npmcpu" "figma-mcp$ext"
  NAMES="$NAMES $pkg"
done

# release-please only bumps $.version, so without this the ranges would pin the
# previous release and npm would install last version's binary.
echo "→ pin optionalDependencies to v$VERSION..."
node -e '
  const fs = require("fs"), p = "npm/package.json";
  const pkg = JSON.parse(fs.readFileSync(p, "utf8"));
  pkg.optionalDependencies = Object.fromEntries(
    process.argv.slice(1).map((n) => [n, pkg.version]),
  );
  fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + "\n");
' $NAMES

echo "→ copy plugin..."
mkdir -p "$OUT/plugin"
cp plugin/code.js plugin/ui.html plugin/manifest.json "$OUT/plugin/"
echo "→ copy skills..."
cp -R skills "$OUT/skills"
echo "✅ done → npm/bin/ (plugin + skills), npm/platform/ (6 binaries)"
