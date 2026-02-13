const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function readJson(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function writeJson(relativePath, data) {
  const filePath = path.join(ROOT, relativePath);
  const content = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(filePath, content, "utf8");
}

function sortByKey(key) {
  return (a, b) => {
    const left = (a[key] || "").toString();
    const right = (b[key] || "").toString();
    return left.localeCompare(right, "en", { sensitivity: "base" });
  };
}

function sortPlugins() {
  const data = readJson("data/plugins.json");
  if (Array.isArray(data.plugins)) {
    data.plugins.sort(sortByKey("label"));
  }
  writeJson("data/plugins.json", data);
}

function sortTemplates() {
  const data = readJson("data/templates.json");
  if (Array.isArray(data.templates)) {
    data.templates.sort(sortByKey("id"));
  }
  writeJson("data/templates.json", data);
}

function sortTemplateGenerators() {
  const data = readJson("data/template_generators.json");
  if (Array.isArray(data.templates_generators)) {
    data.templates_generators.sort(sortByKey("label"));
  }
  writeJson("data/template_generators.json", data);
}

function main() {
  sortPlugins();
  sortTemplates();
  sortTemplateGenerators();
  console.log("Sorted data files by label/id.");
}

main();
