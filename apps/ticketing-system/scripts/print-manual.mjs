import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "@playwright/test";

const localLibs = path.join(
  os.homedir(),
  ".local/playwright-libs/usr/lib/x86_64-linux-gnu",
);
if (fs.existsSync(localLibs)) {
  process.env.LD_LIBRARY_PATH = [localLibs, process.env.LD_LIBRARY_PATH ?? ""]
    .filter(Boolean)
    .join(":");
}

const manualDir = path.resolve("docs/manual");
const htmlPath = path.join(manualDir, "index.html");
const pdfPath = path.resolve("docs/aduts-user-manual.pdf");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  margin: { top: "16mm", bottom: "18mm", left: "16mm", right: "16mm" },
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate: `
    <div style="width:100%; font-size:9px; font-family:Georgia,serif; color:#5c574e; text-align:center; padding:0 16mm;">
      Adamson University Ticketing System
      <span class="pageNumber"></span> of <span class="totalPages"></span>
    </div>
  `,
});
await browser.close();
console.log(pdfPath);
