const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function loadJson(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

suite("Extension Data Tests", () => {
  test("plugins.json entries have required fields", () => {
    const data = loadJson("data/plugins.json");
    assert.ok(Array.isArray(data.plugins), "plugins array is missing");
    assert.ok(data.plugins.length > 0, "plugins array is empty");

    data.plugins.forEach((plugin, index) => {
      assert.ok(plugin.label, `plugin ${index} missing label`);
      assert.ok(plugin.url || plugin.snippet, `plugin ${index} missing url/snippet`);
      if (plugin.snippet) {
        assert.strictEqual(typeof plugin.snippet, "string");
      }
      if (plugin.url) {
        assert.strictEqual(typeof plugin.url, "string");
      }
    });
  });

  test("templates.json entries have required fields", () => {
    const data = loadJson("data/templates.json");
    assert.ok(Array.isArray(data.templates), "templates array is missing");
    assert.ok(data.templates.length > 0, "templates array is empty");

    data.templates.forEach((template, index) => {
      assert.ok(template.id, `template ${index} missing id`);
      assert.ok(template.label, `template ${index} missing label`);
      assert.ok(typeof template.content === "string", `template ${index} missing content`);
    });
  });

  test("template_generators.json entries have required fields", () => {
    const data = loadJson("data/template_generators.json");
    assert.ok(Array.isArray(data.templates_generators), "templates_generators array is missing");
    assert.ok(data.templates_generators.length > 0, "templates_generators array is empty");

    data.templates_generators.forEach((template, index) => {
      assert.ok(template.label, `template generator ${index} missing label`);
      assert.ok(template.url, `template generator ${index} missing url`);
      assert.strictEqual(typeof template.url, "string");
      if (template.edit_url) {
        assert.strictEqual(typeof template.edit_url, "string");
      }
    });
  });
});
