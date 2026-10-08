const fs = require("fs");
const lines = fs.readFileSync("d:/LearningAI/toy-ai/kidlo_complete1.html", "utf8").split(/\n/);
const line = lines[396];
const start = line.indexOf("base64,");
const end = line.indexOf('"', start);
if (start < 0 || end < 0) {
  console.error("logo not found");
  process.exit(1);
}
const b64 = line.slice(start + 7, end);
fs.mkdirSync("d:/LearningAI/toy-ai/frontend/public", { recursive: true });
fs.writeFileSync("d:/LearningAI/toy-ai/frontend/public/logo.png", Buffer.from(b64, "base64"));
console.log("logo bytes", b64.length);
