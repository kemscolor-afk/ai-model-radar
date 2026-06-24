import { Vendor } from "../types";

export const defaultVendors: Vendor[] = [
  {
    id: "openai",
    name: "OpenAI",
    website: "https://openai.com",
    priority: "core",
    sourceUrls: [
      { url: "https://platform.openai.com/docs/models", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://openai.com/api/pricing", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" },
      { url: "https://openai.com/news", sourceType: "blog", trustLevel: "official", scanMode: "release" }
    ]
  },
  {
    id: "anthropic",
    name: "Anthropic",
    website: "https://anthropic.com",
    priority: "core",
    sourceUrls: [
      { url: "https://docs.anthropic.com/en/docs/about-claude/models", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://www.anthropic.com/pricing", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" },
      { url: "https://www.anthropic.com/news", sourceType: "blog", trustLevel: "official", scanMode: "release" }
    ]
  },
  {
    id: "google",
    name: "Google Gemini",
    website: "https://deepmind.google",
    priority: "core",
    sourceUrls: [
      { url: "https://ai.google.dev/gemini-api/docs/models/gemini", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://ai.google.dev/pricing", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" },
      { url: "https://deepmind.google/news", sourceType: "blog", trustLevel: "official", scanMode: "release" }
    ]
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    website: "https://deepseek.com",
    priority: "core",
    sourceUrls: [
      { url: "https://api-docs.deepseek.com/pricing", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" },
      { url: "https://github.com/deepseek-ai", sourceType: "github", trustLevel: "official", scanMode: "inventory" },
      { url: "https://deepseek.com", sourceType: "blog", trustLevel: "official", scanMode: "release" }
    ]
  },
  {
    id: "meta",
    name: "Meta AI",
    website: "https://ai.meta.com",
    priority: "core",
    sourceUrls: [
      { url: "https://llama.meta.com", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://github.com/facebookresearch", sourceType: "github", trustLevel: "official", scanMode: "inventory" },
      { url: "https://ai.meta.com/blog", sourceType: "blog", trustLevel: "official", scanMode: "release" }
    ]
  },
  {
    id: "mistral",
    name: "Mistral AI",
    website: "https://mistral.ai",
    priority: "important",
    sourceUrls: [
      { url: "https://docs.mistral.ai/getting-started/models", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://mistral.ai/technology", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" },
      { url: "https://mistral.ai/news", sourceType: "blog", trustLevel: "official", scanMode: "release" }
    ]
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    website: "https://x.ai",
    priority: "important",
    sourceUrls: [
      { url: "https://docs.x.ai/docs", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://x.ai/blog", sourceType: "blog", trustLevel: "official", scanMode: "release" }
    ]
  },
  {
    id: "microsoft",
    name: "Microsoft",
    website: "https://azure.microsoft.com",
    priority: "important",
    sourceUrls: [
      { url: "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" },
      { url: "https://blogs.microsoft.com/ai", sourceType: "blog", trustLevel: "official", scanMode: "release" }
    ]
  },
  {
    id: "cohere",
    name: "Cohere",
    website: "https://cohere.com",
    priority: "important",
    sourceUrls: [
      { url: "https://docs.cohere.com/docs/models", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://cohere.com/pricing", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" },
      { url: "https://cohere.com/blog", sourceType: "blog", trustLevel: "official", scanMode: "release" }
    ]
  },
  {
    id: "ai21",
    name: "AI21 Labs",
    website: "https://ai21.com",
    priority: "watch",
    sourceUrls: [
      { url: "https://docs.ai21.com/docs/models", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://www.ai21.com/pricing", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" }
    ]
  },
  {
    id: "alibaba",
    name: "Alibaba Cloud",
    website: "https://www.alibabacloud.com",
    priority: "important",
    sourceUrls: [
      { url: "https://github.com/QwenLM", sourceType: "github", trustLevel: "official", scanMode: "inventory" },
      { url: "https://github.com/FunASR", sourceType: "github", trustLevel: "official", scanMode: "inventory" },
      { url: "https://www.alibabacloud.com/product/apsaradb-for-mongodb", sourceType: "blog", trustLevel: "official", scanMode: "release" }
    ]
  },
  {
    id: "tencent",
    name: "Tencent Hunyuan",
    website: "https://hunyuan.tencent.com",
    priority: "watch",
    sourceUrls: [
      { url: "https://cloud.tencent.com/document/product/1729", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://cloud.tencent.com/document/product/1729/104758", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" }
    ]
  },
  {
    id: "baidu",
    name: "Baidu Ernie",
    website: "https://cloud.baidu.com",
    priority: "watch",
    sourceUrls: [
      { url: "https://cloud.baidu.com/doc/WENXINYIYAN/index.html", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://cloud.baidu.com/doc/WENXINYIYAN/s/ilpbi4w83", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" }
    ]
  },
  {
    id: "bytedance",
    name: "ByteDance Doubao",
    website: "https://www.volcengine.com",
    priority: "important",
    sourceUrls: [
      { url: "https://www.volcengine.com/product/doubao", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://www.volcengine.com/docs/82982/1271164", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" }
    ]
  },
  {
    id: "aws",
    name: "Amazon Bedrock",
    website: "https://aws.amazon.com/bedrock",
    priority: "important",
    sourceUrls: [
      { url: "https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://aws.amazon.com/bedrock/pricing", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" }
    ]
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    website: "https://huggingface.co",
    priority: "important",
    sourceUrls: [
      { url: "https://huggingface.co/models", sourceType: "models_page", trustLevel: "platform", scanMode: "inventory" },
      { url: "https://huggingface.co/blog", sourceType: "blog", trustLevel: "platform", scanMode: "release" }
    ]
  },
  {
    id: "groq",
    name: "Groq",
    website: "https://groq.com",
    priority: "important",
    sourceUrls: [
      { url: "https://console.groq.com/docs/models", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://groq.com/pricing", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" }
    ]
  },
  {
    id: "stability",
    name: "Stability AI",
    website: "https://stability.ai",
    priority: "important",
    sourceUrls: [
      { url: "https://stability.ai/stable-image", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://stability.ai/pricing", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" }
    ]
  },
  {
    id: "runway",
    name: "Runway",
    website: "https://runwayml.com",
    priority: "watch",
    sourceUrls: [
      { url: "https://runwayml.com/research", sourceType: "blog", trustLevel: "official", scanMode: "release" }
    ]
  },
  {
    id: "luma",
    name: "Luma AI",
    website: "https://lumalabs.ai",
    priority: "watch",
    sourceUrls: [
      { url: "https://lumalabs.ai/dream-machine", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" }
    ]
  },
  {
    id: "perplexity",
    name: "Perplexity AI",
    website: "https://perplexity.ai",
    priority: "important",
    sourceUrls: [
      { url: "https://docs.perplexity.ai/docs/model-cards", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://docs.perplexity.ai/docs/pricing", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" }
    ]
  }
];
