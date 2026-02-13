const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..");
const source = path.join(root, "server", "out");
const destination = path.join(__dirname, "..", "server", "out");

if (!fs.existsSync(source)) {
  if (fs.existsSync(destination)) {
    console.log("Server output already bundled. Skipping copy.");
    process.exit(0);
  }
  console.error("Server output not found. Run npm run build first.");
  process.exit(1);
}

fs.mkdirSync(destination, { recursive: true });
fs.cpSync(source, destination, { recursive: true });
