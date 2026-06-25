// ============================================================
// AI Model Radar – Type Definitions
// ============================================================

// ----------------------------
// Release / News Pipeline Types
// ----------------------------

export interface AIModelUpdate {
  id: string;
  modelName: string;
  vendor: string; // OpenAI, Google, Anthropic, Meta, DeepSeek, xAI, Microsoft, etc.
  releaseDate: string; // YYYY-MM-DD
  chineseDescription: string; // 中文詳細介紹
  pricingModel: string; // 收費模式與定價 (e.g., $2.50 / 1M tokens, 訂閱制, 開源免費)
  keyFeatures: string[]; // 核心技術特點
  useCases: string[]; // 適合場景
  impactScore: number; // 影響力分數 (1-10)
  targetAudience: string; // 受影響群體 (開發者, 企業, AI從業者, 一般大眾等)
  impactAssessment: string; // 針對性影響力評估
  strategicAdvice: string; // 建議與因應策略
  sourceUrl?: string; // 參考來源連結
  category: "reasoning" | "vision" | "audio" | "general" | "open-source" | "other"; // 模型分類
  deepDiveReport?: string; // 針對性深度評估報告（按需生成，非預先生成）
  // release_scan short summary fields
  summary?: string; // 短摘要（50-100 字）
  eventType?: "new_model" | "model_update" | "pricing_change" | "api_change" | "deprecation" | "open_source" | "research" | "other";
  needsDeepDive?: boolean; // 是否值得按需生成深度報告
}

// ----------------------------
// Vendor Source Configuration
// ----------------------------

export interface VendorSource {
  url: string;
  sourceType: "models_page" | "pricing_page" | "api_reference" | "docs" | "model_card" | "blog" | "changelog" | "github" | "huggingface" | "media";
  trustLevel: "official" | "platform" | "media";
  scanMode: "inventory" | "pricing" | "release" | "news";
}

export interface VendorProductLine {
  name: string;
  description: string;
  modalities: PrimaryModality[];
  sourceUrls: VendorSource[];
}

export interface Vendor {
  id: string;
  name: string;
  website: string;
  priority: "core" | "important" | "watch";
  sourceUrls: VendorSource[];
  productLines?: VendorProductLine[];
  lastScannedAt?: string;
  lastInventoryScannedAt?: string;
  lastReleaseScannedAt?: string;
}

// ----------------------------
// Source Snapshot (inventory_scan 抓取紀錄)
// ----------------------------

export type FetchStatus = "success" | "error" | "timeout" | "skipped_no_change";

export interface SourceSnapshot {
  id: string;
  vendorId: string;
  vendorName: string;
  sourceUrl: string;
  sourceType: VendorSource["sourceType"];
  trustLevel: VendorSource["trustLevel"];
  scanMode: VendorSource["scanMode"];
  fetchedAt: string; // ISO timestamp
  fetchStatus: FetchStatus;
  httpStatus?: number;
  contentHash: string; // SHA-256 hex of cleaned text
  cleanedText?: string; // Fetched and cleaned page text (may be truncated for storage)
  extractedModelIds: string[]; // Model IDs extracted by LLM from this source
  extractedPricingModelIds: string[]; // Model IDs found in pricing tables
  extractedDeprecatedModelIds: string[]; // Model IDs flagged as deprecated
  errorMessage?: string;
  // Whether LLM extraction was run for this snapshot
  llmExtractionRan: boolean;
  // Reference to scan session
  scanSessionId: string;
}

// ----------------------------
// Gap Check Results
// ----------------------------

export type GapFlag =
  | "pricing_not_in_models"       // pricing_page 有此 modelId，models_page 沒有
  | "api_ref_not_in_models"       // api_reference 有，models_page 沒有
  | "docs_not_in_models"          // docs 有，models_page 沒有
  | "disappeared_from_all_sources" // 舊型錄有，本次所有來源都消失
  | "pricing_source_missing";     // 該模型存在但 pricing source 沒有找到

export interface GapCheckResult {
  modelId: string;
  vendorId: string;
  flags: GapFlag[];
  detectedAt: string;
  sourceSnapshotIds: string[];
}

// ----------------------------
// Active Model Catalog Types
// ----------------------------

