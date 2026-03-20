'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import OtpInput from '@/components/auth/OtpInput';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SHIPPING_THRESHOLD = 3000;
const SHIPPING_COST = 199;

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry',
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { user, isLoggedIn, loading: authLoading, openAuthModal, refreshUser } = useAuth();
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [contact, setContact] = useState({ name: '', email: '', phone: '' });
  const [address, setAddress] = useState({ addressLine: '', city: '', state: '', pincode: '' });

  // OTP verification at review step
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Auto-fill from user profile when logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      setContact((prev) => ({
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
      // Auto-select default address
      const defaultAddr = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];
      if (defaultAddr && !address.addressLine) {
        setAddress({
          addressLine: defaultAddr.addressLine,
          city: defaultAddr.city,
          state: defaultAddr.state,
          pincode: defaultAddr.pincode,
        });
      }
    }
  }, [isLoggedIn, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // If already logged in, skip OTP verification
  useEffect(() => {
    if (isLoggedIn) setOtpVerified(true);
  }, [isLoggedIn]);

  // OTP countdown
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  function setC(k: string, v: string) { setContact((p) => ({ ...p, [k]: v })); }
  function setA(k: string, v: string) { setAddress((p) => ({ ...p, [k]: v })); }

  function validateContact() {
    if (!contact.name.trim()) return 'Full name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) return 'Valid email is required';
    const cleanPhone = contact.phone.trim().replace(/[\s\-()]/g, '');
    if (!/^(\+91|91)?[6-9]\d{9}$/.test(cleanPhone)) return 'Enter a valid Indian phone number (10 digits starting with 6-9)';
    return null;
  }

  function validateAddress() {
    if (!address.addressLine.trim()) return 'Address is required';
    if (!address.city.trim()) return 'City is required';
    if (!address.state) return 'State is required';
    if (!/^\d{6}$/.test(address.pincode.trim())) return 'Valid 6-digit pincode is required';
    return null;
  }

  function handleNextStep(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (step === 1) {
      const err = validateContact();
      if (err) { setError(err); return; }
      setStep(2);
    } else if (step === 2) {
      const err = validateAddress();
      if (err) { setError(err); return; }
      setStep(3);
    }
  }

  async function sendCheckoutOtp() {
    setOtpError('');
    setOtpLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: contact.email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Failed to send code');
        if (data.retryAfter) setOtpCountdown(data.retryAfter);
        return;
      }
      setOtpSent(true);
      setOtpCountdown(60);
      setOtpValues(Array(6).fill(''));
    } catch {
      setOtpError('Something went wrong. Try again.');
    } finally {
      setOtpLoading(false);
    }
  }

  async function verifyCheckoutOtp(code: string) {
    setOtpError('');
    setOtpLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: contact.email.trim(),
          otp: code,
          name: contact.name.trim(),
          phone: contact.phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Invalid code');
        setOtpValues(Array(6).fill(''));
        return;
      }
      setOtpVerified(true);
      await refreshUser();
    } catch {
      setOtpError('Something went wrong. Try again.');
    } finally {
      setOtpLoading(false);
    }
  }

  async function handlePlaceOrder() {
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...contact,
        ...address,
        items: items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          brand: item.product.brand,
          size: String(item.size),
          colorway: item.product.colorway || '',
          price: item.product.price,
          qty: item.quantity,
          image: item.product.images?.[0] || '',
        })),
        subtotal,
        shipping,
        total,
      };

      const res = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');

      clearCart();
      router.push(`/checkout/confirmation?id=${data.orderId}&order=${data.orderNumber}&total=${total}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (items.length === 0 && step !== 3) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <p className="text-lg font-bold text-zinc-900 mb-2">Your bag is empty</p>
        <p className="text-sm text-zinc-500 mb-8">Add some sneakers before checking out.</p>
        <Link href="/products" className="inline-block bg-zinc-900 text-white px-8 py-3 text-sm font-bold tracking-widest uppercase hover:bg-zinc-700 transition-colors">
          Shop Now
        </Link>
      </div>
    );
  }


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10">
        {(['Contact', 'Address', 'Review'] as const).map((label, i) => {
          const s = (i + 1) as 1 | 2 | 3;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className={`h-px w-8 sm:w-16 ${step > i ? 'bg-zinc-900' : 'bg-zinc-200'}`} />}
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                  {step > s ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s}
                </div>
                <span className={`text-xs font-bold tracking-widest uppercase hidden sm:block ${step >= s ? 'text-zinc-900' : 'text-zinc-400'}`}>{label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
        {/* Left — form */}
        <div>
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-5">
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-900 mb-1">Contact Details</p>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1.5">Full Name *</label>
                <input
                  type="text" required value={contact.name}
                  onChange={(e) => setC('name', e.target.value)}
                  placeholder="Your full name"
                  className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1.5">Email *</label>
                <input
                  type="email" required value={contact.email}
                  onChange={(e) => setC('email', e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1.5">Phone / WhatsApp *</label>
                <input
                  type="tel" required value={contact.phone}
                  onChange={(e) => setC('phone', e.target.value)}
                  placeholder="98765 43210"
                  maxLength={15}
                  inputMode="tel"
                  className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                />
                <p className="text-[10px] text-zinc-400 mt-1">Indian number — 10 digits starting with 6, 7, 8, or 9</p>
              </div>
              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              <button type="submit" className="w-full py-3.5 bg-zinc-900 text-white text-sm font-bold tracking-widest uppercase hover:bg-zinc-700 transition-colors">
                Continue to Address →
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNextStep} className="space-y-5">
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-900 mb-1">Delivery Address</p>

              {/* Saved addresses quick select */}
              {isLoggedIn && user?.addresses && user.addresses.length > 0 && (
                <div className="space-y-2 mb-2">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">Saved Addresses</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {user.addresses.map((a) => (
                      <button
                        key={a._id}
                        type="button"
                        onClick={() => setAddress({ addressLine: a.addressLine, city: a.city, state: a.state, pincode: a.pincode })}
                        className={`text-left p-3 border rounded-lg text-xs transition ${
                          address.addressLine === a.addressLine && address.pincode === a.pincode
                            ? 'border-zinc-900 bg-zinc-50'
                            : 'border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        <p className="font-semibold text-zinc-900">{a.addressLine}</p>
                        <p className="text-zinc-500">{a.city}, {a.state} — {a.pincode}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-400">Or enter a new address below</p>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1.5">Address Line *</label>
                <input
                  type="text" required value={address.addressLine}
                  onChange={(e) => setA('addressLine', e.target.value)}
                  placeholder="House/Flat no., Street, Area"
                  className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1.5">City *</label>
                  <input
                    type="text" required value={address.city}
                    onChange={(e) => setA('city', e.target.value)}
                    placeholder="City"
                    className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1.5">Pincode *</label>
                  <input
                    type="text" required value={address.pincode}
                    onChange={(e) => setA('pincode', e.target.value)}
                    placeholder="6-digit pincode"
                    maxLength={6}
                    className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1.5">State *</label>
                <select
                  required value={address.state}
                  onChange={(e) => setA('state', e.target.value)}
                  className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors bg-white"
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3.5 border border-zinc-200 text-sm font-bold tracking-widest uppercase text-zinc-700 hover:border-zinc-900 transition-colors">
                  ← Back
                </button>
                <button type="submit" className="flex-[2] py-3.5 bg-zinc-900 text-white text-sm font-bold tracking-widest uppercase hover:bg-zinc-700 transition-colors">
                  Review Order →
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-900">Review Your Order</p>

              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-zinc-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Contact</p>
                    <button onClick={() => setStep(1)} className="text-[10px] text-zinc-400 hover:text-zinc-900 underline">Edit</button>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">{contact.name}</p>
                  <p className="text-xs text-zinc-500">{contact.email}</p>
                  <p className="text-xs text-zinc-500">{contact.phone}</p>
                </div>
                <div className="border border-zinc-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Delivery</p>
                    <button onClick={() => setStep(2)} className="text-[10px] text-zinc-400 hover:text-zinc-900 underline">Edit</button>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">{address.addressLine}</p>
                  <p className="text-xs text-zinc-500">{address.city}, {address.state} — {address.pincode}</p>
                </div>
              </div>

              {/* Items */}
              <div className="border border-zinc-100">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="flex gap-4 p-4 border-b border-zinc-100 last:border-0">
                    <div className="relative w-16 h-16 bg-zinc-50 shrink-0">
                      {item.product.images?.[0] && (
                        <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="64px" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">{item.product.brand}</p>
                      <p className="text-sm font-semibold text-zinc-900 truncate">{item.product.name}</p>
                      <p className="text-xs text-zinc-500">UK {item.size} · Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-zinc-900 shrink-0">{formatPrice(item.product.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* Email verification */}
              {!otpVerified && (
                <div className="border-2 border-zinc-900 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    <p className="text-sm font-bold text-zinc-900">Verify your email to place order</p>
                  </div>
                  <p className="text-xs text-zinc-500 mb-4">
                    We&apos;ll send a 6-digit code to <span className="font-semibold text-zinc-700">{contact.email}</span> to verify your identity.
                  </p>

                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={sendCheckoutOtp}
                      disabled={otpLoading}
                      className="w-full py-3 bg-zinc-900 text-white text-sm font-bold tracking-widest uppercase rounded-lg hover:bg-zinc-700 disabled:bg-zinc-400 transition-colors"
                    >
                      {otpLoading ? 'Sending...' : 'Send Verification Code'}
                    </button>
                  ) : (
                    <div>
                      <p className="text-xs text-zinc-500 mb-3 text-center">Enter the code sent to your email</p>
                      <OtpInput value={otpValues} onChange={setOtpValues} onComplete={verifyCheckoutOtp} />
                      {otpLoading && <p className="text-xs text-zinc-400 text-center mt-3">Verifying...</p>}
                      <div className="flex items-center justify-between mt-4">
                        <button type="button" onClick={() => { setOtpSent(false); setOtpError(''); }} className="text-xs text-zinc-500 hover:text-zinc-900 transition">
                          Change email
                        </button>
                        {otpCountdown > 0 ? (
                          <span className="text-xs text-zinc-400">Resend in {otpCountdown}s</span>
                        ) : (
                          <button type="button" onClick={sendCheckoutOtp} className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 transition">
                            Resend code
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {otpError && <p className="text-xs text-red-500 mt-3 text-center">{otpError}</p>}
                </div>
              )}

              {otpVerified && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-xs font-semibold text-emerald-700">Email verified{isLoggedIn ? ` — signed in as ${user?.email}` : ''}</p>
                </div>
              )}

              {/* Payment note */}
              <div className="bg-amber-50 border border-amber-200 rounded p-4">
                <p className="text-xs font-bold text-amber-800 mb-1">Payment via UPI</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  After placing your order, you&apos;ll receive UPI payment instructions. Pay via PhonePe, Google Pay, or Paytm and send a screenshot on WhatsApp with your order number.
                </p>
              </div>

              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="flex-1 py-3.5 border border-zinc-200 text-sm font-bold tracking-widest uppercase text-zinc-700 hover:border-zinc-900 transition-colors">
                  Back
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={loading || !otpVerified}
                  className="flex-[2] py-3.5 bg-zinc-900 text-white text-sm font-bold tracking-widest uppercase hover:bg-zinc-700 disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors"
                >
                  {loading ? 'Placing Order...' : `Place Order — ${formatPrice(total)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right — order summary */}
        <div className="lg:sticky lg:top-8 self-start">
          <div className="border border-zinc-100 p-6">
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-900 mb-4">Order Summary</p>
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.size}`} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 bg-zinc-50 shrink-0">
                    {item.product.images?.[0] && (
                      <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="48px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 truncate">{item.product.name}</p>
                    <p className="text-[10px] text-zinc-400">UK {item.size} · Qty {item.quantity}</p>
                  </div>
                  <p className="text-xs font-bold text-zinc-900 shrink-0">{formatPrice(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-zinc-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Shipping</span>
                <span className={`font-semibold ${shipping === 0 ? 'text-emerald-600' : ''}`}>
                  {shipping === 0 ? 'Free' : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-zinc-100">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 text-center mt-4 leading-relaxed">
            Delivery in 3–7 business days after payment confirmation.
          </p>
        </div>
      </div>
    </div>
  );
}
