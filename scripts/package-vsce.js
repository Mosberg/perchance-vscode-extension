const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const tempRoot = path.join(root, "tmp", "vsce-package");
const tempExt = path.join(tempRoot, "extension");

function run(command, cwd) {
  execSync(command, { stdio: "inherit", cwd });
}

function copyDir(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  fs.cpSync(source, destination, {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(source, src);
      if (!rel) {
        return true;
      }
      if (rel.startsWith("node_modules")) {
        return false;
      }
      if (rel.startsWith(".git")) {
        return false;
      }
      return true;
    }
  });
}

if (fs.existsSync(tempRoot)) {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

run("npm run build", root);
run("npm run copy-server -w client", root);

copyDir(path.join(root, "client"), tempExt);

run("npm install --production --no-package-lock", tempExt);
run("npx vsce package", tempExt);

const vsix = fs.readdirSync(tempExt).find((name) => name.endsWith(".vsix"));
if (!vsix) {
  throw new Error("VSIX package not found in temp folder.");
}

const sourceVsix = path.join(tempExt, vsix);
const targetVsix = path.join(root, vsix);
if (fs.existsSync(targetVsix)) {
  fs.rmSync(targetVsix, { force: true });
}
fs.copyFileSync(sourceVsix, targetVsix);

console.log(`Created ${targetVsix}`);
