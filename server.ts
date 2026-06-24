import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { preseededUpdates } from "./src/data/historical_data";
import { defaultVendors } from "./src/data/vendors";
import { initialActiveCatalog } from "./src/data/active_catalog";
import type {
  ActiveCatalogModel,
  Vendor,
  SourceSnapshot,
  GapCheckResult,
  GapFlag,
  InventoryScanSession,
  FetchStatus,
} from "./src/types";

// ============================================================
// Bootstrap
// ============================================================
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
app.use(express.json({ limit: "256kb" }));

function readOnlyResponse(res: express.Response) {
  return res.status(403).json({
    error: "READ_ONLY_MODE",
    message:
      "此站目前為唯讀情報站。瀏覽、搜尋與篩選可用，但掃描、驗證、刪除與資料寫入功能已停用。",
  });
}

// ============================================================
// Gemini AI Client
// ============================================================
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({ apiKey });
}

const GEMINI_MODEL = "gemini-2.0-flash";

// ============================================================
// Persistent Data Store – Atomic File-based Persistence
// ============================================================
const DATA_STORE_PATH = path.join(process.cwd(), "data_store.json");
const DATA_STORE_TMP = DATA_STORE_PATH + ".tmp";
const DATA_STORE_BAK = DATA_STORE_PATH + ".bak";

interface DataStore {
  updates: any[];
  marketTrend: string;
  activeCatalog: ActiveCatalogModel[];
  vendors: Vendor[];
  sourceSnapshots: SourceSnapshot[];
  scanSessions: InventoryScanSession[];
}

let serverUpdates = [...preseededUpdates];
let serverMarketTrend =
  "各大 AI 廠牌正朝向「超低延遲」、「低成本推理模式（如 DeepSeek-R1、o3-mini）」與「極致超長上下文多模態處理（如 Gemini 2.5 Pro）」兩極化發展，這極大推動了 AI 開發者代理與自動化工作流的實用性。";
let serverActiveCatalog: ActiveCatalogModel[] = [...initialActiveCatalog];
let serverVendors: Vendor[] = [...defaultVendors];
let serverSourceSnapshots: SourceSnapshot[] = [];
let serverScanSessions: InventoryScanSession[] = [];

// Write queue: serialize all writes to avoid race conditions
let writeQueue: Promise<void> = Promise.resolve();

function enqueueWrite(): void {
  writeQueue = writeQueue.then(() => atomicWrite()).catch((e) => {
    console.error("[DataStore] Write queue error:", e);
  });
}

async function atomicWrite(): Promise<void> {
  const store: DataStore = {
    updates: serverUpdates,
    marketTrend: serverMarketTrend,
    activeCatalog: serverActiveCatalog,
    vendors: serverVendors,
    sourceSnapshots: serverSourceSnapshots,
    scanSessions: serverScanSessions,
  };
  const json = JSON.stringify(store, null, 2);

  try {
    // Backup existing file
    if (fs.existsSync(DATA_STORE_PATH)) {
      fs.copyFileSync(DATA_STORE_PATH, DATA_STORE_BAK);
    }
    // Write to temp file, then rename (atomic on POSIX; best-effort on Windows)
    await fs.promises.writeFile(DATA_STORE_TMP, json, "utf-8");
    await fs.promises.rename(DATA_STORE_TMP, DATA_STORE_PATH);
    console.log("[DataStore] Persisted successfully.");
  } catch (e) {
    console.error("[DataStore] Failed to persist data:", e);
    // Attempt to clean up tmp
    try {
      if (fs.existsSync(DATA_STORE_TMP)) fs.unlinkSync(DATA_STORE_TMP);
    } catch {}
  }
}

function saveData(): void {
  enqueueWrite();
}

// Load persisted data on startup
try {
  if (fs.existsSync(DATA_STORE_PATH)) {
    const raw = fs.readFileSync(DATA_STORE_PATH, "utf-8");
    const data: Partial<DataStore> = JSON.parse(raw);
    if (data.updates) serverUpdates = data.updates;
    if (data.marketTrend) serverMarketTrend = data.marketTrend;
    if (data.activeCatalog) serverActiveCatalog = data.activeCatalog;
    if (data.vendors) serverVendors = data.vendors;
    if (data.sourceSnapshots) serverSourceSnapshots = data.sourceSnapshots;
    if (data.scanSessions) serverScanSessions = data.scanSessions;
    console.log("[DataStore] Loaded persisted data from data_store.json");
  } else {
    saveData();
    console.log("[DataStore] Initialized data_store.json with defaults.");
  }
} catch (e) {
  console.error("[DataStore] Failed to load persisted data:", e);
}

