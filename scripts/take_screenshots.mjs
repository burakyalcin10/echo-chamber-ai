import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "docs", "screenshots");
const BASE = "http://localhost:3000";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function doMatch(page, text) {
  await page.locator("nav a, nav button").filter({ hasText: /match/i }).first().click().catch(() => {});
  await wait(500);
  const input = page.locator("input[type=text], textarea").last();
  await input.click();
  await input.fill(text);
  await wait(200);
  await page.keyboard.press("Enter");
  // Wait for result card
  await page.waitForSelector("text=/warren|zevon|clapton|dylan|guns|%, matched/i", { timeout: 14000 }).catch(() => {});
  await wait(1200);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // ── 1. Galaxy explore view ────────────────────────────────────────────────
  console.log("1/4  galaxy overview...");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await wait(5500);
  await page.screenshot({ path: `${OUT}/01_galaxy.png` });

  // ── 2. Cover detail panel — use match result which selects a cover ─────────
  console.log("2/4  cover detail via match...");
  await doMatch(page, "Letting go of who I used to be, stepping through the unknown.");
  // Crop to just the right panel area
  await page.screenshot({ path: `${OUT}/02_cover_detail.png` });

  // ── 3. Galaxy with emotional edges filtered ───────────────────────────────
  console.log("3/4  emotional edges...");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await wait(5000);
  // Click Emotional filter in TopBar relationship selector
  const emotionalBtn = page.locator("button, [role=button]").filter({ hasText: /^emotional$/i }).first();
  await emotionalBtn.click().catch(async () => {
    // fallback: look for the selector dropdown or any button
    await page.locator("select").selectOption("emotional").catch(() => {});
  });
  await wait(800);
  // Rotate camera slightly for depth
  const box = await page.locator("canvas").first().boundingBox();
  if (box) {
    const cx = box.x + box.width * 0.47;
    const cy = box.y + box.height * 0.5;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 110, cy - 45, { steps: 20 });
    await page.mouse.up();
  }
  await wait(1000);
  await page.screenshot({ path: `${OUT}/03_emotional_edges.png` });

  // ── 4. Match result full view ─────────────────────────────────────────────
  console.log("4/4  match result...");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await wait(3500);
  await doMatch(page, "I carried something for years that I can no longer hold.");
  await page.screenshot({ path: `${OUT}/04_match_result.png` });

  await browser.close();
  console.log("Done — docs/screenshots/");
}

run().catch((e) => { console.error(e); process.exit(1); });
