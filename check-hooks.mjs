import { chromium } from "playwright";

const proc = Bun ? null : null; // just need playwright
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error" || msg.type() === "warning") {
    errors.push({ type: msg.type(), text: msg.text() });
  }
});
page.on("pageerror", (err) => errors.push({ type: "error", text: err.message }));

await page.goto("http://localhost:5201", { waitUntil: "networkidle", timeout: 20000 });
await new Promise((r) => setTimeout(r, 3000));

console.log(JSON.stringify(errors));
await browser.close();