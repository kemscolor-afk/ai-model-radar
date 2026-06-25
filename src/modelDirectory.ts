import {
  ActiveCatalogModel,
  AvailableVia,
  DataQuality,
  LifecycleStatus,
  PricingStatus,
  PrimaryModality,
  Vendor,
} from "./types";

export type DirectorySortKey =
  | "lastVerifiedAt"
  | "officialLaunchDate"
  | "lastSeenAt"
  | "vendor"
  | "modelName"
  | "primaryModality"
  | "lifecycleStatus"
  | "pricingStatus";

export interface DirectoryModel {
  id: string;
  vendor: string;
  vendorId?: string;
  modelName: string;
  modelId: string;
  lifecycleStatus: LifecycleStatus;
  primaryModality: PrimaryModality;
  availableVia: AvailableVia[];
  inputTypes: string[];
  outputTypes: string[];
  contextWindow: string;
  pricingSummary: string;
  pricingDetails?: string;
  pricingStatus: PricingStatus;
  pricingSourceUrl?: string;
  officialSourceUrls: string[];
  firstSeenAt?: string;
  officialLaunchDate?: string;
  firstAvailableDate?: string;
  deprecatedAt?: string;
  retiredAt?: string;
  lastSeenAt?: string;
  lastVerifiedAt?: string;
  capabilities: string[];
  reviewStatus?: string;
  dataQuality: DataQuality;
  notes?: string;
  summary: string;
}

export const lifecycleLabels: Record<LifecycleStatus, string> = {
  discovered: "discovered（已發現，待官方確認）",
  source_verified: "source verified（官方來源確認）",
  published: "published（正式展示）",
  deprecated: "deprecated（官方仍可用但不建議新專案使用）",
  retired: "retired（已下架或 API 不再可用）",
  unknown: "unknown（狀態不足，需查核）",
};

export const dataQualityLabels: Record<DataQuality, string> = {
  verified: "verified（官方來源與重要欄位已確認）",
  pricing_unverified: "pricing unverified（模型存在但價格未確認）",
  needs_review: "needs review（來源矛盾或資料不足）",
  source_missing: "source missing（缺少官方來源）",
  data_dirty: "data dirty（舊資料或疑似壞資料）",
  retired_confirmed: "retired confirmed（已確認下架）",
};

export const modalityLabels: Record<string, string> = {
  language: "language（文字語言）",
  text: "text（文字）",
  image: "image（影像生成 / 影像處理）",
  vision: "vision（視覺理解）",
  video: "video（影片生成 / 影片理解）",
  audio: "audio（語音 / 音訊）",
  embedding: "embedding（向量嵌入）",
  reranking: "reranking（檢索排序重排）",
  tts: "TTS（text-to-speech，文字轉語音）",
  asr: "ASR（automatic speech recognition，自動語音辨識）",
  music: "music（音樂生成 / 音訊模型）",
  robotics: "robotics（機器人）",
  multimodal: "multimodal（多模態）",
  unknown: "unknown（未分類）",
  other: "other（其他）",
};

export const availableViaLabels: Record<AvailableVia, string> = {
  api: "API",
  web: "Web",
  open_weights: "open weights（開放權重）",
  hosted_platform: "hosted platform（平台託管）",
};

