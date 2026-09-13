const { spawn } = require("child_process");
const path = require("path");

process.env.DEMO_RESET = "true";
process.env.PYTHONPATH = path.resolve(__dirname, "../../backend");

const pythonExe = process.platform === "win32"
  ? path.resolve(__dirname, "../../venv/Scripts/python.exe")
  : "python3";
const scriptPath = path.resolve(__dirname, "../../backend/app/database/reset_demo_db.py");

const child = spawn(pythonExe, [scriptPath], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
