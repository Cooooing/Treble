import fs from "fs";

export function json(data: any, msg = '', code = 0) {
  return JSON.stringify({
    code,
    msg,
    data,
  });
}

const handles: any[] = [];
const files = fs.readdirSync(`./server/handlers`);
for (const file of files) {
  if (file.startsWith("index.") || (!file.endsWith(".ts") && !file.endsWith(".js"))) continue;
  const handleModule = await import(/* @vite-ignore */`./${file}`).then(mod => mod);
  console.log(file, handleModule);
  handles.push(...handleModule.default||[]);
}

export default handles;