const technicalTermLabels: Record<string, string> = {
  text: "text（文字）",
  image: "image（影像）",
  audio: "audio（音訊）",
  video: "video（影片）",
  code: "code（程式碼）",
  ranking: "ranking（排序結果）",
  speaker_labels: "speaker labels（說話者標籤）",
  text_generation: "text generation（文字生成）",
  image_generation: "image generation（影像生成）",
  image_editing: "image editing（影像編輯）",
  video_generation: "video generation（影片生成）",
  video_editing: "video editing（影片編輯）",
  text_to_video: "text-to-video（文字生成影片）",
  image_to_video: "image-to-video（影像生成影片）",
  text_to_image: "text-to-image（文字生成影像）",
  text_to_speech: "text-to-speech（文字轉語音）",
  text_to_dialogue: "text-to-dialogue（文字生成對話語音）",
  speech_to_text: "speech-to-text（語音轉文字）",
  speaker_diarization: "speaker diarization（說話者分離）",
  speaker_segmentation: "speaker segmentation（說話者分段）",
  streaming_asr: "streaming ASR（串流語音辨識）",
  language_detection: "language detection（語言偵測）",
  timestamps: "timestamps（時間戳）",
  voice_generation: "voice generation（語音生成）",
  dubbing: "dubbing（配音）",
  embedding: "embedding（向量嵌入）",
  reranking: "reranking（檢索排序重排）",
  semantic_search: "semantic search（語意搜尋）",
  search_ranking: "search ranking（搜尋排序）",
  multilingual_search: "multilingual search（多語搜尋）",
  rag: "RAG（檢索增強生成）",
  classification: "classification（分類）",
  code_search: "code search（程式碼搜尋）",
  coding: "coding（程式碼能力）",
  agents: "agents（代理工作流）",
  agent: "agent（代理工作流）",
  tool_calling: "tool calling（工具呼叫）",
  tool_use: "tool use（工具使用）",
  structured_outputs: "structured outputs（結構化輸出）",
  reasoning: "reasoning（推理）",
  math: "math（數學推理）",
  vision: "vision（視覺理解）",
  multimodal_understanding: "multimodal understanding（多模態理解）",
  open_weights: "open weights（開放權重）",
  open_model: "open model（開放模型）",
  fine_tuning: "fine-tuning（微調）",
  instruction_following: "instruction following（指令遵循）",
  enterprise_search: "enterprise search（企業搜尋）",
  typography: "typography（文字排版生成）",
  small_language_model: "small language model（小型語言模型）",
  edge_inference: "edge inference（邊緣推論）",
  synthetic_data: "synthetic data（合成資料）",
};

export function displayTerm(value: string): string {
  return technicalTermLabels[value] || value;
}

export function displayTerms(values: string[]): string[] {
  return values.map(displayTerm);
}

export function isCorruptedText(value?: string): boolean {
  if (!value) return true;
  const suspicious = (value.match(/[�嚙蝓蹓選]/g) || []).length;
  const questionRuns = (value.match(/\?{2,}/g) || []).join("").length;
  if (questionRuns > Math.max(4, value.length * 0.08)) return true;
  return suspicious > Math.max(3, value.length * 0.08);
}

export function readableText(value?: string, fallback = "資料待確認。"): string {
  if (!value || isCorruptedText(value)) return fallback;
  return value;
}

function inferLifecycle(model: ActiveCatalogModel): LifecycleStatus {
  if (model.lifecycleStatus) return model.lifecycleStatus;
  if (model.status === "deprecated" || model.availability === "deprecated") return "deprecated";
  if (model.status === "possibly_deprecated") return "unknown";
  if (model.status === "unknown") return "unknown";
  if (model.reviewStatus === "needs_review") return "discovered";
  if (model.officialSourceUrls?.length || model.firstSeenSourceUrl) return "source_verified";
  return "unknown";
}

function inferDataQuality(model: ActiveCatalogModel, lifecycleStatus: LifecycleStatus): DataQuality {
  if (model.dataQuality) return model.dataQuality;
  if (lifecycleStatus === "retired") return "retired_confirmed";
  if (isCorruptedText(model.chineseDescription || model.summaryZh || model.notes)) return "data_dirty";
  if (!model.officialSourceUrls?.length && !model.firstSeenSourceUrl) return "source_missing";
  const pricingStatus = model.pricing?.pricingStatus;
  if (!pricingStatus || pricingStatus === "official_not_found" || pricingStatus === "ambiguous") {
    return "pricing_unverified";
  }
  if (model.reviewStatus === "needs_review" || (model.gapFlags?.length ?? 0) > 0) return "needs_review";
  return "verified";
}

function inferAvailableVia(model: ActiveCatalogModel): AvailableVia[] {
  if (model.availableVia?.length) return model.availableVia;
  const urls = [
    ...(model.officialSourceUrls || []),
    model.firstSeenSourceUrl || "",
    model.pricingSourceUrl || "",
  ].join(" ").toLowerCase();
  const via = new Set<AvailableVia>();
  if (urls.includes("huggingface") || urls.includes("github")) via.add("open_weights");
  if (urls.includes("console") || urls.includes("platform") || urls.includes("replicate")) {
    via.add("hosted_platform");
  }
  if (urls.includes("api") || model.pricingInput || model.pricingOutput) via.add("api");
  if (via.size === 0) via.add("web");
  return Array.from(via);
}