// ============================================================
// Utility: Text Cleaning & Hashing
// ============================================================

function computeHash(text: string): string {
  return crypto.createHash("sha256").update(text, "utf-8").digest("hex");
}

function cleanText(raw: string): string {
  // Basic HTML tag removal and whitespace normalisation
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{3,}/g, "\n\n")
    .trim()
    .slice(0, 80000); // cap at ~80K chars to avoid huge LLM prompts
}

function normalizeModelId(vendorId: string, modelId: string): string {
  return `${vendorId}::${modelId.trim().toLowerCase().replace(/\s+/g, "-")}`;
}

// ============================================================
// Utility: Gap Check (pure program logic, NOT prompt-based)
// ============================================================

function runGapCheck(
  vendorId: string,
  snapshots: SourceSnapshot[],
  previousCatalogModelIds: string[]
): GapCheckResult[] {
  const results: GapCheckResult[] = [];

  // Build sets of model IDs per sourceType
  const byType: Record<string, Set<string>> = {};
  for (const snap of snapshots) {
    if (snap.fetchStatus !== "success") continue;
    if (!byType[snap.sourceType]) byType[snap.sourceType] = new Set();
    for (const mid of snap.extractedModelIds) {
      byType[snap.sourceType].add(mid.toLowerCase().trim());
    }
    for (const mid of snap.extractedPricingModelIds) {
      if (!byType["pricing_page"]) byType["pricing_page"] = new Set();
      byType["pricing_page"].add(mid.toLowerCase().trim());
    }
  }

  const modelsPage = byType["models_page"] ?? new Set<string>();
  const pricingPage = byType["pricing_page"] ?? new Set<string>();
  const apiRef = byType["api_reference"] ?? new Set<string>();
  const docs = byType["docs"] ?? new Set<string>();

  // All model IDs found in any source this scan
  const allFound = new Set<string>([
    ...modelsPage,
    ...pricingPage,
    ...apiRef,
    ...docs,
  ]);

  // All snapshot IDs for this vendor
  const snapIds = snapshots.map((s) => s.id);
  const detectedAt = new Date().toISOString();

  // pricing_page has model not in models_page
  for (const mid of pricingPage) {
    if (!modelsPage.has(mid)) {
      results.push({
        modelId: mid,
        vendorId,
        flags: ["pricing_not_in_models"],
        detectedAt,
        sourceSnapshotIds: snapIds,
      });
    }
  }

  // api_reference has model not in models_page
  for (const mid of apiRef) {
    if (!modelsPage.has(mid)) {
      const existing = results.find((r) => r.modelId === mid);
      if (existing) {
        existing.flags.push("api_ref_not_in_models");
      } else {
        results.push({
          modelId: mid,
          vendorId,
          flags: ["api_ref_not_in_models"],
          detectedAt,
          sourceSnapshotIds: snapIds,
        });
      }
    }
  }

  // docs has model not in models_page
  for (const mid of docs) {
    if (!modelsPage.has(mid)) {
      const existing = results.find((r) => r.modelId === mid);
      if (existing) {
        existing.flags.push("docs_not_in_models");
      } else {
        results.push({
          modelId: mid,
          vendorId,
          flags: ["docs_not_in_models"],
          detectedAt,
          sourceSnapshotIds: snapIds,
        });
      }
    }
  }

  // Old catalog model has disappeared from ALL sources
  for (const prevId of previousCatalogModelIds) {
    if (!allFound.has(prevId.toLowerCase().trim())) {
      const existing = results.find(
        (r) => r.modelId === prevId.toLowerCase().trim()
      );
      if (existing) {
        existing.flags.push("disappeared_from_all_sources");
      } else {
        results.push({
          modelId: prevId,
          vendorId,
          flags: ["disappeared_from_all_sources"],
          detectedAt,
          sourceSnapshotIds: snapIds,
        });
      }
    }
  }

  return results;
}

// ============================================================
// API Routes
// ============================================================

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    apiKeyConfigured: !!ai,
    model: GEMINI_MODEL,
    time: new Date().toISOString(),
    catalogCount: serverActiveCatalog.length,
    snapshotCount: serverSourceSnapshots.length,
  });
});

// 2. Historical updates
app.get("/api/historical", (_req, res) => {
  res.json({ updates: serverUpdates, marketTrendAnalysis: serverMarketTrend });
});

// 3. Active catalog
app.get("/api/active-catalog", (_req, res) => {
  res.json({ catalog: serverActiveCatalog });
});

// 4. Vendors
app.get("/api/vendors", (_req, res) => {
  res.json({ vendors: serverVendors });
});

