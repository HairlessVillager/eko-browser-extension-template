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
  const [role, setRole] = useState("");
  const [outline, setOutline] = useState("");
  const [reference, setReference] = useState("");

  useEffect(() => {
    chrome.storage.local.get(["running", "role", "outline", "reference"], (result) => {
      if (result.running !== undefined) {
        setRunning(result.running);
      }
      if (result.role !== undefined) {
        setRole(result.role);
      }
      if (result.outline !== undefined) {
        setOutline(result.outline);
      }
      if (result.reference !== undefined) {
        setReference(result.reference);
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
    if (!role.trim() && !outline.trim() && !reference.trim()) {
      return;
    }
    setLogs([]);
    setRunning(true);
    chrome.storage.local.set({ running: true, role, outline, reference });
    chrome.runtime.sendMessage({
      type: "run",
      role: role.trim(),
      outline: outline.trim(),
      reference: reference.trim(),
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

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    e.target.style.boxShadow = "0 4px 8px rgba(0, 150, 255, 0.7)";
    e.target.style.transform = "translateY(-4px)"; // Floating effect
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    e.target.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.15)";
    e.target.style.transform = "translateY(0)"; // Reset the position
  };

  return (
    <div style={{ width: "400px", margin: "0 auto", padding: "20px", background: "linear-gradient(135deg, #2c2c2c, #6c6c6c)", borderRadius: "16px" }}>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h3 style={{ fontFamily: "'Roboto', sans-serif", color: "#fff", fontSize: "24px" }}>思想汇报撰写助手</h3>
      </div>
      
      {/* Role Input */}
      <Input.TextArea
        ref={textAreaRef}
        rows={4}
        value={role}
        disabled={running}
        placeholder="Role"
        onChange={(e) => setRole(e.target.value)}
        style={{
          marginBottom: "20px",
          padding: "14px",
          borderRadius: "12px",
          border: "1px solid #ccc",
          backgroundColor: "#fff",  // White background for input fields
          fontSize: "14px",
          fontFamily: "'Roboto', sans-serif",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
          color: "#333",  // Dark text color for better readability
          transition: "border-color 0.3s, box-shadow 0.3s, transform 0.3s", // Added transition for smooth float
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      {/* Outline Input */}
      <Input.TextArea
        ref={textAreaRef}
        rows={4}
        value={outline}
        disabled={running}
        placeholder="Outline"
        onChange={(e) => setOutline(e.target.value)}
        style={{
          marginBottom: "20px",
          padding: "14px",
          borderRadius: "12px",
          border: "1px solid #ccc",
          backgroundColor: "#fff",  // White background for input fields
          fontSize: "14px",
          fontFamily: "'Roboto', sans-serif",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
          color: "#333",  // Dark text color for better readability
          transition: "border-color 0.3s, box-shadow 0.3s, transform 0.3s", // Added transition for smooth float
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      {/* Reference Input */}
      <Input.TextArea
        ref={textAreaRef}
        rows={4}
        value={reference}
        disabled={running}
        placeholder="Reference"
        onChange={(e) => setReference(e.target.value)}
        style={{
          marginBottom: "20px",
          padding: "14px",
          borderRadius: "12px",
          border: "1px solid #ccc",
          backgroundColor: "#fff",  // White background for input fields
          fontSize: "14px",
          fontFamily: "'Roboto', sans-serif",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
          color: "#333",  // Dark text color for better readability
          transition: "border-color 0.3s, box-shadow 0.3s, transform 0.3s", // Added transition for smooth float
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      {/* Run Button */}
      <Button
        type="primary"
        onClick={handleClick}
        disabled={running}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "10px",
          background: "linear-gradient(45deg, #00bcd4, #4caf50)",
          color: "white",
          fontWeight: "bold",
          fontSize: "16px",
          transition: "background-color 0.3s, box-shadow 0.3s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "linear-gradient(45deg, #00acc1, #388e3c)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "linear-gradient(45deg, #00bcd4, #4caf50)")}
      >
        {running ? "Running..." : "Run"}
      </Button>

      {/* Logs Section */}
      {logs.length > 0 && (
        <div
          ref={logsRef}
          style={{
            marginTop: "20px",
            padding: "12px",
            borderRadius: "10px",
            backgroundColor: "#333",
            border: "1px solid #ccc",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            height: "220px",
            overflowY: "auto",
            fontFamily: "'Roboto', sans-serif",
            color: "#fff",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "12px" }}>Logs:</div>
          {logs.map((log, index) => (
            <div
              key={index}
              style={{
                fontSize: "12px",
                marginBottom: "8px",
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
