#!/usr/bin/env node
/**
 * ランディングページ用スクリーンショット自動キャプチャスクリプト
 *
 * 使い方: node scripts/capture-screenshots.mjs
 * 前提: bin/dev でサーバーが起動していること
 */
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, "../public/screenshots");
// lvh.me はローカルで 127.0.0.1 に解決される。サブドメインでテナント識別。
const BASE_URL = "http://sample.lvh.me:3000";
const VIEWPORT = { width: 1280, height: 800 };

const CREDENTIALS = {
  email: "admin@example.com",
  password: "password123",
};

// キャプチャ対象ページ
const PAGES = [
  {
    name: "01-home",
    path: "/home",
    label: "ホームダッシュボード",
    waitFor: 3000,
  },
  {
    name: "02-map",
    path: "/map",
    label: "GISマップシステム",
    waitFor: 5000,
  },
  {
    name: "03-building-detail2",
    path: "/building/5",
    label: "建物詳細(2)",
    waitFor: 4000,
  },
  {
    name: "04-building-detail",
    path: "/building/3",
    label: "建物詳細",
    waitFor: 4000,
  },
  {
    name: "05-room-detail",
    path: "/room/1",
    label: "部屋詳細",
    waitFor: 4000,
  },
];

/** MUI TextFieldにReact互換で値をセットする */
async function setInputValue(page, selector, value) {
  await page.evaluate(
    (sel, val) => {
      const input = document.querySelector(sel);
      if (!input) throw new Error(`Element not found: ${sel}`);
      // React のファイバーから setter を取得して state を更新
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      ).set;
      nativeInputValueSetter.call(input, val);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    },
    selector,
    value
  );
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("ブラウザを起動中...");
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--window-size=1280,800",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  // ログイン: API経由でセッションを取得
  console.log("ログイン中...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });

  const loginResult = await page.evaluate(async (creds) => {
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds),
    });
    const text = await res.text();
    try {
      return { status: res.status, body: JSON.parse(text) };
    } catch {
      return { status: res.status, body: text.substring(0, 200) };
    }
  }, CREDENTIALS);

  if (loginResult.status !== 200) {
    console.error("ログイン失敗:", loginResult.status, loginResult.body);
    await browser.close();
    process.exit(1);
  }
  console.log(`ログイン成功: ${loginResult.body?.user?.name || "OK"}`);

  // ページを再読み込みしてセッションを反映
  await page.goto(`${BASE_URL}/home`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 2000));
  console.log(`現在のURL: ${page.url()}`);

  if (page.url().includes("/login")) {
    // セッションが反映されていない場合、フォーム経由でログインを試行
    console.log("セッション未反映、フォーム経由でログインを再試行...");
    await page.waitForSelector("#email", { timeout: 10000 });
    await setInputValue(page, "#email", CREDENTIALS.email);
    await setInputValue(page, "#password", CREDENTIALS.password);
    await new Promise((r) => setTimeout(r, 500));
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 5000));
    console.log(`再試行後のURL: ${page.url()}`);
  }

  // 各ページをキャプチャ
  for (const pageInfo of PAGES) {
    try {
      console.log(`  ${pageInfo.label}: ${pageInfo.path} をキャプチャ中...`);
      await page.goto(`${BASE_URL}${pageInfo.path}`, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });
      await new Promise((r) => setTimeout(r, pageInfo.waitFor));

      // ログインページにリダイレクトされていないか確認
      if (page.url().includes("/login")) {
        console.error(`  ✗ ${pageInfo.label}: ログインページにリダイレクトされました`);
        continue;
      }

      const outputPath = resolve(OUTPUT_DIR, `${pageInfo.name}.png`);
      await page.screenshot({ path: outputPath, fullPage: false });
      console.log(`  ✓ ${outputPath}`);
    } catch (err) {
      console.error(`  ✗ ${pageInfo.label}: ${err.message}`);
    }
  }

  await browser.close();
  console.log("\n完了！スクリーンショットは public/screenshots/ に保存されました。");
}

main().catch((err) => {
  console.error("エラー:", err);
  process.exit(1);
});
