const fs = require("fs");
const path = require("path");

const bPath = (p) => path.join(__dirname, p);

function moveIfExist(src, dest) {
  if (fs.existsSync(bPath(src))) {
    fs.mkdirSync(path.dirname(bPath(dest)), { recursive: true });
    fs.renameSync(bPath(src), bPath(dest));
  }
}

moveIfExist("server/db/schema.ts", "src/domain/schema.ts");
moveIfExist("server/db/schema", "src/domain/schema");
moveIfExist("server/db/index.ts", "src/infrastructure/database/index.ts");
moveIfExist("server/db/seed.ts", "src/infrastructure/database/seed.ts");
moveIfExist("server/routes/api", "src/presentation/routes/api");
moveIfExist("server/routes.ts", "src/presentation/routes.ts");
moveIfExist("server/middleware", "src/presentation/middleware");
moveIfExist("server/lib", "src/infrastructure/lib");
moveIfExist("server.ts", "src/index.ts");

// Attempt to cleanup old dirs
try {
  if (fs.existsSync(bPath("server/db"))) fs.rmdirSync(bPath("server/db"));
  if (fs.existsSync(bPath("server/routes"))) fs.rmdirSync(bPath("server/routes"));
  if (fs.existsSync(bPath("server"))) fs.rmdirSync(bPath("server"));
} catch (e) {
  console.log("Cleanup skipped", e.message);
}

// Update imports
function replaceInFile(file, replacements) {
  if (!fs.existsSync(bPath(file))) return;
  let content = fs.readFileSync(bPath(file), "utf8");
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(bPath(file), content);
}

// Update src/index.ts imports
replaceInFile("src/index.ts", [
  ["./server/routes.js", "./presentation/routes.js"],
  ["./server/routes/api/auth.js", "./presentation/routes/api/auth.js"],
]);

// We mapped @shared/* to ./src/domain/* in tsconfig.
// Let's update tsconfig.json
const tsconfigPath = bPath("tsconfig.json");
let tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));
if (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) {
  tsconfig.compilerOptions.paths["@shared/*"] = ["./src/domain/*"];
}
fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));

// Update drizzle.config.ts
replaceInFile("drizzle.config.ts", [["./server/db/schema.ts", "./src/domain/schema.ts"]]);

// Update src/infrastructure/database/index.ts
replaceInFile("src/infrastructure/database/index.ts", [["./schema.js", "../../domain/schema.js"]]);

// Update src/infrastructure/database/seed.ts
replaceInFile("src/infrastructure/database/seed.ts", [
  ["../../shared/schema/learning.js", "../../domain/schema/learning.js"],
  ["../db/index.js", "./index.js"],
]);

// Update routes to use correct db imports
function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    var filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile()) {
      callback(filepath, stats);
    }
  });
}

if (fs.existsSync(bPath("src/presentation/routes/api"))) {
  walkSync(bPath("src/presentation/routes/api"), (filepath) => {
    if (filepath.endsWith(".ts")) {
      let content = fs.readFileSync(filepath, "utf8");
      content = content.replace(
        /\.\.\/\.\.\/db\/index\.js/g,
        "../../../infrastructure/database/index.js",
      );
      content = content.replace(/\.\.\/\.\.\/db\/schema\.js/g, "../../../domain/schema.js");
      content = content.replace(/\.\.\/\.\.\/lib\//g, "../../../infrastructure/lib/");
      fs.writeFileSync(filepath, content);
    }
  });
}

// src/presentation/routes.ts
replaceInFile("src/presentation/routes.ts", [
  ["./routes/api", "./routes/api"], // nothing much to change unless it references db
]);
