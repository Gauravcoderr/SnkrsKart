import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

async function fetchProductContext(query: string): Promise<string> {
  try {
    const params = new URLSearchParams({ search: query, limit: '6' });
    const res = await fetch(`${BACKEND_URL}/products?${params}`, { cache: 'no-store' });
    if (!res.ok) return '';
    const data = await res.json();
    const products: any[] = data.products ?? data;
    if (!Array.isArray(products) || products.length === 0) return '';
    return products
      .map(
        (p: any) =>
          `- ${p.name} | Brand: ${p.brand} | Price: ₹${p.price}${p.discount ? ` (${p.discount}% off)` : ''} | Gender: ${p.gender} | Sizes: ${(p.availableSizes ?? p.sizes ?? []).join(', ')} | Slug: ${p.slug}`
      )
      .join('\n');
  } catch {
    return '';
  }
}

async function fetchSuggestedProducts(slugs: string[]): Promise<any[]> {
  if (!slugs.length) return [];
  const results = await Promise.allSettled(
    slugs.map((slug) =>
      fetch(`${BACKEND_URL}/products/${slug}`, { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : null
      )
    )
  );
  return results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => (r as PromiseFulfilledResult<any>).value);
}

const SYSTEM_PROMPT = `You are KickBot, a friendly and knowledgeable sneaker assistant for SNKRS CART — a premium sneaker store in India.

Your goals:
1. Have a natural conversation to understand what the user is looking for (style, brand, budget, gender, size, occasion, etc.)
2. Ask follow-up questions naturally — keep it fun and sneaker-focused.
3. Recommend shoes from the catalog provided. Always reference real products from the context.
4. If recommending specific products, include their slugs at the very end of your reply in this exact format (no extra text after it):
   [SUGGESTIONS:{"slugs":["slug-1","slug-2"]}]
5. Keep responses concise — 2-4 sentences max unless the user asks for more detail.
6. Use ₹ for prices (Indian Rupees).
7. Be enthusiastic about sneakers but stay helpful, not pushy.`;

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: Message[] } = await req.json();
    if (!messages?.length) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    const lastUserMessage = messages.findLast((m) => m.role === 'user')?.content ?? '';
    const productContext = await fetchProductContext(lastUserMessage);

    const systemWithContext = productContext
      ? `${SYSTEM_PROMPT}\n\n--- AVAILABLE PRODUCTS ---\n${productContext}\n--- END PRODUCTS ---`
      : SYSTEM_PROMPT;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemWithContext,
    });

    // Convert history (all but last user message) for Gemini chat format
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastUserMessage);
    const rawText = result.response.text();

    // Parse out product slugs if Gemini included them
    const suggestionMatch = rawText.match(/\[SUGGESTIONS:(\{[\s\S]*?\})\]/);
    let suggestedProducts: any[] = [];
    let displayText = rawText;

    if (suggestionMatch) {
      displayText = rawText.replace(suggestionMatch[0], '').trim();
      try {
        const { slugs } = JSON.parse(suggestionMatch[1]);
        suggestedProducts = await fetchSuggestedProducts(slugs);
      } catch {}
    }

    return NextResponse.json({ text: displayText, products: suggestedProducts });
  } catch (err: any) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}
