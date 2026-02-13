# Perchance for VS Code Quickstart

## What's in the folder

- This folder contains all of the files necessary for your extension.
- `package.json` - extension manifest (commands, language, and activation events).
- `extension.js` - activation, commands, formatter, diagnostics, and generator helpers.

## Get up and running straight away

- Press `F5` to open a new window with your extension loaded.
- Run a command from the command palette by pressing (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) and typing `Perchance`.
- Set breakpoints in your code inside `extension.js` to debug your extension.
- Find output from your extension in the debug console.

## Make changes

- You can relaunch the extension from the debug toolbar after changing code in `extension.js`.
- You can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window with your extension to load your changes.

## Explore the API

- You can open the full set of our API when you open the file `node_modules/@types/vscode/index.d.ts`.

## Run tests

- Install the [Extension Test Runner](https://marketplace.visualstudio.com/items?itemName=ms-vscode.extension-test-runner)
- Open the Testing view from the activity bar and click the Run Test" button, or use the hotkey `Ctrl/Cmd + ; A`
- See the output of the test result in the Test Results view.
- Make changes to `test/extension.test.js` or create new test files inside the `test` folder.
  - The provided test runner will only consider files matching the name pattern `**.test.js`.
  - You can create folders inside the `test` folder to structure your tests any way you want.

## Go further

- [Follow UX guidelines](https://code.visualstudio.com/api/ux-guidelines/overview) to create extensions that seamlessly integrate with VS Code's native interface and patterns.
- [Publish your extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) on the VS Code extension marketplace.
- Automate builds by setting up [Continuous Integration](https://code.visualstudio.com/api/working-with-extensions/continuous-integration).
- Integrate to the [report issue](https://code.visualstudio.com/api/get-started/wrapping-up#issue-reporting) flow to get issue and feature requests reported by users.
