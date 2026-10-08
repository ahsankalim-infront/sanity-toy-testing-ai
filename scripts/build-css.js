const fs = require("fs");
let css = fs.readFileSync("d:/LearningAI/toy-ai/frontend/_theme.css", "utf8");
const cut = css.indexOf("</style>");
if (cut >= 0) css = css.slice(0, cut);
css = css.replace(
  "body{font-family:'Nunito',sans-serif;background:var(--bg);color:var(--dark);overflow-x:hidden;cursor:none}",
  "body{font-family:'Nunito',sans-serif;background:var(--bg);color:var(--dark);overflow-x:hidden}"
);
css = css.replaceAll("cursor:none", "cursor:pointer");
css = `@import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap');\n${css}`;
fs.mkdirSync("d:/LearningAI/toy-ai/frontend/app", { recursive: true });
fs.writeFileSync("d:/LearningAI/toy-ai/frontend/app/globals.css", css);
console.log("globals.css", css.length);
