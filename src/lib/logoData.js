import fs from "fs";
import path from "path";

export function getLogoBuffer() {
  const logoPath = path.join(process.cwd(), "public/logo.png");
  return fs.readFileSync(logoPath);
}