// 5. Source Snapshots
app.get("/api/scan/snapshots", (_req, res) => {
  res.json({ snapshots: serverSourceSnapshots });
});

app.get("/api/scan/snapshots/:vendorId", (req, res) => {
  const { vendorId } = req.params;
  const filtered = serverSourceSnapshots.filter(
    (s) => s.vendorId === vendorId
  );
  res.json({ snapshots: filtered, vendorId });
});

// 6. Scan sessions
app.get("/api/scan/sessions", (_req, res) => {
  res.json({ sessions: serverScanSessions });
});

app.get("/AI_HANDOFF.md", (_req, res) => {
  res.type("text/markdown").sendFile(path.join(process.cwd(), "AI_HANDOFF.md"));
});

// ============================================================
// 7. Release Scan Pipeline (Google Search Grounding allowed)
// ============================================================
app.post("/api/scan/releases", async (req, res) => {
  return readOnlyResponse(res);

  if (!ai) {
    return res.status(400).json({
      error:
        "Gemini API 金鑰尚未設定或無效。請新增 GEMINI_API_KEY 環境變數。",
      code: "API_KEY_MISSING",
    });
  }

  const { keyword = "最新 AI 模型與發表技術", days = 7 } = req.body;

  try {
    // Lean prompt – short summaries only, no pre-generated deepDiveReport
    const searchPrompt = `請通過 Google Search Grounding 聯網，搜尋並整理最近 ${days} 天內各大 AI 廠商的最新發佈與重大更新。
關鍵字：${keyword}

搜尋範疇：OpenAI, Anthropic, Google DeepMind, Meta AI, DeepSeek, xAI, Mistral AI, Alibaba/FunASR, Hugging Face 等。
涵蓋範疇：新模型發佈、API 能力更新、收費變更、模型下架、開源發佈、研究突破。

每一個條目，請只產生精簡摘要（30-100 字），不需要長篇評估報告。
評估報告可由使用者按需生成。

請以 JSON 格式輸出：`;

    console.log(`[release_scan] Starting scan: keyword="${keyword}", days=${days}`);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            marketTrendAnalysis: {
              type: Type.STRING,
              description: "當前 AI 行業整體趨勢摘要（繁體中文，100-200 字）",
            },
            updates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  modelName: { type: Type.STRING },
                  vendor: { type: Type.STRING },
                  releaseDate: {
                    type: Type.STRING,
                    description: "YYYY-MM-DD",
                  },
                  category: {
                    type: Type.STRING,
                    description:
                      "reasoning | vision | audio | general | open-source | other",
                  },
                  summary: {
                    type: Type.STRING,
                    description: "30-100 字中文短摘要",
                  },
                  chineseDescription: {
                    type: Type.STRING,
                    description: "100-200 字中文介紹",
                  },
                  pricingModel: { type: Type.STRING },
                  keyFeatures: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  useCases: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  impactScore: {
                    type: Type.INTEGER,
                    description: "1-10",
                  },
                  targetAudience: { type: Type.STRING },
                  impactAssessment: { type: Type.STRING },
                  strategicAdvice: { type: Type.STRING },
                  sourceUrl: { type: Type.STRING },
                  eventType: {
                    type: Type.STRING,
                    description:
                      "new_model | model_update | pricing_change | api_change | deprecation | open_source | research | other",
                  },
                  needsDeepDive: {
                    type: Type.BOOLEAN,
                    description: "是否建議按需生成深度報告",
                  },
                },
                required: [
                  "modelName",
                  "vendor",
                  "releaseDate",
                  "category",
                  "summary",
                  "chineseDescription",
                  "pricingModel",
                  "keyFeatures",
                  "useCases",
                  "impactScore",
                  "targetAudience",
                  "impactAssessment",
                  "strategicAdvice",
                ],
              },
            },
          },
          required: ["marketTrendAnalysis", "updates"],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Gemini 回傳空資料。");

    const parsedData = JSON.parse(responseText.trim());

    if (parsedData.updates && Array.isArray(parsedData.updates)) {
      for (const update of parsedData.updates) {
        update.id =
          update.id ||
          `upd-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        const existsIdx = serverUpdates.findIndex(
          (e) => e.modelName.toLowerCase() === update.modelName.toLowerCase()
        );
        if (existsIdx !== -1) {
          serverUpdates[existsIdx] = { ...serverUpdates[existsIdx], ...update };
        } else {
          serverUpdates.unshift(update);
        }
      }
    }
    if (parsedData.marketTrendAnalysis) {
      serverMarketTrend = parsedData.marketTrendAnalysis;
    }

    // Update vendor lastReleaseScannedAt
    const now = new Date().toISOString();
    serverVendors = serverVendors.map((v) => ({
      ...v,
      lastReleaseScannedAt: now,
    }));

    saveData();
    res.json(parsedData);
  } catch (error: any) {
    console.error("[release_scan] Error:", error);
    res.status(500).json({
      error: "最新發佈掃描過程中發生錯誤，請稍後再試。",
      details: error.message || String(error),
    });
  }
});

// Backward-compatible alias – forward body to the releases handler
app.post("/api/scan", async (req, res) => {
  return readOnlyResponse(res);

  // Re-use the same logic as /api/scan/releases by making an internal fetch
  // Since we can't call app.handle directly, we just delegate to the releases route via redirect
  // or duplicate the minimal logic. Simplest: just set the url and use next().
  // We'll call the handler function pattern via Express router delegation.
  // Actually the cleanest approach: use the express router internally.
  const { keyword = "最新 AI 模型與發表技術", days = 7 } = req.body;
  req.body = { keyword, days };
  // Delegate: manually trigger same logic by treating this as a scan/releases
  const fakeReq = Object.assign({}, req, { url: "/api/scan/releases" });
  // Use a simple solution: re-dispatch through express
  app._router.handle(fakeReq as any, res, () => {
    res.status(404).json({ error: "Not found" });
  });
});

// ============================================================
// 8. Inventory Scan Pipeline (NO Google Search Grounding)
//    Step 1: Program fetches each sourceUrl → computes hash
//    Step 2: If hash changed → LLM extracts from cleanedText only
//    Step 3: Program runs gap check
//    Step 4: Merge into catalog with vendorId+normalizedModelId dedup
// ============================================================
app.post("/api/scan/inventory", async (req, res) => {
  return readOnlyResponse(res);

  if (!ai) {
    return res.status(400).json({
      error: "Gemini API 金鑰尚未設定或無效。請新增 GEMINI_API_KEY 環境變數。",
      code: "API_KEY_MISSING",
    });
  }

  const { vendorId } = req.body;
  const targetVendors = vendorId
    ? serverVendors.filter((v) => v.id === vendorId)
    : serverVendors.filter((v) => v.priority === "core");

  if (targetVendors.length === 0) {
    return res
      .status(400)
      .json({ error: "找不到指定廠商，或核心廠商清單為空。" });
  }

  const sessionId = `sess-${Date.now()}`;
  const session: InventoryScanSession = {
    id: sessionId,
    startedAt: new Date().toISOString(),
    vendorIds: targetVendors.map((v) => v.id),
    snapshotIds: [],
    newModelsFound: 0,
    modelsUpdated: 0,
    gapCheckResults: [],
    status: "running",
  };
  serverScanSessions.unshift(session);

  try {
    const allNewModels: any[] = [];
    const allGapResults: GapCheckResult[] = [];

    for (const vendor of targetVendors) {
      console.log(`[inventory_scan] Processing vendor: ${vendor.name}`);
      const vendorSnapshots: SourceSnapshot[] = [];

      // ----- Step 1: HTTP Fetch each sourceUrl -----
      for (const source of vendor.sourceUrls.filter(
        (s) => s.scanMode === "inventory" || s.scanMode === "pricing"
      )) {
        const snapId = `snap-${vendor.id}-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 4)}`;

        let fetchStatus: FetchStatus = "success";
        let httpStatus: number | undefined;
        let rawText = "";
        let cleanedText = "";
        let errorMessage: string | undefined;

        try {
          console.log(`[inventory_scan]   Fetching: ${source.url}`);
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15000);

          const fetchRes = await fetch(source.url, {
            signal: controller.signal,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (compatible; AI-Model-Radar/2.0; +https://github.com/kemscolor-afk/ai-model-radar)",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
            },
          });
          clearTimeout(timeout);

          httpStatus = fetchRes.status;
          if (!fetchRes.ok) {
            fetchStatus = "error";
            errorMessage = `HTTP ${fetchRes.status} ${fetchRes.statusText}`;
          } else {
            rawText = await fetchRes.text();
            cleanedText = cleanText(rawText);
          }
        } catch (fetchErr: any) {
          fetchStatus =
            fetchErr.name === "AbortError" ? "timeout" : "error";
          errorMessage = fetchErr.message || String(fetchErr);
          console.warn(
            `[inventory_scan]   Failed to fetch ${source.url}: ${errorMessage}`
          );
        }

        const contentHash = cleanedText ? computeHash(cleanedText) : "";

        // Check if we already have a snapshot for this URL with the same hash
        const prevSnap = serverSourceSnapshots.find(
          (s) => s.sourceUrl === source.url && s.contentHash === contentHash && contentHash !== ""
        );

        let llmExtractionRan = false;
        let extractedModelIds: string[] = [];
        let extractedPricingModelIds: string[] = [];
        let extractedDeprecatedModelIds: string[] = [];

        if (prevSnap && contentHash !== "") {
          // Hash unchanged – reuse previous extraction results
          fetchStatus = "skipped_no_change";
          extractedModelIds = prevSnap.extractedModelIds;
          extractedPricingModelIds = prevSnap.extractedPricingModelIds;
          extractedDeprecatedModelIds = prevSnap.extractedDeprecatedModelIds;
          console.log(
            `[inventory_scan]   Hash unchanged for ${source.url} – skipping LLM extraction.`
          );
        } else if (cleanedText && ai) {
          // Hash changed (or first time) – run LLM extraction on fetched text ONLY
          llmExtractionRan = true;
          console.log(
            `[inventory_scan]   Hash changed for ${source.url} – running LLM extraction.`
          );

          try {
            const extractPrompt = `你是 AI 型錄資料抽取專家。以下是從 ${vendor.name} 官方頁面（${source.url}）抓取的文字內容。

