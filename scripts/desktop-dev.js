const { spawn } = require("child_process");
const path = require("path");
const { withNativePathEnv } = require("./with-native-node");

const root = path.join(__dirname, "..");

const env = withNativePathEnv();
delete env.ELECTRON_RUN_AS_NODE;

// require('electron') from Node returns the path to the Electron executable
const electronPath = require("electron");

const child = spawn(electronPath, ["."], {
  cwd: root,
  env,
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 0));
