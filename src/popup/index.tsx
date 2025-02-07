import { createRoot } from "react-dom/client";
import React, { useState, useRef, useEffect } from "react";
import { Button, Input } from "antd";

interface LogMessage {
  time: string;
  log: string;
  level?: "info" | "error" | "success";
}

const AppRun = () => {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const logsRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState("1");
  

  useEffect(() => {
    chrome.storage.local.get(["running", "role", "outline", "reference"], (result) => {
      if (result.running !== undefined) {
        setRunning(result.running);
      }
      if (result.prompt !== undefined) {
        setPrompt(result.prompt);
      }
    });
    const messageListener = (message: any) => {
      if (message.type === "stop") {
        setRunning(false);
        chrome.storage.local.set({ running: false });
      } else if (message.type === "log") {
        const time = new Date().toLocaleTimeString();
        setLogs((prev) => [
          ...prev,
          { time, log: message.log, level: message.level || "info" },
        ]);
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  const handleClick = () => {
    if (!prompt.trim()) {
      return;
    }
    setLogs([]);
    setRunning(true);
    chrome.storage.local.set({ running: true, prompt });
    chrome.runtime.sendMessage({
      type: "run",
      prompt: prompt.trim(),
    });
  };

  const getLogStyle = (level: string) => {
    switch (level) {
      case "error":
        return { color: "#ff4d4f" };
      case "success":
        return { color: "#52c41a" };
      default:
        return { color: "#1890ff" };
    }
  };

  return (
    <div
      style={{
        minWidth: "360px",
        minHeight: "80px",
      }}
    >
      <div
        style={{
          textAlign: "center",
        }}
      >
        <h3>Eko Workflow</h3>
        <Input.TextArea
          ref={textAreaRef}
          rows={4}
          value={prompt}
          disabled={running}
          placeholder="Prompt"
          onChange={(e) => setPrompt(e.target.value)}
        />
        <Button
          type="primary"
          onClick={handleClick}
          disabled={running}
          style={{
            marginTop: "4px",
          }}
        >
          {running ? "Running..." : "Run"}
        </Button>
      </div>
      {logs.length > 0 && (
        <div
          ref={logsRef}
          style={{
            marginTop: "16px",
            textAlign: "left",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            padding: "8px",
            width: "360px",
            height: "220px",
            overflowY: "auto",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "8px" }}>Logs:</div>
          {logs.map((log, index) => (
            <div
              key={index}
              style={{
                fontSize: "12px",
                marginBottom: "4px",
                fontFamily: "monospace",
                ...getLogStyle(log.level || "info"),
              }}
            >
              [{log.time}] {log.log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <AppRun />
  </React.StrictMode>
);