請從這段文字中抽取模型資訊。
重要規則：
1. 只能使用以下文字內容，不得自行搜尋或補充未在文字中出現的資訊。
2. 不得推測未在文字中明確列出的價格。
3. 如果文字中沒有明確說明，pricingStatus 必須設為 "official_not_found"。
4. modelId 必須是頁面中出現的精確識別符（如 gpt-4o, claude-3-7-sonnet-20250224）。

頁面文字內容（前 ${Math.min(cleanedText.length, 60000)} 字）：
---
${cleanedText.slice(0, 60000)}
---

請輸出 JSON：`;

            const extractResp = await ai.models.generateContent({
              model: GEMINI_MODEL,
              contents: extractPrompt,
              // NO googleSearch tool – inventory_scan must not use it
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    models: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          modelId: { type: Type.STRING },
                          displayName: { type: Type.STRING },
                          aliases: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                          },
                          status: {
                            type: Type.STRING,
                            description:
                              "active | preview | beta | legacy | deprecated | research_only | possibly_deprecated | unknown",
                          },
                          availability: {
                            type: Type.STRING,
                            description:
                              "ga | preview | beta | private_preview | deprecated | research_only | unknown",
                          },
                          primaryModality: {
                            type: Type.STRING,
                            description:
                              "language | image | video | audio | embedding | reranking | tts | asr | multimodal | unknown",
                          },
                          capabilities: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                          },
                          inputTypes: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                          },
                          outputTypes: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                          },
                          contextWindow: { type: Type.STRING },
                          pricing: {
                            type: Type.OBJECT,
                            properties: {
                              pricingModel: {
                                type: Type.STRING,
                                description:
                                  "pay-as-you-go | flat-rate | free | tiered | unknown",
                              },
                              input1m: { type: Type.STRING },
                              output1m: { type: Type.STRING },
                              cachedInput1m: { type: Type.STRING },
                              pricingStatus: {
                                type: Type.STRING,
                                description:
                                  "official_found | official_not_found | ambiguous | not_applicable",
                              },
                              pricingSourceUrl: { type: Type.STRING },
                              pricingDetails: { type: Type.STRING },
                            },
                            required: [
                              "pricingModel",
                              "input1m",
                              "output1m",
                              "pricingStatus",
                            ],
                          },
                          summaryZh: {
                            type: Type.STRING,
                            description:
                              "繁體中文模型規格與當前狀態簡介（50-150字）",
                          },
                          notes: { type: Type.STRING },
                          confidence: {
                            type: Type.STRING,
                            description: "high | medium | low",
                          },
                          reviewStatus: {
                            type: Type.STRING,
                            description:
                              "auto_verified | needs_review | manually_verified | ignored",
                          },
                          isInPricingTable: {
                            type: Type.BOOLEAN,
                            description:
                              "此模型是否出現在 pricing 表格中（僅供 pricing_page 使用）",
                          },
                          isDeprecated: {
                            type: Type.BOOLEAN,
                            description: "此模型是否被標記為已退役",
                          },
                        },
                        required: [
                          "modelId",
                          "displayName",
                          "status",
                          "availability",
                          "primaryModality",
                          "pricing",
                          "summaryZh",
                          "confidence",
                          "reviewStatus",
                        ],
                      },
                    },
                  },
                  required: ["models"],
                },
              },
            });

            const extractText = extractResp.text;
            if (extractText) {
              const extracted = JSON.parse(extractText.trim());
              if (extracted.models && Array.isArray(extracted.models)) {
                for (const m of extracted.models) {
                  if (m.modelId) {
                    extractedModelIds.push(m.modelId);
                    if (m.isInPricingTable) {
                      extractedPricingModelIds.push(m.modelId);
                    }
                    if (m.isDeprecated || m.status === "deprecated") {
                      extractedDeprecatedModelIds.push(m.modelId);
                    }
                  }
                }
                allNewModels.push(
                  ...extracted.models.map((m: any) => ({
                    ...m,
                    vendorId: vendor.id,
                    vendorName: vendor.name,
                    officialSourceUrls: [source.url],
                    pricingSourceUrl:
                      source.sourceType === "pricing_page"
                        ? source.url
                        : undefined,
                  }))
                );
              }
            }
          } catch (llmErr: any) {
            console.error(
              `[inventory_scan]   LLM extraction error for ${source.url}:`,
              llmErr
            );
            errorMessage = `LLM extraction failed: ${llmErr.message}`;
          }
        }

        const snap: SourceSnapshot = {
          id: snapId,
          vendorId: vendor.id,
          vendorName: vendor.name,
          sourceUrl: source.url,
          sourceType: source.sourceType,
          trustLevel: source.trustLevel,
          scanMode: source.scanMode,
          fetchedAt: new Date().toISOString(),
          fetchStatus,
          httpStatus,
          contentHash,
          cleanedText:
            cleanedText.length > 20000
              ? cleanedText.slice(0, 20000) + "\n[TRUNCATED]"
              : cleanedText,
          extractedModelIds,
          extractedPricingModelIds,
          extractedDeprecatedModelIds,
          errorMessage,
          llmExtractionRan,
          scanSessionId: sessionId,
        };

        vendorSnapshots.push(snap);
        serverSourceSnapshots.push(snap);
        session.snapshotIds.push(snapId);
      }

      // ----- Step 3: Program-level Gap Check -----
      const prevCatalogForVendor = serverActiveCatalog
        .filter((m) => m.vendorId === vendor.id)
        .map((m) => m.modelId || "");

      const gapResults = runGapCheck(
        vendor.id,
        vendorSnapshots,
        prevCatalogForVendor
      );
      allGapResults.push(...gapResults);
      session.gapCheckResults.push(...gapResults);

      // Update vendor lastInventoryScannedAt
      const vIdx = serverVendors.findIndex((v) => v.id === vendor.id);
      if (vIdx !== -1) {
        const now = new Date().toISOString();
        serverVendors[vIdx] = {
          ...serverVendors[vIdx],
          lastScannedAt: now,
          lastInventoryScannedAt: now,
        };
      }
    }

    // ----- Step 4: Merge into catalog with vendorId+normalizedModelId dedup -----
    const updatedCatalog = [...serverActiveCatalog];
    let newCount = 0;
    let updatedCount = 0;

    for (const model of allNewModels) {
      const normKey = normalizeModelId(model.vendorId, model.modelId);

      const existingIdx = updatedCatalog.findIndex(
        (m) => normalizeModelId(m.vendorId || "", m.modelId || "") === normKey
      );

      // Determine gap flags for this model
      const modelGapFlags = allGapResults
        .filter(
          (g) =>
            g.vendorId === model.vendorId &&
            g.modelId.toLowerCase().trim() === model.modelId.toLowerCase().trim()
        )
        .flatMap((g) => g.flags);

      // Set reviewStatus from gap flags
      let reviewStatus = model.reviewStatus || "auto_verified";
      if (modelGapFlags.length > 0) {
        reviewStatus = "needs_review";
      }

      // Set pricingStatus
      let pricingStatus = model.pricing?.pricingStatus || "official_not_found";
      if (modelGapFlags.includes("pricing_source_missing")) {
        pricingStatus = "official_not_found";
      }

      // Set status for disappeared models
      let status = model.status || "active";
      if (modelGapFlags.includes("disappeared_from_all_sources")) {
        status = "possibly_deprecated";
        reviewStatus = "needs_review";
      }

      // Determine fallback category
      let fallbackCategory: "reasoning" | "vision" | "audio" | "general" | "open-source" | "other" = "general";
      if (model.capabilities?.includes("reasoning")) {
        fallbackCategory = "reasoning";
      } else if (["image", "video", "vision"].includes(model.primaryModality)) {
        fallbackCategory = "vision";
      } else if (["audio", "tts", "asr", "music"].includes(model.primaryModality)) {
        fallbackCategory = "audio";
      } else if (model.pricing?.pricingModel === "free") {
        fallbackCategory = "open-source";
      }

      const snapIds = serverSourceSnapshots
        .filter(
          (s) =>
            s.vendorId === model.vendorId &&
            s.extractedModelIds.includes(model.modelId)
        )
        .map((s) => s.id);

      const isNew = existingIdx === -1;

      const mergedModel: ActiveCatalogModel = {
        id: isNew
          ? `act-${model.vendorId}-${model.modelId.replace(/[^a-z0-9]/gi, "-")}-${Date.now()}`
          : updatedCatalog[existingIdx].id,
        vendorId: model.vendorId,
        vendorName: model.vendorName,
        modelId: model.modelId,
        displayName: model.displayName,
        aliases: model.aliases || [],
        status,
        availability: model.availability || "ga",
        primaryModality: model.primaryModality || "language",
        capabilities: model.capabilities || [],
        inputTypes: model.inputTypes || ["text"],
        outputTypes: model.outputTypes || ["text"],
        contextWindow: model.contextWindow || "128k",
        pricing: {
          pricingModel: model.pricing?.pricingModel || "unknown",
          input1m: model.pricing?.input1m || "N/A",
          output1m: model.pricing?.output1m || "N/A",
          cachedInput1m: model.pricing?.cachedInput1m,
          pricingStatus,
          pricingSourceUrl:
            model.pricing?.pricingSourceUrl || model.pricingSourceUrl,
          pricingDetails: model.pricing?.pricingDetails,
        },
        officialSourceUrls: model.officialSourceUrls || [],
        pricingSourceUrl: model.pricingSourceUrl,
        firstSeenSourceUrl: isNew
          ? model.officialSourceUrls?.[0] || ""
          : updatedCatalog[existingIdx].firstSeenSourceUrl || "",
        firstSeenAt: isNew
          ? new Date().toISOString()
          : updatedCatalog[existingIdx].firstSeenAt || new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString(),
        summaryZh: model.summaryZh || "",
        notes: model.notes || "",
        confidence: model.confidence || "medium",
        reviewStatus,
        sourceSnapshotIds: snapIds,
        gapFlags: modelGapFlags,
        newlyFound: isNew,

        // Legacy fallback fields
        modelName: model.displayName,
        vendor: model.vendorName,
        releaseDate: isNew
          ? new Date().toISOString().split("T")[0]
          : updatedCatalog[existingIdx].releaseDate || new Date().toISOString().split("T")[0],
        category: fallbackCategory,
        pricingInput:
          typeof model.pricing?.input1m === "number"
            ? `$${model.pricing.input1m.toFixed(2)} / 1M tokens`
            : String(model.pricing?.input1m || "N/A"),
        pricingOutput:
          typeof model.pricing?.output1m === "number"
            ? `$${model.pricing.output1m.toFixed(2)} / 1M tokens`
            : String(model.pricing?.output1m || "N/A"),
        keyFeatures: model.capabilities || [],
        deprecatedReplacements: isNew
          ? ""
          : updatedCatalog[existingIdx].deprecatedReplacements || "",
        chineseDescription: model.summaryZh || "",
      };

      if (isNew) {
        updatedCatalog.unshift(mergedModel);
        newCount++;
      } else {
        updatedCatalog[existingIdx] = mergedModel;
        updatedCount++;
      }
    }

    // Mark disappeared models in existing catalog
    for (const gapResult of allGapResults) {
      if (gapResult.flags.includes("disappeared_from_all_sources")) {
        const idx = updatedCatalog.findIndex(
          (m) =>
            m.vendorId === gapResult.vendorId &&
            (m.modelId || "").toLowerCase().trim() === gapResult.modelId
        );
        if (idx !== -1 && updatedCatalog[idx].status !== "deprecated") {
          updatedCatalog[idx] = {
            ...updatedCatalog[idx],
            status: "possibly_deprecated",
            reviewStatus: "needs_review",
            gapFlags: [
              ...(updatedCatalog[idx].gapFlags || []),
              "disappeared_from_all_sources",
            ],
          };
        }
      }
    }

    serverActiveCatalog = updatedCatalog;
    session.newModelsFound = newCount;
    session.modelsUpdated = updatedCount;
    session.completedAt = new Date().toISOString();
    session.status = "completed";

    // Trim old snapshots (keep last 500 per vendor to save disk)
    const SNAPSHOT_LIMIT = 500;
    if (serverSourceSnapshots.length > SNAPSHOT_LIMIT * targetVendors.length + 200) {
      serverSourceSnapshots = serverSourceSnapshots.slice(-SNAPSHOT_LIMIT);
    }

    saveData();

    res.json({
      success: true,
      sessionId,
      scannedVendors: targetVendors.map((v) => v.name),
      snapshotsCreated: session.snapshotIds.length,
      newModelsFound: newCount,
      modelsUpdated: updatedCount,
      totalCatalogCount: serverActiveCatalog.length,
      gapCheckResults: allGapResults,
    });
  } catch (error: any) {
    console.error("[inventory_scan] Error:", error);
    session.status = "error";
    session.errorMessage = error.message;
    session.completedAt = new Date().toISOString();
    saveData();
    res.status(500).json({
      error: "型錄盤點掃描過程中發生錯誤，請稍後再試。",
      details: error.message || String(error),
    });
  }
});

// ============================================================
// 9. Verify Deprecated (uses Google Search Grounding)
// ============================================================
app.post("/api/verify-deprecated", async (req, res) => {
  return readOnlyResponse(res);

  if (!ai) {
    return res.status(400).json({
      error: "Gemini API 金鑰尚未設定。請新增 GEMINI_API_KEY。",
      code: "API_KEY_MISSING",
    });
  }

  const { modelName, vendor } = req.body;
  if (!modelName || !vendor) {
    return res
      .status(400)
      .json({ error: "請提供模型名稱與廠商名稱。" });
  }

  try {
    const prompt = `請使用 Google Search 核實以下 AI 模型的當前存活狀態：
