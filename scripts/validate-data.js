const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function readJson(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function addError(errors, message) {
  errors.push(message);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validatePlugins(errors) {
  const data = readJson("data/plugins.json");
  if (!Array.isArray(data.plugins)) {
    addError(errors, "plugins.json: plugins array is missing.");
    return;
  }

  const seenLabels = new Set();
  data.plugins.forEach((plugin, index) => {
    if (!isNonEmptyString(plugin.label)) {
      addError(errors, `plugins.json: plugin ${index} missing label.`);
    } else if (seenLabels.has(plugin.label)) {
      addError(errors, `plugins.json: duplicate label '${plugin.label}'.`);
    } else {
      seenLabels.add(plugin.label);
    }

    if (!isNonEmptyString(plugin.url) && !isNonEmptyString(plugin.snippet)) {
      addError(errors, `plugins.json: plugin ${index} missing url or snippet.`);
    }

    if (plugin.url && !isNonEmptyString(plugin.url)) {
      addError(errors, `plugins.json: plugin ${index} url must be a string.`);
    }

    if (plugin.snippet && !isNonEmptyString(plugin.snippet)) {
      addError(errors, `plugins.json: plugin ${index} snippet must be a string.`);
    }

    if (plugin.description && typeof plugin.description !== "string") {
      addError(errors, `plugins.json: plugin ${index} description must be a string.`);
    }
  });
}

function validateTemplates(errors) {
  const data = readJson("data/templates.json");
  if (!Array.isArray(data.templates)) {
    addError(errors, "templates.json: templates array is missing.");
    return;
  }

  const seenIds = new Set();
  data.templates.forEach((template, index) => {
    if (!isNonEmptyString(template.id)) {
      addError(errors, `templates.json: template ${index} missing id.`);
    } else if (seenIds.has(template.id)) {
      addError(errors, `templates.json: duplicate id '${template.id}'.`);
    } else {
      seenIds.add(template.id);
    }

    if (!isNonEmptyString(template.label)) {
      addError(errors, `templates.json: template ${index} missing label.`);
    }

    if (typeof template.content !== "string") {
      addError(errors, `templates.json: template ${index} missing content.`);
    }

    if (template.description && typeof template.description !== "string") {
      addError(errors, `templates.json: template ${index} description must be a string.`);
    }
  });
}

function validateTemplateGenerators(errors) {
  const data = readJson("data/template_generators.json");
  if (!Array.isArray(data.templates_generators)) {
    addError(errors, "template_generators.json: templates_generators array is missing.");
    return;
  }

  const seenLabels = new Set();
  const seenUrls = new Set();
  data.templates_generators.forEach((template, index) => {
    if (!isNonEmptyString(template.label)) {
      addError(errors, `template_generators.json: template ${index} missing label.`);
    } else if (seenLabels.has(template.label)) {
      addError(errors, `template_generators.json: duplicate label '${template.label}'.`);
    } else {
      seenLabels.add(template.label);
    }

    if (!isNonEmptyString(template.url)) {
      addError(errors, `template_generators.json: template ${index} missing url.`);
    } else if (seenUrls.has(template.url)) {
      addError(errors, `template_generators.json: duplicate url '${template.url}'.`);
    } else {
      seenUrls.add(template.url);
    }

    if (template.edit_url && !isNonEmptyString(template.edit_url)) {
      addError(errors, `template_generators.json: template ${index} edit_url must be a string.`);
    }

    if (template.description && typeof template.description !== "string") {
      addError(errors, `template_generators.json: template ${index} description must be a string.`);
    }
  });
}

function main() {
  const errors = [];
  validatePlugins(errors);
  validateTemplates(errors);
  validateTemplateGenerators(errors);

  if (errors.length > 0) {
    console.error("Data validation failed:");
    errors.forEach((message) => {
      console.error(`- ${message}`);
    });
    process.exit(1);
  }

  console.log("Data validation passed.");
}

main();
