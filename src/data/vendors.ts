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
    name: "ByteDance Seed / Doubao",
    website: "https://www.volcengine.com",
    priority: "important",
    sourceUrls: [
      { url: "https://www.volcengine.com/product/doubao", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://seed.bytedance.com/en/seedance2_0", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://docs.byteplus.com/en/docs/ModelArk/1520757", sourceType: "api_reference", trustLevel: "official", scanMode: "inventory" },
      { url: "https://www.volcengine.com/docs/82982/1271164", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" }
    ],
    productLines: [
      {
        name: "Doubao",
        description: "General language, multimodal, speech, and enterprise API models.",
        modalities: ["language", "multimodal", "tts", "asr"],
        sourceUrls: [
          { url: "https://www.volcengine.com/product/doubao", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
          { url: "https://www.volcengine.com/docs/82379", sourceType: "docs", trustLevel: "official", scanMode: "inventory" },
          { url: "https://www.volcengine.com/docs/82982/1271164", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" }
        ]
      },
      {
        name: "Seedream",
        description: "Image generation and image editing model family.",
        modalities: ["image"],
        sourceUrls: [
          { url: "https://www.volcengine.com/product/doubao", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" }
        ]
      },
      {
        name: "Seedance",
        description: "Video generation model family; check ByteDance Seed, Volcano Engine, and BytePlus ModelArk instead of only the Doubao landing page.",
        modalities: ["video"],
        sourceUrls: [
          { url: "https://seed.bytedance.com/en/seedance2_0", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
          { url: "https://docs.byteplus.com/en/docs/ModelArk/1520757", sourceType: "api_reference", trustLevel: "official", scanMode: "inventory" }
        ]
      }
    ]
  },
  {
    id: "zhipu",
    name: "Zhipu AI",
    website: "https://www.bigmodel.cn",
    priority: "important",
    sourceUrls: [
      { url: "https://docs.bigmodel.cn/cn/guide/models", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://open.bigmodel.cn/pricing", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" },
      { url: "https://github.com/THUDM", sourceType: "github", trustLevel: "official", scanMode: "inventory" }
    ]
  },
  {
    id: "moonshot",
    name: "Moonshot AI",
    website: "https://www.moonshot.cn",
    priority: "important",
    sourceUrls: [
      { url: "https://platform.moonshot.cn/docs/intro", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://platform.moonshot.cn/docs/pricing", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" }
    ]
  },
  {
    id: "baichuan",
    name: "Baichuan AI",
    website: "https://www.baichuan-ai.com",
    priority: "important",
    sourceUrls: [
      { url: "https://platform.baichuan-ai.com/docs/api", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://huggingface.co/baichuan-inc", sourceType: "huggingface", trustLevel: "platform", scanMode: "inventory" }
    ]
  },
  {
    id: "minimax",
    name: "MiniMax",
    website: "https://www.minimaxi.com",
    priority: "important",
    sourceUrls: [
      { url: "https://platform.minimaxi.com/document/guides/chat-model/V2", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://platform.minimaxi.com/document/guides/T2A-model/V2", sourceType: "docs", trustLevel: "official", scanMode: "inventory" }
    ]
  },
  {
    id: "modelbest",
    name: "ModelBest",
    website: "https://www.modelbest.cn",
    priority: "important",
    sourceUrls: [
      { url: "https://github.com/OpenBMB/MiniCPM", sourceType: "github", trustLevel: "official", scanMode: "inventory" },
      { url: "https://huggingface.co/openbmb", sourceType: "huggingface", trustLevel: "platform", scanMode: "inventory" }
    ]
  },
  {
    id: "sensetime",
    name: "SenseTime",
    website: "https://www.sensetime.com",
    priority: "watch",
    sourceUrls: [
      { url: "https://www.sensecore.cn/model-as-a-service", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://chat.sensetime.com", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" }
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
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    website: "https://elevenlabs.io",
    priority: "important",
    sourceUrls: [
      { url: "https://elevenlabs.io/docs/overview/models", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://elevenlabs.io/docs/overview/capabilities/text-to-speech", sourceType: "docs", trustLevel: "official", scanMode: "inventory" },
      { url: "https://elevenlabs.io/pricing", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" }
    ]
  },
  {
    id: "assemblyai",
    name: "AssemblyAI",
    website: "https://www.assemblyai.com",
    priority: "important",
    sourceUrls: [
      { url: "https://www.assemblyai.com/", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://www.assemblyai.com/pricing", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" }
    ]
  },
  {
    id: "deepgram",
    name: "Deepgram",
    website: "https://deepgram.com",
    priority: "important",
    sourceUrls: [
      { url: "https://developers.deepgram.com/docs/models-languages-overview", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://developers.deepgram.com/docs/diarization", sourceType: "docs", trustLevel: "official", scanMode: "inventory" },
      { url: "https://deepgram.com/pricing", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" }
    ]
  },
  {
    id: "pyannote",
    name: "pyannote",
    website: "https://github.com/pyannote/pyannote-audio",
    priority: "important",
    sourceUrls: [
      { url: "https://huggingface.co/pyannote/speaker-diarization-community-1", sourceType: "model_card", trustLevel: "platform", scanMode: "inventory" },
      { url: "https://github.com/pyannote/pyannote-audio", sourceType: "github", trustLevel: "official", scanMode: "inventory" }
    ]
  },
  {
    id: "blackforest",
    name: "Black Forest Labs",
    website: "https://bfl.ai",
    priority: "important",
    sourceUrls: [
      { url: "https://docs.bfl.ml/quick_start/introduction", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://github.com/black-forest-labs/flux", sourceType: "github", trustLevel: "official", scanMode: "inventory" },
      { url: "https://bfl.ai/", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" }
    ]
  },
  {
    id: "ideogram",
    name: "Ideogram",
    website: "https://ideogram.ai",
    priority: "important",
    sourceUrls: [
      { url: "https://developer.ideogram.ai/ideogram-api/api-overview", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://docs.ideogram.ai/plans-and-pricing/ideogram-api", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" }
    ]
  },
  {
    id: "voyage",
    name: "Voyage AI",
    website: "https://www.voyageai.com",
    priority: "important",
    sourceUrls: [
      { url: "https://docs.voyageai.com/docs/embeddings", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://www.voyageai.com/pricing", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" }
    ]
  },
  {
    id: "jina",
    name: "Jina AI",
    website: "https://jina.ai",
    priority: "important",
    sourceUrls: [
      { url: "https://jina.ai/embeddings/", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://jina.ai/reranker/", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" }
    ]
  },
  {
    id: "nvidia",
    name: "NVIDIA",
    website: "https://build.nvidia.com",
    priority: "important",
    sourceUrls: [
      { url: "https://build.nvidia.com/models", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://huggingface.co/nvidia", sourceType: "huggingface", trustLevel: "platform", scanMode: "inventory" }
    ]
  },
  {
    id: "together",
    name: "Together AI",
    website: "https://www.together.ai",
    priority: "important",
    sourceUrls: [
      { url: "https://docs.together.ai/docs/serverless-models", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://www.together.ai/pricing", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" }
    ]
  },
  {
    id: "replicate",
    name: "Replicate",
    website: "https://replicate.com",
    priority: "important",
    sourceUrls: [
      { url: "https://replicate.com/collections/flux", sourceType: "models_page", trustLevel: "platform", scanMode: "inventory" },
      { url: "https://replicate.com/explore", sourceType: "models_page", trustLevel: "platform", scanMode: "inventory" }
    ]
  },
  {
    id: "fireworks",
    name: "Fireworks AI",
    website: "https://fireworks.ai",
    priority: "important",
    sourceUrls: [
      { url: "https://docs.fireworks.ai/models", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" },
      { url: "https://fireworks.ai/pricing", sourceType: "pricing_page", trustLevel: "official", scanMode: "pricing" }
    ]
  },
  {
    id: "cerebras",
    name: "Cerebras",
    website: "https://www.cerebras.ai",
    priority: "important",
    sourceUrls: [
      { url: "https://inference-docs.cerebras.ai/introduction", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" }
    ]
  },
  {
    id: "sambanova",
    name: "SambaNova",
    website: "https://sambanova.ai",
    priority: "important",
    sourceUrls: [
      { url: "https://docs.sambanova.ai/cloud/docs/get-started/supported-models", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" }
    ]
  },
  {
    id: "midjourney",
    name: "Midjourney",
    website: "https://www.midjourney.com",
    priority: "watch",
    sourceUrls: [
      { url: "https://docs.midjourney.com", sourceType: "docs", trustLevel: "official", scanMode: "inventory" }
    ]
  },
  {
    id: "kling",
    name: "Kling AI",
    website: "https://klingai.com",
    priority: "watch",
    sourceUrls: [
      { url: "https://app.klingai.com", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" }
    ]
  },
  {
    id: "pika",
    name: "Pika",
    website: "https://pika.art",
    priority: "watch",
    sourceUrls: [
      { url: "https://pika.art", sourceType: "models_page", trustLevel: "official", scanMode: "inventory" }
    ]
  }
];
