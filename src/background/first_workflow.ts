import { Eko, createChromeApiProxy, LLMProviderFactory, ToolRegistry, WorkflowGenerator, WorkflowParser } from "@eko-ai/eko";
import { LLMConfig, EkoConfig, WorkflowCallback } from "@eko-ai/eko/types";
import { getLLMConfig } from "@eko-ai/eko/extension";

class MyChromeProxy {
  public static windows_create(createData: chrome.windows.CreateData): Promise<chrome.windows.Window> {
    console.log("this will create a window");
    return chrome.windows.create(createData);
  }
}

export async function main(prompt: string) {
  let chromeProxy = createChromeApiProxy(MyChromeProxy);
  let config = await getLLMConfig(chromeProxy);
  if (!config || !config.apiKey) {
    printLog("Please configure apiKey", "error");
    return;
  }

  let ekoConfig = { callback: hookLogs(), chromeProxy: chromeProxy };

  let toolRegistry = new ToolRegistry()
  Eko.tools.forEach((tool) => toolRegistry.registerTool(tool));

  let eko = new Eko(config as LLMConfig, ekoConfig);

  const json = {
    "id": "sam_altman_research_workflow",
    "name": "Search and Summarize Sam Altman Information",
    "description": "Workflow to search for Sam Altman's information, gather relevant details, and export a markdown summary",
    "nodes": [
      {
        "id": "search_sam_altman",
        "type": "action",
        "action": {
          "type": "prompt",
          "name": "Search Sam Altman Information",
          "description": "Perform a web search to gather information about Sam Altman. You should use https://www.bing.com, and maxResult = 1.",
          "tools": [
            "web_search"
          ],
        },
        "dependencies": []
      },
      {
        "id": "create_markdown_summary",
        "type": "action",
        "action": {
          "type": "prompt",
          "name": "Create Markdown Summary",
          "description": "Format the gathered information into a structured markdown document with sections for background, career, achievements, and current work",
          "tools": [
            "export_file",
            "document_agent",
          ],
        },
        "dependencies": [
          "search_sam_altman"
        ]
      }
    ],
  };

  const llmProvider = LLMProviderFactory.buildLLMProvider(config as LLMConfig);

  const generator = new WorkflowGenerator(llmProvider, toolRegistry);
  let workflow = await generator.generateWorkflowFromJson(json, ekoConfig);

  await eko.execute(workflow);
}

function hookLogs(): WorkflowCallback {
  return {
    hooks: {
      beforeWorkflow: async (workflow) => {
        printLog("Start workflow: " + workflow.name);
      },
      beforeSubtask: async (subtask, context) => {
        printLog("> subtask: " + subtask.name);
      },
      beforeToolUse: async (tool, context, input) => {
        printLog("> tool: " + tool.name);
        return input;
      },
      afterToolUse: async (tool, context, result) => {
        printLog("  tool: " + tool.name + " completed", "success");
        return result;
      },
      afterSubtask: async (subtask, context, result) => {
        printLog("  subtask: " + subtask.name + " completed", "success");
      },
      afterWorkflow: async (workflow, variables) => {
        printLog("Completed", "success");
      },
    },
  };
}

function printLog(log: string, level?: "info" | "success" | "error") {
  chrome.runtime.sendMessage({ type: "log", log, level: level || "info" });
}
