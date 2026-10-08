const { spawn } = require("child_process");
const path = require("path");

function run(command, args, cwd) {
  const child = spawn(command, args, { cwd, stdio: "inherit", shell: true });
  child.on("exit", (code) => {
    if (code) process.exit(code);
  });
  return child;
}

const root = path.join(__dirname, "..");
const mode = process.argv[2] === "start" ? "start" : "dev";
run("npm", ["run", mode === "start" ? "start" : "dev"], path.join(root, "backend"));
run("npm", ["run", mode], path.join(root, "frontend"));