- 模型名稱：${modelName}
- 開發廠商：${vendor}

請確認該模型目前是否仍在役（active）、已老舊（legacy）或已下架（deprecated）。
嚴格以 JSON 格式回覆。`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            modelName: { type: Type.STRING },
            vendor: { type: Type.STRING },
            status: {
              type: Type.STRING,
              description: "active | legacy | deprecated",
            },
            officialRetireDate: { type: Type.STRING },
            chineseDescription: { type: Type.STRING },
            deprecatedReplacements: { type: Type.STRING },
            pricingInput: { type: Type.STRING },
            pricingOutput: { type: Type.STRING },
            contextWindow: { type: Type.STRING },
            keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            "modelName",
            "vendor",
            "status",
            "officialRetireDate",
            "chineseDescription",
            "deprecatedReplacements",
            "pricingInput",
            "pricingOutput",
            "contextWindow",
            "keyFeatures",
          ],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Gemini 回傳空資料。");
    res.json(JSON.parse(text.trim()));
  } catch (error: any) {
    console.error("[verify-deprecated] Error:", error);
    res.status(500).json({
      error: "核對模型狀態過程中發生錯誤，請稍後再試。",
      details: error.message || String(error),
    });
  }
});

// ============================================================
// 10. Deep-dive Report (on-demand, NOT pre-generated)
// ============================================================
app.post("/api/assess-deep", async (req, res) => {
  return readOnlyResponse(res);

  if (!ai) {
    return res.status(400).json({
      error: "Gemini API 金鑰尚未設定。請新增 GEMINI_API_KEY。",
      code: "API_KEY_MISSING",
    });
  }

  const { modelUpdate } = req.body;
  if (!modelUpdate) {
    return res.status(400).json({ error: "缺少模型更新資料以進行評估。" });
  }

  try {
    const deepPrompt = `你是頂尖的 AI 戰略分析師。請針對以下 AI 技術發表，撰寫深度影響力評估報告。

