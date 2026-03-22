'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product, Blog } from '@/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const LEAD_TRIGGER = 5; // show form after this many user messages

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

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function renderWithLinks(text: string) {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) =>
    URL_REGEX.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline underline-offset-2 hover:text-blue-800 break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

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

function LeadCaptureCard({ onSubmit, onSkip }: { onSubmit: (name: string, email: string, phone: string) => void; onSkip: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onSubmit(name.trim(), email.trim(), phone.trim());
  }

  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0 text-[13px]">👟</div>
      <div className="max-w-[85%] bg-zinc-100 rounded-2xl rounded-bl-sm px-3.5 py-3 text-sm">
        <p className="text-zinc-900 font-medium mb-2.5 leading-snug">You're on a roll! 🔥 Drop your details so we can send you exclusive drops & deals.</p>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Your name *"
            className="w-full text-xs px-3 py-1.5 rounded-lg border border-zinc-200 bg-white outline-none focus:border-zinc-400"
          />
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address *"
            className="w-full text-xs px-3 py-1.5 rounded-lg border border-zinc-200 bg-white outline-none focus:border-zinc-400"
          />
          <input
            type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (optional)"
            className="w-full text-xs px-3 py-1.5 rounded-lg border border-zinc-200 bg-white outline-none focus:border-zinc-400"
          />
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={!name.trim() || !email.trim()}
              className="flex-1 text-xs font-semibold bg-zinc-900 text-white rounded-lg py-1.5 disabled:opacity-30 hover:bg-zinc-700 transition-colors">
              Submit
            </button>
            <button type="button" onClick={onSkip}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors px-2">
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show "Let's chat" nudge after 2.5 min if chat is still closed
  useEffect(() => {
    nudgeTimer.current = setTimeout(() => {
      if (!open) setShowNudge(true);
    }, 2.5 * 60 * 1000);
    return () => { if (nudgeTimer.current) clearTimeout(nudgeTimer.current); };
  }, []);

  // Hide nudge when user opens chat
  useEffect(() => {
    if (open) setShowNudge(false);
  }, [open]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  // Collect product names suggested across the conversation
  function getInterests(msgs: Message[]): string[] {
    const names = new Set<string>();
    msgs.forEach((m) => m.products?.forEach((p) => names.add(p.name)));
    return Array.from(names).slice(0, 10);
  }

  async function handleLeadSubmit(name: string, email: string, phone: string) {
    setShowLeadForm(false);
    setLeadCaptured(true);
    const interests = getInterests(messages);
    try {
      await fetch(`${BACKEND_URL}/chat/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, interests }),
      });
    } catch { /* silent — lead capture is best-effort */ }
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: `Thanks ${name}! 🙌 We'll reach out with exclusive drops and deals. Now let's find you the perfect pair!` },
    ]);
  }

  function handleLeadSkip() {
    setShowLeadForm(false);
    setLeadCaptured(true);
  }

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

      // Trigger lead form after LEAD_TRIGGER user messages
      const userCount = updated.filter((m) => m.role === 'user').length;
      if (userCount === LEAD_TRIGGER && !leadCaptured) {
        setShowLeadForm(true);
      }
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
                      {renderWithLinks(msg.content)}
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
          {showLeadForm && !loading && (
            <LeadCaptureCard onSubmit={handleLeadSubmit} onSkip={handleLeadSkip} />
          )}
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

      {/* "Let's chat" nudge bubble */}
      {showNudge && !open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 flex items-end gap-2 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="relative bg-white text-zinc-900 text-sm font-medium px-4 py-2.5 rounded-2xl rounded-br-sm shadow-xl border border-zinc-100 max-w-[200px]">
            👋 Need help finding the perfect sneaker?
            <button
              type="button"
              onClick={() => setShowNudge(false)}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-zinc-300 text-zinc-600 text-[10px] flex items-center justify-center hover:bg-zinc-400"
            >✕</button>
          </div>
        </div>
      )}

      {/* Floating bubble button — modern 3D sneaker icon */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setShowNudge(false); }}
        className="kickbot-btn fixed bottom-6 right-4 sm:right-6 z-50 w-16 h-16 rounded-full flex items-center justify-center active:scale-95 transition-all duration-200"
        aria-label="Open KickBot"
      >
        {open ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 40 40" className="w-9 h-9" fill="none">
            {/* Sole */}
            <ellipse cx="20" cy="32" rx="15" ry="3.5" fill="#3f3f46" opacity="0.7"/>
            {/* Main shoe body */}
            <path d="M6 26 Q7 20 14 18 L28 17 Q35 17 34 23 L32 27 Q20 29 6 26Z" fill="url(#shoeGrad)"/>
            {/* Toe cap */}
            <path d="M6 26 Q6 21 13 19 L16 19 Q10 21 9 26Z" fill="white" opacity="0.15"/>
            {/* Upper / collar */}
            <path d="M14 18 Q16 12 22 11 L28 11 Q32 12 28 17 Z" fill="url(#upperGrad)"/>
            {/* Laces */}
            <line x1="17" y1="17" x2="17" y2="13" stroke="white" strokeWidth="1" opacity="0.6"/>
            <line x1="20" y1="17" x2="20" y2="12" stroke="white" strokeWidth="1" opacity="0.6"/>
            <line x1="23" y1="17" x2="23" y2="12" stroke="white" strokeWidth="1" opacity="0.6"/>
            <line x1="15" y1="15" x2="25" y2="14" stroke="white" strokeWidth="0.8" opacity="0.4"/>
            <line x1="15" y1="17" x2="25" y2="16" stroke="white" strokeWidth="0.8" opacity="0.4"/>
            {/* Highlight */}
            <path d="M10 23 Q14 20 22 20" stroke="white" strokeWidth="1" opacity="0.2" strokeLinecap="round"/>
            <defs>
              <linearGradient id="shoeGrad" x1="6" y1="17" x2="34" y2="29" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#e4e4e7"/>
                <stop offset="100%" stopColor="#a1a1aa"/>
              </linearGradient>
              <linearGradient id="upperGrad" x1="14" y1="11" x2="28" y2="18" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#52525b"/>
                <stop offset="100%" stopColor="#3f3f46"/>
              </linearGradient>
            </defs>
          </svg>
        )}
      </button>
    </>
  );
}
