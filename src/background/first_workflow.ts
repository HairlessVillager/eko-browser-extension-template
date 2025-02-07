import { Eko, LLMProviderFactory, ToolRegistry, WorkflowGenerator, WorkflowParser } from "@eko-ai/eko";
import { EkoConfig, WorkflowCallback } from "@eko-ai/eko/types";
import { getLLMConfig } from "@eko-ai/eko/extension";

export async function main(role: string, outline: string, reference: string) {
  // Load LLM model configuration
  // the current browser plugin project provides a page for configuring LLM parameters
  let config = await getLLMConfig();
  if (!config || !config.apiKey) {
    printLog("Please configure apiKey", "error");
    return;
  }

  console.log(Eko.tools);

  /// original
  // Initialize eko
  // let eko = new Eko(config as EkoConfig);
  console.log(Eko.tools);

  // Generate a workflow from natural language description
  // const workflow = await eko.generate(role + outline + reference);
  // console.log(Eko.tools);

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
                "description": "Perform a web search to gather information about Sam Altman",
                "tools": [
                    "web_search"
                ],
                "params": {
                    "query": "Sam Altman OpenAI CEO career background achievements",
                    "maxResults": 10
                }
            },
            "output": {
                "type": "object",
                "schema": {
                    "search_results": "array"
                }
            },
            "dependencies": []
        },
        {
            "id": "open_relevant_pages",
            "type": "action",
            "action": {
                "type": "prompt",
                "name": "Open Search Results",
                "description": "Open the most relevant search result pages in new browser windows to gather detailed information",
                "tools": [
                    "open_url"
                ],
                "params": {
                    "url": "<SEARCH_RESULT_URL>",
                    "newWindow": true
                }
            },
            "dependencies": [
                "search_sam_altman"
            ]
        },
        {
            "id": "extract_page_content",
            "type": "action",
            "action": {
                "type": "prompt",
                "name": "Extract Page Content",
                "description": "Extract the content from opened web pages to gather detailed information about Sam Altman",
                "tools": [
                    "extract_content",
                    "tab_management"
                ],
                "params": {}
            },
            "output": {
                "type": "object",
                "schema": {
                    "extracted_content": "string"
                }
            },
            "dependencies": [
                "open_relevant_pages"
            ]
        },
        {
            "id": "create_markdown_summary",
            "type": "action",
            "action": {
                "type": "prompt",
                "name": "Create Markdown Summary",
                "description": "Format the gathered information into a structured markdown document with sections for background, career, achievements, and current work",
                "tools": [
                    "export_file"
                ],
                "params": {
                    "fileType": "md",
                    "filename": "sam_altman_summary.md",
                    "content": "# Sam Altman Profile Summary\n\n## Background\n[Background information]\n\n## Career Highlights\n[Career information]\n\n## Achievements\n[Major achievements]\n\n## Current Work\n[Current roles and projects]\n\n## Recent News\n[Recent developments]\n\n---\nGenerated on: [Current Date]"
                }
            },
            "dependencies": [
                "extract_page_content"
            ]
        }
    ],
    "variables": {
        "search_results": [],
        "extracted_content": "",
        "summary_content": ""
    }
  };
  console.log("LLMProviderFactory.buildLLMProvider()...");
  const llmProvider = LLMProviderFactory.buildLLMProvider(config as EkoConfig);

  console.log("build ToolRegistry...");
  let toolRegistry = new ToolRegistry()
  Eko.tools.forEach((tool) => toolRegistry.registerTool(tool));

  console.log("new WorkflowGenerator()...");
  const generator = new WorkflowGenerator(llmProvider, toolRegistry);

  console.log("generator.generateWorkflowFromJson()...");
  let workflow = await generator.generateWorkflowFromJson(json);
  
  console.log(workflow);

  let workflow_s = WorkflowParser.serialize(workflow);
  console.log(workflow_s);
  
  workflow = WorkflowParser.parse(workflow_s);
  console.log(workflow);

  console.log(Eko.tools);

  // Execute the workflow
  let eko = new Eko(config as EkoConfig);
  await eko.execute(workflow, hookLogs());
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
