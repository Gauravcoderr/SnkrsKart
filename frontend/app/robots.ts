import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

// Private / non-content paths. Applied to EVERY user-agent group below: a crawler
// obeys only the most specific group that matches it, so a group with just
// `allow: '/'` would otherwise be free to crawl /admin and /api.
// `/admin` (no trailing slash) also matches `/admin/...`; `/admin/` alone does not match `/admin`.
// /cart, /checkout, /account, /wishlist are deliberately NOT listed: they carry a noindex
// header (next.config.mjs) and Google must be able to fetch them to see it.
const DISALLOW = ['/admin', '/api/'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // OpenAI / ChatGPT
      { userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ChatGPT Agent', 'Operator'], allow: '/', disallow: DISALLOW },
      // Anthropic / Claude
      { userAgent: ['ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'Claude-Web', 'anthropic-ai', 'Claude-Code'], allow: '/', disallow: DISALLOW },
      // Google AI (Gemini, NotebookLM, Vertex, Deep Research, Mariner)
      { userAgent: ['Google-Extended', 'Google-CloudVertexBot', 'CloudVertexBot', 'Google-NotebookLM',
                    'NotebookLM', 'Google-Agent', 'GoogleAgent-Mariner', 'Gemini-Deep-Research',
                    'Google-Gemini-CLI', 'Google-Firebase'], allow: '/', disallow: DISALLOW },
      // Perplexity
      { userAgent: ['PerplexityBot', 'Perplexity-User'], allow: '/', disallow: DISALLOW },
      // Meta (Facebook AI, Llama)
      { userAgent: ['meta-externalagent', 'Meta-ExternalAgent', 'meta-externalfetcher',
                    'Meta-ExternalFetcher', 'meta-webindexer', 'facebookexternalhit', 'FacebookBot'], allow: '/', disallow: DISALLOW },
      // xAI / Grok
      { userAgent: ['GrokBot', 'Grok-DeepSearch'], allow: '/', disallow: DISALLOW },
      // Mistral AI
      { userAgent: ['MistralAI-User'], allow: '/', disallow: DISALLOW },
      // Amazon / AWS (Alexa, Bedrock, Kendra)
      { userAgent: ['Amazonbot', 'AmazonBuyForMe', 'Amzn-SearchBot', 'Amzn-User', 'bedrockbot', 'amazon-kendra'], allow: '/', disallow: DISALLOW },
      // Apple (Siri, Apple Intelligence)
      { userAgent: ['Applebot', 'Applebot-Extended'], allow: '/', disallow: DISALLOW },
      // Microsoft Bing / Copilot
      { userAgent: ['bingbot', 'AzureAI-SearchBot'], allow: '/', disallow: DISALLOW },
      // Common Crawl (trains Llama, Mistral, Falcon, many open LLMs)
      { userAgent: ['CCBot'], allow: '/', disallow: DISALLOW },
      // DuckDuckGo AI
      { userAgent: ['DuckAssistBot'], allow: '/', disallow: DISALLOW },
      // DeepSeek
      { userAgent: ['DeepSeekBot'], allow: '/', disallow: DISALLOW },
      // Cohere (Command models)
      { userAgent: ['cohere-ai', 'cohere-training-data-crawler'], allow: '/', disallow: DISALLOW },
      // Allen Institute for AI (Semantic Scholar, OLMo)
      { userAgent: ['AI2Bot', 'AI2Bot-DeepResearchEval', 'Ai2Bot-Dolma'], allow: '/', disallow: DISALLOW },
      // ByteDance / TikTok
      { userAgent: ['Bytespider', 'TikTokSpider'], allow: '/', disallow: DISALLOW },
      // Brave Leo AI
      { userAgent: ['Bravebot'], allow: '/', disallow: DISALLOW },
      // You.com AI Search
      { userAgent: ['YouBot'], allow: '/', disallow: DISALLOW },
      // Kagi AI Search
      { userAgent: ['kagi-fetcher'], allow: '/', disallow: DISALLOW },
      // Andi AI Search
      { userAgent: ['Andibot'], allow: '/', disallow: DISALLOW },
      // Diffbot (knowledge graph, used by many LLMs for entity extraction)
      { userAgent: ['Diffbot'], allow: '/', disallow: DISALLOW },
      // Tavily (AI agent web search — used by LangChain, AutoGPT, CrewAI)
      { userAgent: ['TavilyBot'], allow: '/', disallow: DISALLOW },
      // Phind (dev AI search)
      { userAgent: ['PhindBot'], allow: '/', disallow: DISALLOW },
      // iAsk AI Search
      { userAgent: ['iAskBot', 'iaskspider', 'iaskspider/2.0'], allow: '/', disallow: DISALLOW },
      // Liner AI
      { userAgent: ['LinerBot'], allow: '/', disallow: DISALLOW },
      // Exa AI (semantic search, used by AI agents)
      { userAgent: ['ExaBot'], allow: '/', disallow: DISALLOW },
      // Manus AI Agent
      { userAgent: ['Manus-User'], allow: '/', disallow: DISALLOW },
      // Yandex AI (YaGPT)
      { userAgent: ['YandexAdditionalBot'], allow: '/', disallow: DISALLOW },
      // Cloudflare AutoRAG
      { userAgent: ['Cloudflare-AutoRAG'], allow: '/', disallow: DISALLOW },
      // Linkup AI Search
      { userAgent: ['LinkupBot'], allow: '/', disallow: DISALLOW },
      // Open-source AI crawlers (FireCrawl, Crawl4AI, FriendlyCrawler)
      { userAgent: ['FirecrawlAgent', 'Crawl4AI', 'FriendlyCrawler'], allow: '/', disallow: DISALLOW },
      // Catch-all — keep /admin/ restricted for generic bots
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOW,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
