'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product, Blog } from '@/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
  blogs?: Blog[];
}

const GREETING: Message = {
  role: 'assistant',
  content: "Hey! I'm KickBot 👟 — your sneaker guide at SNKRS CART. Tell me what you're looking for and I'll find the perfect pair for you. What's the vibe — running, streetwear, casual, or something else?",
};

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white p-2.5 hover:border-zinc-300 hover:shadow-sm transition-all group"
    >
      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-zinc-50 flex-shrink-0">
        {product.images?.[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain p-1"
            sizes="56px"
          />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-zinc-900 truncate group-hover:text-zinc-700 leading-tight">
          {product.name}
        </p>
        <p className="text-[11px] text-zinc-400 truncate">{product.brand}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs font-bold text-zinc-900">{formatPrice(product.price)}</span>
          {product.discount && (
            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 rounded px-1">
              {product.discount}% off
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function BlogCard({ blog }: { blog: Blog }) {
  return (
    <Link
      href={`/blogs/${blog.slug}`}
      className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white p-2.5 hover:border-zinc-300 hover:shadow-sm transition-all group"
    >
      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-zinc-50 flex-shrink-0">
        {blog.coverImage && (
          <Image src={blog.coverImage} alt={blog.title} fill className="object-cover" sizes="56px" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-violet-600 uppercase tracking-wide mb-0.5">Article</p>
        <p className="text-xs font-semibold text-zinc-900 truncate group-hover:text-zinc-700 leading-tight">
          {blog.title}
        </p>
        {blog.excerpt && (
          <p className="text-[11px] text-zinc-400 truncate mt-0.5">{blog.excerpt}</p>
        )}
      </div>
    </Link>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0 text-[13px]">
        👟
      </div>
      <div className="bg-zinc-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const apiMessages = updated.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.text ?? 'Sorry, something went wrong.', products: data.products ?? [], blogs: data.blogs ?? [] },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'KickBot abhi thoda busy hai — high volume ki wajah se! Thodi der mein try karo. 🙏👟' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Chat panel */}
      <div
        className={`fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] max-h-[min(560px,calc(100vh-120px))] bg-white rounded-2xl shadow-2xl border border-zinc-200 flex flex-col transition-all duration-300 origin-bottom-right ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 rounded-t-2xl bg-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-base">
              👟
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">KickBot</p>
              <p className="text-[11px] text-zinc-400">Sneaker guide · Always here</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-zinc-400 hover:text-white transition-colors p-1"
            aria-label="Close chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === 'assistant' ? (
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0 text-[13px]">
                    👟
                  </div>
                  <div className="max-w-[85%]">
                    <div className="bg-zinc-100 text-zinc-900 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm leading-relaxed">
                      {msg.content}
                    </div>
                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.products.map((p) => (
                          <ProductCard key={p.slug} product={p} />
                        ))}
                      </div>
                    )}
                    {msg.blogs && msg.blogs.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.blogs.map((b) => (
                          <BlogCard key={b.slug} blog={b} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-zinc-900 text-white rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-3 py-3 border-t border-zinc-100 rounded-b-2xl">
          <div className="flex items-center gap-2 bg-zinc-50 rounded-xl px-3 py-2 border border-zinc-200 focus-within:border-zinc-400 transition-colors">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about any shoe…"
              className="flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 outline-none"
              disabled={loading}
            />
            <button
              type="button"
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center flex-shrink-0 disabled:opacity-30 hover:bg-zinc-700 transition-colors"
              aria-label="Send"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="m22 2-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Floating bubble button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full bg-zinc-900 text-white shadow-xl flex items-center justify-center hover:bg-zinc-700 active:scale-95 transition-all duration-200"
        aria-label="Open KickBot"
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-2xl leading-none">👟</span>
        )}
      </button>
    </>
  );
}
