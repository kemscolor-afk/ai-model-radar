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
  discovered: "待確認",
  source_verified: "官方來源確認",
  published: "正式展示",
  deprecated: "Deprecated",
  retired: "Retired",
  unknown: "需查核",
};

export const dataQualityLabels: Record<DataQuality, string> = {
  verified: "已確認",
  pricing_unverified: "價格待確認",
  needs_review: "需查核",
  source_missing: "缺少官方來源",
  data_dirty: "資料待清理",
  retired_confirmed: "已確認下架",
};

export const modalityLabels: Record<string, string> = {
  language: "文字",
  text: "文字",
  image: "影像",
  vision: "視覺",
  video: "影片",
  audio: "語音",
  embedding: "Embedding",
  reranking: "Reranking",
  tts: "TTS",
  asr: "ASR",
  music: "音樂",
  robotics: "機器人",
  multimodal: "多模態",
  unknown: "未分類",
  other: "其他",
};

export const availableViaLabels: Record<AvailableVia, string> = {
  api: "API",
  web: "Web",
  open_weights: "Open weights",
  hosted_platform: "Hosted platform",
};

export function isCorruptedText(value?: string): boolean {
  if (!value) return true;
  const suspicious = (value.match(/[�嚙蝓蹓選]/g) || []).length;
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
    inputTypes: model.inputTypes || [],
    outputTypes: model.outputTypes || [],
    contextWindow: String(model.contextWindow || "N/A"),
    pricingSummary: `Input: ${model.pricingInput || model.pricing?.input1m || "N/A"} / Output: ${
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
    capabilities: model.capabilities?.length ? model.capabilities : model.keyFeatures || [],
    reviewStatus: model.reviewStatus,
    dataQuality,
    notes: readableText(model.notes || model.deprecatedReplacements, ""),
    summary: readableText(model.chineseDescription || model.summaryZh),
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
