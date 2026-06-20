const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const standaloneDir = path.join(root, ".next", "standalone");
const nestedStandaloneDir = path.join(standaloneDir, "Peptide Search Pro");
const resolvedStandaloneDir = fs.existsSync(
  path.join(nestedStandaloneDir, "server.js")
)
  ? nestedStandaloneDir
  : standaloneDir;
const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(resolvedStandaloneDir, ".next", "static");
const desktopBundleDir = path.join(root, "desktop", "standalone");
const dbPath = path.join(root, "data", "peptides.db");

if (!process.env.SKIP_NEXT_BUILD) {
  console.log("Building Next.js standalone output...");
  execSync("npm run build", { cwd: root, stdio: "inherit" });
} else {
  console.log("Skipping Next.js build (SKIP_NEXT_BUILD is set)...");
}

if (!fs.existsSync(path.join(resolvedStandaloneDir, "server.js"))) {
  throw new Error("Missing standalone server.js. Check next.config.ts output settings.");
}

if (!fs.existsSync(staticSrc)) {
  throw new Error("Missing .next/static. Next.js build may have failed.");
}

console.log("Copying static assets into standalone bundle...");
fs.mkdirSync(path.dirname(staticDest), { recursive: true });
fs.cpSync(staticSrc, staticDest, { recursive: true });

if (!fs.existsSync(dbPath)) {
  throw new Error("Missing data/peptides.db. Run npm run db:setup first.");
}

console.log("Staging standalone bundle for electron-builder...");
fs.rmSync(path.join(root, "desktop"), { recursive: true, force: true });
fs.cpSync(resolvedStandaloneDir, desktopBundleDir, { recursive: true });

const sqliteSrc = path.join(root, "node_modules", "better-sqlite3");
const sqliteDest = path.join(desktopBundleDir, "node_modules", "better-sqlite3");
fs.rmSync(sqliteDest, { recursive: true, force: true });
fs.cpSync(sqliteSrc, sqliteDest, { recursive: true });

const electronVersion = require("electron/package.json").version;
const rebuildDir = path.join(os.tmpdir(), "peptide-search-pro-standalone-rebuild");
console.log(`Rebuilding better-sqlite3 for Electron ${electronVersion}...`);
fs.rmSync(rebuildDir, { recursive: true, force: true });
fs.cpSync(desktopBundleDir, rebuildDir, { recursive: true });
execSync(
  `"${path.join(root, "node_modules", ".bin", "electron-rebuild")}" -f -w better-sqlite3 --version=${electronVersion} --arch=arm64`,
  {
    cwd: rebuildDir,
    stdio: "inherit",
    env: {
      ...process.env,
      CXXFLAGS: "-std=c++20",
      npm_config_cxxflags: "-std=c++20",
    },
  }
);

const rebuiltBinary = path.join(
  rebuildDir,
  "node_modules",
  "better-sqlite3",
  "build",
  "Release",
  "better_sqlite3.node"
);
if (!fs.existsSync(rebuiltBinary)) {
  throw new Error("Electron rebuild did not produce better_sqlite3.node");
}

fs.copyFileSync(
  rebuiltBinary,
  path.join(sqliteDest, "build", "Release", "better_sqlite3.node")
);
fs.rmSync(rebuildDir, { recursive: true, force: true });

console.log("Desktop build resources ready.");
