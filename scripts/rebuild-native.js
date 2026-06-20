const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { findPreferredNodeBinDir } = require("./with-native-node");

const root = path.join(__dirname, "..");
const symlinkRoot = path.join(process.env.HOME || "", "PeptideSearchPro");

function getRebuildCwd() {
  if (
    fs.existsSync(symlinkRoot) &&
    fs.realpathSync(symlinkRoot) === fs.realpathSync(root)
  ) {
    return symlinkRoot;
  }
  return root;
}

function isArm64Node(nodePath) {
  try {
    const info = execFileSync("file", ["-b", nodePath], { encoding: "utf8" });
    return info.includes("arm64");
  } catch {
    return false;
  }
}

function findPreferredNodePath() {
  const binDir = findPreferredNodeBinDir();
  if (binDir) {
    return path.join(binDir, "node");
  }
  return process.execPath;
}

function verifyNativeModule(nodePath) {
  const nativeModule = path.join(
    root,
    "node_modules",
    "better-sqlite3",
    "build",
    "Release",
    "better_sqlite3.node"
  );
  if (!fs.existsSync(nativeModule)) {
    throw new Error("better-sqlite3 native module missing after rebuild.");
  }
  const info = execFileSync("file", ["-b", nativeModule], { encoding: "utf8" });
  const nodeInfo = execFileSync("file", ["-b", nodePath], { encoding: "utf8" });
  const wantArm64 = nodeInfo.includes("arm64");
  if (wantArm64 && !info.includes("arm64")) {
    throw new Error(
      `better-sqlite3 has wrong architecture (${info.trim()}). Expected arm64.`
    );
  }
  if (!wantArm64 && info.includes("arm64")) {
    throw new Error(
      `better-sqlite3 has wrong architecture (${info.trim()}). Expected x86_64.`
    );
  }
  console.log(`better-sqlite3 native build verified for ${nodeInfo.trim()}.`);
}

function rebuild() {
  const nodePath = findPreferredNodePath();
  if (!nodePath || !fs.existsSync(nodePath)) {
    throw new Error("No compatible Node binary found. Install Node 18+.");
  }

  const binDir = path.dirname(nodePath);
  const npmPath = path.join(binDir, "npm");
  const rebuildCwd = getRebuildCwd();
  const sqliteBuild = path.join(root, "node_modules", "better-sqlite3", "build");

  if (fs.existsSync(sqliteBuild)) {
    fs.rmSync(sqliteBuild, { recursive: true, force: true });
  }

  const env = {
    ...process.env,
    PATH: `${binDir}${path.delimiter}${process.env.PATH || ""}`,
  };

  console.log(`Rebuilding better-sqlite3 with ${nodePath}`);
  console.log(`Using cwd: ${rebuildCwd}`);

  if (fs.existsSync(npmPath)) {
    execFileSync(npmPath, ["rebuild", "better-sqlite3"], {
      cwd: rebuildCwd,
      stdio: "inherit",
      env,
    });
  } else {
    execFileSync(nodePath, [path.join(binDir, "npm"), "rebuild", "better-sqlite3"], {
      cwd: rebuildCwd,
      stdio: "inherit",
      env,
    });
  }

  verifyNativeModule(nodePath);
}

if (process.platform === "darwin") {
  rebuild();
} else {
  const { execSync } = require("child_process");
  execSync("npm rebuild better-sqlite3", { cwd: root, stdio: "inherit" });
}
