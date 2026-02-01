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

// カルーセル用キャプチャ対象ページ（動的IDを使用）
// pathにプレースホルダーを含む場合、動的IDで置換する
// fallbackは動的IDが取得できなかった場合の代替パス
const CAROUSEL_PAGES = [
  {
    name: "carousel-01-inquiry",
    path: "/admin/inquiries",
    label: "反響一覧",
    waitFor: 3000,
  },
  {
    name: "carousel-02-customer",
    pathTemplate: "/customers/{customerId}",
    fallback: "/customers",
    label: "顧客詳細",
    waitFor: 3000,
  },
  {
    name: "carousel-03-customer-page",
    pathTemplate: "/customer/{accessToken}",
    fallback: "/admin/customer-accesses",
    label: "顧客マイページ",
    waitFor: 3000,
    skipLoginCheck: true, // 公開ルートのためログインリダイレクトチェック不要
  },
  {
    name: "carousel-04-vr-staging",
    pathTemplate: "/room/{vrTourRoomId}/vr-tour/{vrTourId}/viewer",
    fallback: "/vr-tours",
    label: "VRツアー＆バーチャルステージング",
    waitFor: 5000,
  },
  {
    name: "carousel-05-ai-content",
    pathTemplate: "/room/{publicationRoomId}/property-publication/{publicationId}/edit",
    fallback: "/admin/publications",
    label: "AI画像編集＆コンテンツ作成",
    waitFor: 4000,
  },
  {
    name: "carousel-06-gis-map",
    path: "/map",
    label: "GISマップ物件管理",
    waitFor: 5000,
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

  // カルーセル用スクリーンショットのキャプチャ
  console.log("\nカルーセル用スクリーンショットをキャプチャ中...");

  // 動的IDの取得
  const dynamicIds = await page.evaluate(async () => {
    const results = {};
    try {
      // 顧客ID
      const custRes = await fetch("/api/v1/customers");
      const custData = await custRes.json();
      results.customerId = custData?.customers?.[0]?.id || custData?.[0]?.id;
    } catch (e) { console.error("顧客ID取得失敗:", e); }
    try {
      // 顧客アクセストークン
      const accRes = await fetch("/api/v1/customer_accesses");
      const accData = await accRes.json();
      const accesses = accData?.customer_accesses || accData || [];
      results.accessToken = accesses.find((a) => a.access_token)?.access_token;
    } catch (e) { console.error("アクセストークン取得失敗:", e); }
    try {
      // VRツアー
      const vrRes = await fetch("/api/v1/vr_tours");
      const vrData = await vrRes.json();
      const tours = vrData?.vr_tours || vrData || [];
      if (tours[0]) {
        results.vrTourId = tours[0].id;
        results.vrTourRoomId = tours[0].room_id;
      }
    } catch (e) { console.error("VRツアーID取得失敗:", e); }
    try {
      // 物件公開ページ
      const pubRes = await fetch("/api/v1/property_publications");
      const pubData = await pubRes.json();
      const pubs = pubData?.property_publications || pubData || [];
      if (pubs[0]) {
        results.publicationId = pubs[0].publication_id;
        results.publicationRoomId = pubs[0].room_id;
      }
    } catch (e) { console.error("物件公開ID取得失敗:", e); }
    return results;
  });

  console.log("動的ID:", dynamicIds);

  for (const pageInfo of CAROUSEL_PAGES) {
    try {
      // パスの解決: pathTemplate がある場合は動的IDで置換
      let pagePath = pageInfo.path;
      if (pageInfo.pathTemplate) {
        pagePath = pageInfo.pathTemplate.replace(
          /\{(\w+)\}/g,
          (_, key) => dynamicIds[key] || ""
        );
        // プレースホルダーが未解決（空文字が残る）場合はフォールバック
        if (pagePath.includes("//") || pagePath.endsWith("/")) {
          console.log(`  ${pageInfo.label}: 動的ID未取得のためフォールバック → ${pageInfo.fallback}`);
          pagePath = pageInfo.fallback;
        }
      }

      console.log(`  ${pageInfo.label}: ${pagePath} をキャプチャ中...`);
      await page.goto(`${BASE_URL}${pagePath}`, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });
      await new Promise((r) => setTimeout(r, pageInfo.waitFor));

      // ログインページにリダイレクトされていないか確認（skipLoginCheckの場合はスキップ）
      if (!pageInfo.skipLoginCheck && page.url().includes("/login")) {
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
