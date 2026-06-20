const { app, BrowserWindow, shell } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const net = require("net");
const path = require("path");

const isDev = !app.isPackaged;
const projectRoot = path.join(__dirname, "..");

function isArm64Node(nodePath) {
  try {
    const { execFileSync } = require("child_process");
    const info = execFileSync("file", ["-b", nodePath], { encoding: "utf8" });
    return info.includes("arm64");
  } catch {
    return false;
  }
}

function getDevPathEnv() {
  if (process.platform !== "darwin" || process.arch !== "arm64") {
    return process.env.PATH || "";
  }

  const home = process.env.HOME || "";
  const candidates = [];
  const homebrewNode = "/opt/homebrew/bin/node";
  if (fs.existsSync(homebrewNode)) {
    candidates.push(homebrewNode);
  }

  const nvmDir = path.join(home, ".nvm", "versions", "node");

  if (fs.existsSync(nvmDir)) {
    for (const version of fs.readdirSync(nvmDir).sort().reverse()) {
      candidates.push(path.join(nvmDir, version, "bin", "node"));
    }
  }

  const voltaNode = path.join(home, ".volta", "bin", "node");
  if (fs.existsSync(voltaNode)) {
    candidates.push(voltaNode);
  }

  for (const nodePath of candidates) {
    if (fs.existsSync(nodePath) && isArm64Node(nodePath)) {
      const binDir = path.dirname(nodePath);
      return `${binDir}:${process.env.PATH || ""}`;
    }
  }

  return process.env.PATH || "";
}


let mainWindow = null;
let serverProcess = null;
let serverPort = null;

function getDevNodeBinary() {
  if (process.env.PEPTIDE_NODE) {
    return process.env.PEPTIDE_NODE;
  }

  const home = process.env.HOME || "";
  const preferred = [
    process.env.NPM_NODE_EXECPATH,
    path.join(home, ".nvm", "versions", "node", "v22.22.0", "bin", "node"),
    path.join(home, ".nvm", "versions", "node", "v20.19.0", "bin", "node"),
    path.join(home, ".nvm", "versions", "node", "v18.20.8", "bin", "node"),
  ].filter(Boolean);

  for (const candidate of preferred) {
    if (fs.existsSync(candidate) && isArm64Node(candidate)) {
      return candidate;
    }
  }

  const pathEnv = getDevPathEnv();
  for (const dir of pathEnv.split(path.delimiter)) {
    const candidate = path.join(dir, "node");
    if (fs.existsSync(candidate) && isArm64Node(candidate)) {
      return candidate;
    }
  }

  return process.env.NPM_NODE_EXECPATH || "node";
}

function ensureUserDataDb() {
  const dataDir = path.join(app.getPath("userData"), "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, "peptides.db");
  if (!fs.existsSync(dbPath)) {
    const bundledDb = path.join(process.resourcesPath, "data", "peptides.db");
    if (fs.existsSync(bundledDb)) {
      fs.copyFileSync(bundledDb, dbPath);
    }
  }

  return dataDir;
}

function getDataDir() {
  return isDev ? path.join(projectRoot, "data") : ensureUserDataDb();
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

function waitForServer(url, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const poll = () => {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });

      request.on("error", retry);
      request.setTimeout(2000, () => {
        request.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() > deadline) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }
      setTimeout(poll, 400);
    };

    poll();
  });
}

function startNextDevServer(port, dataDir) {
  const nextCli = require.resolve("next/dist/bin/next");
  const nodeBin = getDevNodeBinary();

  serverProcess = spawn(
    nodeBin,
    [nextCli, "dev", "-p", String(port), "-H", "127.0.0.1"],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        PATH: getDevPathEnv(),
        PORT: String(port),
        HOSTNAME: "127.0.0.1",
        PEPTIDE_DATA_DIR: dataDir,
      },
      stdio: "inherit",
    }
  );

  serverProcess.on("exit", (code) => {
    if (code && code !== 0 && mainWindow && !mainWindow.isDestroyed()) {
      console.error(`Next.js dev server exited with code ${code}`);
    }
  });
}

function getStandaloneDir() {
  const base = path.join(process.resourcesPath, "standalone");
  const nested = path.join(base, "Peptide Search Pro");
  if (fs.existsSync(path.join(nested, "server.js"))) {
    return nested;
  }
  return base;
}

function startStandaloneServer(port, dataDir) {
  const standaloneDir = getStandaloneDir();
  const serverPath = path.join(standaloneDir, "server.js");

  serverProcess = spawn(process.execPath, [serverPath], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      PEPTIDE_DATA_DIR: dataDir,
    },
    stdio: "inherit",
  });

  serverProcess.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`Next.js standalone server exited with code ${code}`);
    }
  });
}

async function startServer() {
  serverPort = await getAvailablePort();
  const dataDir = getDataDir();

  if (isDev) {
    startNextDevServer(serverPort, dataDir);
  } else {
    startStandaloneServer(serverPort, dataDir);
  }

  await waitForServer(`http://127.0.0.1:${serverPort}`);
  return serverPort;
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: "Peptide Search Pro",
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill("SIGTERM");
    serverProcess = null;
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      const port = await startServer();
      createWindow(port);
    } catch (error) {
      console.error("Failed to start Peptide Search Pro:", error);
      app.quit();
    }
  });

  app.on("window-all-closed", () => {
    stopServer();
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0 && serverPort) {
      createWindow(serverPort);
    }
  });

  app.on("before-quit", () => {
    stopServer();
  });
}
