// backend/src/utils/ai_runner.ts
import { spawn } from "child_process";
import path from "path";

/**
 * Runs the Python AI gateway script with the specified action and data.
 * Calls Python via child_process.spawn and streams inputs to stdin.
 */
export function runAiGateway(action: string, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    // Determine the path to the ai_gateway.py script
    // Path relative to backend/src/utils/ai_runner.ts -> ../../../ai/ai_gateway.py
    const gatewayPath = path.resolve(__dirname, "..", "..", "..", "ai", "ai_gateway.py");
    
    // Command payload
    const payload = JSON.stringify({ action, data });
    
    // Spawn python child process
    const pythonProcess = spawn("python", [gatewayPath]);
    
    let stdoutData = "";
    let stderrData = "";
    
    // Write JSON payload to standard input and close it
    pythonProcess.stdin.write(payload);
    pythonProcess.stdin.end();
    
    // Read stdout
    pythonProcess.stdout.on("data", (chunk) => {
      stdoutData += chunk.toString();
    });
    
    // Read stderr
    pythonProcess.stderr.on("data", (chunk) => {
      stderrData += chunk.toString();
    });
    
    // Process closed
    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`AI Gateway exited with error code ${code}`);
        console.error(`Stderr output: ${stderrData}`);
        reject(new Error(`AI Gateway process failed: ${stderrData || "exit code " + code}`));
        return;
      }
      
      try {
        const response = JSON.parse(stdoutData.trim());
        resolve(response);
      } catch (e) {
        console.error("Failed to parse AI Gateway stdout as JSON:", stdoutData);
        reject(new Error("AI Gateway returned invalid JSON response: " + e));
      }
    });
    
    pythonProcess.on("error", (err) => {
      console.error("Failed to start AI Gateway process:", err);
      reject(err);
    });
  });
}
