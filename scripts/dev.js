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
run("npm", ["run", "dev"], path.join(root, "backend"));
run("npm", ["run", "dev"], path.join(root, "frontend"));