模型資訊：
- 名稱：${modelUpdate.modelName}
- 廠商：${modelUpdate.vendor}
- 發表日期：${modelUpdate.releaseDate}
- 中文介紹：${modelUpdate.chineseDescription || modelUpdate.summary}
- 收費模式：${modelUpdate.pricingModel}
- 核心特點：${(modelUpdate.keyFeatures || []).join(", ")}
- 影響力分數：${modelUpdate.impactScore}/10

請以繁體中文（zh-TW）、Markdown 格式輸出。包含：
1. **技術定位與競品對比**
2. **商業成本與效益分析 (ROI)**
3. **對軟體工程與自動化的革命性影響**
4. **資訊安全與隱私風險評估**
5. **短期與中長期企業採用戰略路徑**

字數 1000-1500 字，結構分明。`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: deepPrompt,
    });

    res.json({ report: response.text });
  } catch (error: any) {
    console.error("[assess-deep] Error:", error);
    res.status(500).json({
      error: "生成深度評估報告時發生錯誤，請稍後再試。",
      details: error.message || String(error),
    });
  }
});

// ============================================================
// Frontend Serving
// ============================================================
if (process.env.NODE_ENV !== "production") {
  import("vite").then(async (viteModule) => {
    const vite = await viteModule.createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[AI Model Radar] Server running on port ${PORT}`);
  console.log(`[AI Model Radar] API Key configured: ${!!ai}`);
  console.log(
    `[AI Model Radar] Catalog: ${serverActiveCatalog.length} models, ${serverSourceSnapshots.length} snapshots`
  );
});
