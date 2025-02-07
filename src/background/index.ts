import Eko from "@eko-ai/eko";
import { loadTools } from "@eko-ai/eko/extension";
import { main } from "./first_workflow";

chrome.storage.local.set({ running: false });

// Register tools
Eko.tools = loadTools();

// Listen to messages from the browser extension
chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.type == "run") {
    try {
      // Click the RUN button to execute the main function (workflow)
      chrome.runtime.sendMessage({ type: "log", log: "Run..." });
      // Run workflow
      await main(request.prompt);
    } catch (e) {
      console.error(e);
      chrome.runtime.sendMessage({
        type: "log",
        log: e.message,
        level: "error",
      });
    } finally {
      chrome.storage.local.set({ running: false });
      chrome.runtime.sendMessage({ type: "stop" });
    }
  }
});
