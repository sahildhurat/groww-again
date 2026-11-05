import fs from "fs";
import path from "path";
import crypto from "crypto";

const ignorePatterns = [
  "node_modules",
  ".git",
  ".next",
  "private",
  ".env",
];

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    const relPath = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");

    if (ignorePatterns.some((p) => relPath.startsWith(p) || file === p)) {
      return;
    }

    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(relPath);
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(process.cwd()).sort();
console.log(`| File Path | SHA-256 Checksum |`);
console.log(`| --- | --- |`);

for (const file of files) {
  const content = fs.readFileSync(file);
  const hash = crypto.createHash("sha256").update(content).digest("hex");
  console.log(`| \`${file}\` | \`${hash}\` |`);
}

