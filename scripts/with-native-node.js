const { spawnSync, spawn, execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.join(__dirname, "..");

function isArm64Binary(filePath) {
  try {
    const info = execFileSync("file", ["-b", filePath], { encoding: "utf8" });
    return info.includes("arm64");
  } catch {
    return false;
  }
}

function getMachineArch() {
  if (process.platform !== "darwin") {
    return process.arch;
  }
  try {
    const hasArm64 = execFileSync("sysctl", ["-n", "hw.optional.arm64"], {
      encoding: "utf8",
    }).trim();
    if (hasArm64 === "1") {
      return "arm64";
    }
  } catch {
    // fall through
  }
  return process.arch;
}

function findPreferredNodeBinDir() {
  if (process.platform !== "darwin") {
    return null;
  }

  const home = process.env.HOME || "";
  const candidates = [
    process.env.PEPTIDE_NODE,
    process.env.NPM_NODE_EXECPATH,
    path.join(home, ".nvm", "versions", "node", "v22.22.0", "bin", "node"),
    path.join(home, ".nvm", "versions", "node", "v20.19.0", "bin", "node"),
    path.join(home, ".nvm", "versions", "node", "v18.20.8", "bin", "node"),
    "/opt/homebrew/bin/node",
    path.join(home, ".volta", "bin", "node"),
  ].filter(Boolean);

  const nvmDir = path.join(home, ".nvm", "versions", "node");
  if (fs.existsSync(nvmDir)) {
    for (const version of fs.readdirSync(nvmDir).sort().reverse()) {
      candidates.push(path.join(nvmDir, version, "bin", "node"));
    }
  }

  const wantArm64 = getMachineArch() === "arm64";
  for (const nodePath of candidates) {
    if (!fs.existsSync(nodePath)) continue;
    const arm64 = isArm64Binary(nodePath);
    if (wantArm64 ? arm64 : !arm64) {
      return path.dirname(nodePath);
    }
  }

  return null;
}

function withNativePathEnv() {
  const binDir = findPreferredNodeBinDir();
  if (!binDir) {
    return { ...process.env };
  }

  return {
    ...process.env,
    PATH: `${binDir}${path.delimiter}${process.env.PATH || ""}`,
    NPM_NODE_EXECPATH: path.join(binDir, "node"),
  };
}

function getPreferredNodePath() {
  const binDir = findPreferredNodeBinDir();
  if (binDir) {
    return path.join(binDir, "node");
  }
  return process.execPath;
}

function resolveCommand(args) {
  const nodePath = getPreferredNodePath();
  const [command, ...rest] = args;
  if (command === "next") {
    return [nodePath, [require.resolve("next/dist/bin/next"), ...rest]];
  }
  if (command === "tsx") {
    return [nodePath, [require.resolve("tsx/cli"), ...rest]];
  }
  if (command.endsWith(".js") || command.endsWith(".ts")) {
    const scriptPath = path.isAbsolute(command)
      ? command
      : path.join(root, command);
    return [nodePath, [scriptPath, ...rest]];
  }
  return [command, rest];
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: node scripts/with-native-node.js <command> [args...]");
    process.exit(1);
  }

  const env = withNativePathEnv();
  const [cmd, cmdArgs] = resolveCommand(args);
  const child = spawn(cmd, cmdArgs, {
    cwd: root,
    env,
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

if (require.main === module) {
  main();
}

module.exports = { findPreferredNodeBinDir, withNativePathEnv, isArm64Binary, getMachineArch };