function buildReadableSummary(model: ActiveCatalogModel): string {
  const modality = modalityLabels[model.primaryModality || "unknown"] || model.primaryModality || "unknown（未分類）";
  const capabilities = displayTerms(model.capabilities?.length ? model.capabilities : model.keyFeatures || []);
  const via = inferAvailableVia(model).map((item) => availableViaLabels[item]);
  const capabilityText = capabilities.length
    ? capabilities.slice(0, 5).join("、")
    : "模型用途與能力待官方文件補充";
  const viaText = via.length ? via.join("、") : "官方來源";
  return `${model.vendor} 的 ${model.modelName} 是 ${modality}模型，主要支援 ${capabilityText}，可透過 ${viaText} 使用。`;
}

function normalizeSummary(model: ActiveCatalogModel): string {
  const raw = model.chineseDescription || model.summaryZh;
  if (!raw || isCorruptedText(raw)) return buildReadableSummary(model);

  const asciiLetters = (raw.match(/[A-Za-z]/g) || []).length;
  const cjkLetters = (raw.match(/[\u4e00-\u9fff]/g) || []).length;
  if (asciiLetters > cjkLetters * 2) {
    return buildReadableSummary(model);
  }

  return raw;
}

export function normalizeDirectoryModel(model: ActiveCatalogModel): DirectoryModel {
  const lifecycleStatus = inferLifecycle(model);
  const dataQuality = inferDataQuality(model, lifecycleStatus);
  const pricingStatus = model.pricing?.pricingStatus || "official_not_found";
  const officialSourceUrls = model.officialSourceUrls?.length
    ? model.officialSourceUrls
    : model.firstSeenSourceUrl
      ? [model.firstSeenSourceUrl]
      : [];

  return {
    id: model.id,
    vendor: model.vendor,
    vendorId: model.vendorId,
    modelName: model.modelName,
    modelId: model.modelId || model.displayName || model.modelName,
    lifecycleStatus,
    primaryModality: model.primaryModality || "unknown",
    availableVia: inferAvailableVia(model),
    inputTypes: displayTerms(model.inputTypes || []),
    outputTypes: displayTerms(model.outputTypes || []),
    contextWindow: String(model.contextWindow || "N/A"),
    pricingSummary: `輸入 Input: ${model.pricingInput || model.pricing?.input1m || "N/A"} / 輸出 Output: ${
      model.pricingOutput || model.pricing?.output1m || "N/A"
    }`,
    pricingDetails: model.pricing?.pricingDetails,
    pricingStatus,
    pricingSourceUrl: model.pricing?.pricingSourceUrl || model.pricingSourceUrl,
    officialSourceUrls,
    firstSeenAt: model.firstSeenAt || model.releaseDate,
    officialLaunchDate: model.officialLaunchDate,
    firstAvailableDate: model.firstAvailableDate,
    deprecatedAt: model.deprecatedAt,
    retiredAt: model.retiredAt,
    lastSeenAt: model.lastSeenAt,
    lastVerifiedAt: model.lastVerifiedAt,
    capabilities: displayTerms(model.capabilities?.length ? model.capabilities : model.keyFeatures || []),
    reviewStatus: model.reviewStatus,
    dataQuality,
    notes: readableText(model.notes || model.deprecatedReplacements, ""),
    summary: normalizeSummary(model),
  };
}

export function getLastUpdated(models: DirectoryModel[]): string {
  const dates = models
    .map((model) => model.lastVerifiedAt || model.lastSeenAt || model.firstSeenAt)
    .filter(Boolean)
    .map((date) => new Date(date as string).getTime())
    .filter((time) => Number.isFinite(time));
  if (dates.length === 0) return "尚未確認";
  return new Date(Math.max(...dates)).toISOString().split("T")[0];
}

export function countMonitoredVendors(vendors: Vendor[], models: DirectoryModel[]): number {
  if (vendors.length > 0) return vendors.length;
  return new Set(models.map((model) => model.vendor)).size;
}
