import fs from "fs";
import path from "path";

export function loadFlow(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function getNextNode(flow, nodeKey) {
  return flow[nodeKey];
}

export function isResult(value) {
  return value.startsWith("RESULT:");
}

export function extractResult(value) {
  return value.replace("RESULT:", "");
}