export type ModelStatus =
  | "active"
  | "preview"
  | "beta"
  | "legacy"
  | "deprecated"
  | "research_only"
  | "possibly_deprecated"
  | "unknown";

export type ModelAvailability =
  | "ga"
  | "preview"
  | "beta"
  | "private_preview"
  | "deprecated"
  | "research_only"
  | "unknown";

export type PrimaryModality =
  | "language"
  | "image"
  | "video"
  | "audio"
  | "embedding"
  | "reranking"
  | "tts"
  | "asr"
  | "music"
  | "robotics"
  | "multimodal"
  | "unknown"
  // Legacy values kept for backward compat
  | "text"
  | "vision"
  | "other";

export type PricingStatus =
  | "official_found"
  | "official_not_found"
  | "ambiguous"
  | "not_applicable";

export type LifecycleStatus =
  | "discovered"
  | "source_verified"
  | "published"
  | "deprecated"
  | "retired"
  | "unknown";

export type DataQuality =
  | "verified"
  | "pricing_unverified"
  | "needs_review"
  | "source_missing"
  | "data_dirty"
  | "retired_confirmed";

export type AvailableVia =
  | "api"
  | "web"
  | "open_weights"
  | "hosted_platform";

export interface AiModelPricing {
  pricingModel: "pay-as-you-go" | "flat-rate" | "free" | "tiered" | "unknown";
  input1m: number | string; // 收費費率，如 2.50 或 "開源免費"
  output1m: number | string;
  cachedInput1m?: number | string;
  /** Replaces the old "estimated" / "official" / "unknown" */
  pricingStatus: PricingStatus;
  pricingSourceUrl?: string; // 價格資訊的官方來源 URL
  pricingDetails?: string; // 其他收費細節
}

export interface AiModel {
  id: string;
  vendorId: string;
  vendorName: string;
  modelId: string; // 技術識別符，如 gpt-4o-2024-05-13
  displayName: string;
  aliases: string[];
  status: ModelStatus;
  lifecycleStatus?: LifecycleStatus;
  dataQuality?: DataQuality;
  availableVia?: AvailableVia[];
  availability: ModelAvailability;
  primaryModality: PrimaryModality;
  capabilities: string[]; // reasoning, tool_calling, structured_outputs, coding 等
  inputTypes: string[];
  outputTypes: string[];
  contextWindow: string | number;
  pricing: AiModelPricing;
  officialSourceUrls: string[];
  pricingSourceUrl?: string; // 價格來源連結
  firstSeenSourceUrl: string;
  firstSeenAt: string;
  officialLaunchDate?: string;
  firstAvailableDate?: string;
  deprecatedAt?: string;
  retiredAt?: string;
  lastSeenAt: string;
  lastVerifiedAt: string;
  summaryZh: string;
  notes?: string;
  confidence: "high" | "medium" | "low";
  reviewStatus: "auto_verified" | "needs_review" | "manually_verified" | "ignored";

  // Source traceability
  sourceSnapshotIds: string[];
  gapFlags?: GapFlag[];

  // Newly found flag in inventory scanning
  newlyFound?: boolean;
}

// For compatibility with pre-existing UI components
export interface ActiveCatalogModel extends Partial<AiModel> {
  // Required fallback fields for legacy UI
  modelName: string;
  vendor: string;
  releaseDate: string;
  category: "reasoning" | "vision" | "audio" | "general" | "open-source" | "other";
  pricingInput: string;
  pricingOutput: string;
  deprecatedReplacements?: string;
  keyFeatures: string[];
  chineseDescription?: string;
}

// ----------------------------
// Scan Session
// ----------------------------

export interface InventoryScanSession {
  id: string;
  startedAt: string;
  completedAt?: string;
  vendorIds: string[];
  snapshotIds: string[];
  newModelsFound: number;
  modelsUpdated: number;
  gapCheckResults: GapCheckResult[];
  status: "running" | "completed" | "error";
  errorMessage?: string;
}

// ----------------------------
// Daily Report (legacy)
// ----------------------------

export interface DailyReport {
  id: string;
  date: string; // 報告日期
  summary: string; // 日報摘要
  updates: AIModelUpdate[];
  marketTrendAnalysis: string; // 當日市場趨勢整體解析
}

export interface ScanRequest {
  keyword?: string;
  days?: number;
}
