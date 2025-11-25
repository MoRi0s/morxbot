import fs from "fs";
import path from "path";

export const jsonDB = {
  read(filePath) {
    try {
      if (!fs.existsSync(filePath)) return {};
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (e) {
      console.error("JSON read error:", e);
      return {};
    }
  },
  write(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("JSON write error:", e);
    }
  }
};
