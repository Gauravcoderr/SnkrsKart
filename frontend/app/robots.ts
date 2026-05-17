import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // OpenAI / ChatGPT
      { userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ChatGPT Agent', 'Operator'], allow: '/' },
      // Anthropic / Claude
      { userAgent: ['ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'Claude-Web', 'anthropic-ai', 'Claude-Code'], allow: '/' },
      // Google AI (Gemini, NotebookLM, Vertex, Deep Research, Mariner)
      { userAgent: ['Google-Extended', 'Google-CloudVertexBot', 'CloudVertexBot', 'Google-NotebookLM',
                    'NotebookLM', 'Google-Agent', 'GoogleAgent-Mariner', 'Gemini-Deep-Research',
                    'Google-Gemini-CLI', 'Google-Firebase'], allow: '/' },
      // Perplexity
      { userAgent: ['PerplexityBot', 'Perplexity-User'], allow: '/' },
      // Meta (Facebook AI, Llama)
      { userAgent: ['meta-externalagent', 'Meta-ExternalAgent', 'meta-externalfetcher',
                    'Meta-ExternalFetcher', 'meta-webindexer', 'facebookexternalhit', 'FacebookBot'], allow: '/' },
      // xAI / Grok
      { userAgent: ['GrokBot', 'Grok-DeepSearch'], allow: '/' },
      // Mistral AI
      { userAgent: ['MistralAI-User'], allow: '/' },
      // Amazon / AWS (Alexa, Bedrock, Kendra)
      { userAgent: ['Amazonbot', 'AmazonBuyForMe', 'Amzn-SearchBot', 'Amzn-User', 'bedrockbot', 'amazon-kendra'], allow: '/' },
      // Apple (Siri, Apple Intelligence)
      { userAgent: ['Applebot', 'Applebot-Extended'], allow: '/' },
      // Microsoft Bing / Copilot
      { userAgent: ['bingbot', 'AzureAI-SearchBot'], allow: '/' },
      // Common Crawl (trains Llama, Mistral, Falcon, many open LLMs)
      { userAgent: ['CCBot'], allow: '/' },
      // DuckDuckGo AI
      { userAgent: ['DuckAssistBot'], allow: '/' },
      // DeepSeek
      { userAgent: ['DeepSeekBot'], allow: '/' },
      // Cohere (Command models)
      { userAgent: ['cohere-ai', 'cohere-training-data-crawler'], allow: '/' },
      // Allen Institute for AI (Semantic Scholar, OLMo)
      { userAgent: ['AI2Bot', 'AI2Bot-DeepResearchEval', 'Ai2Bot-Dolma'], allow: '/' },
      // ByteDance / TikTok
      { userAgent: ['Bytespider', 'TikTokSpider'], allow: '/' },
      // Brave Leo AI
      { userAgent: ['Bravebot'], allow: '/' },
      // You.com AI Search
      { userAgent: ['YouBot'], allow: '/' },
      // Kagi AI Search
      { userAgent: ['kagi-fetcher'], allow: '/' },
      // Andi AI Search
      { userAgent: ['Andibot'], allow: '/' },
      // Diffbot (knowledge graph, used by many LLMs for entity extraction)
      { userAgent: ['Diffbot'], allow: '/' },
      // Tavily (AI agent web search — used by LangChain, AutoGPT, CrewAI)
      { userAgent: ['TavilyBot'], allow: '/' },
      // Phind (dev AI search)
      { userAgent: ['PhindBot'], allow: '/' },
      // iAsk AI Search
      { userAgent: ['iAskBot', 'iaskspider', 'iaskspider/2.0'], allow: '/' },
      // Liner AI
      { userAgent: ['LinerBot'], allow: '/' },
      // Exa AI (semantic search, used by AI agents)
      { userAgent: ['ExaBot'], allow: '/' },
      // Manus AI Agent
      { userAgent: ['Manus-User'], allow: '/' },
      // Yandex AI (YaGPT)
      { userAgent: ['YandexAdditionalBot'], allow: '/' },
      // Cloudflare AutoRAG
      { userAgent: ['Cloudflare-AutoRAG'], allow: '/' },
      // Linkup AI Search
      { userAgent: ['LinkupBot'], allow: '/' },
      // Open-source AI crawlers (FireCrawl, Crawl4AI, FriendlyCrawler)
      { userAgent: ['FirecrawlAgent', 'Crawl4AI', 'FriendlyCrawler'], allow: '/' },
      // Catch-all — keep /admin/ restricted for generic bots
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
