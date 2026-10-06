'use client';

import { Suspense, useEffect, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sellerApi } from '@/lib/sellerApi';
import {
  useSeller,
  useHandleApiError,
  useToast,
  Toast,
  Panel,
  PageHeader,
  LoadingBlock,
  inputClass,
  labelClass,
  btnPrimary,
  btnSecondary,
  formatDate,
} from '@/components/seller/SellerShell';

function SettingsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { seller, refresh, logout } = useSeller();
  const handleError = useHandleApiError();
  const { toast, show } = useToast();
  const forceReset = params.get('reset') === '1' || seller.mustChangePassword;

  const [profile, setProfile] = useState({
    name: seller.name,
    phone: seller.phone,
    businessName: seller.businessName,
    addressLine: seller.addressLine ?? '',
    city: seller.city,
    state: seller.state ?? '',
    pincode: seller.pincode ?? '',
    whatsapp: seller.whatsapp,
    upiId: seller.upiId,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setProfile({
      name: seller.name,
      phone: seller.phone,
      businessName: seller.businessName,
      addressLine: seller.addressLine ?? '',
      city: seller.city,
      state: seller.state ?? '',
      pincode: seller.pincode ?? '',
      whatsapp: seller.whatsapp,
      upiId: seller.upiId,
    });
  }, [seller]);

  function setField(key: keyof typeof profile, value: string) {
    setProfileError('');
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileError('');
    if (!profile.name.trim()) {
      setProfileError('Name is required');
      return;
    }
    if (!profile.phone.trim()) {
      setProfileError('Phone is required');
      return;
    }
    setSavingProfile(true);
    try {
      await sellerApi.updateMe({
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        businessName: profile.businessName.trim(),
        addressLine: profile.addressLine.trim(),
        city: profile.city.trim(),
        state: profile.state.trim(),
        pincode: profile.pincode.trim(),
        whatsapp: profile.whatsapp.trim(),
        upiId: profile.upiId.trim(),
      });
      await refresh();
      show('Profile saved');
    } catch (err) {
      setProfileError(handleError(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('Choose a password different from your current one');
      return;
    }
    setSavingPassword(true);
    try {
      await sellerApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refresh();
      if (forceReset) {
        router.replace('/sellers');
        return;
      }
      show('Password updated');
    } catch (err) {
      setPasswordError(handleError(err));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Account" title="Settings" description={forceReset ? undefined : 'Your contact details and the UPI ID we pay you on.'} />

      {forceReset && (
        <div className="border border-amber-300 bg-amber-50 px-5 py-4 mb-6">
          <p className="text-[10px] font-bold tracking-widest uppercase text-amber-700 mb-1">Action required</p>
          <p className="text-base font-black tracking-tight text-amber-900">Set a new password to continue</p>
          <p className="text-sm text-amber-800 mt-1">You are using a temporary password from SNKRS CART. Choose your own to unlock the portal.</p>
        </div>
      )}

      <div className={forceReset ? 'max-w-lg' : 'grid lg:grid-cols-2 gap-6 items-start'}>
        {!forceReset && (
          <Panel>
            <form onSubmit={saveProfile}>
              <div className="px-5 py-4 border-b border-zinc-100">
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Profile</p>
                <p className="text-xs text-zinc-400 mt-1">Logged in as {seller.email}</p>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pf-name" className={labelClass}>Name *</label>
                    <input id="pf-name" value={profile.name} onChange={(e) => setField('name', e.target.value)} required maxLength={100} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="pf-phone" className={labelClass}>Phone *</label>
                    <input id="pf-phone" type="tel" inputMode="tel" value={profile.phone} onChange={(e) => setField('phone', e.target.value)} required maxLength={20} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label htmlFor="pf-business" className={labelClass}>Business name</label>
                  <input id="pf-business" value={profile.businessName} onChange={(e) => setField('businessName', e.target.value)} maxLength={120} placeholder="Optional" className={inputClass} />
                </div>
                <div className="border border-zinc-200 p-4 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-900">Shipping address</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Where you ship from. Used for courier pickups and returns of your pairs.</p>
                  </div>
                  <div>
                    <label htmlFor="pf-address" className={labelClass}>Address line *</label>
                    <input id="pf-address" value={profile.addressLine} onChange={(e) => setField('addressLine', e.target.value)} maxLength={300} placeholder="House / shop no., street, area" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="pf-city" className={labelClass}>City *</label>
                      <input id="pf-city" value={profile.city} onChange={(e) => setField('city', e.target.value)} maxLength={80} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="pf-state" className={labelClass}>State *</label>
                      <input id="pf-state" value={profile.state} onChange={(e) => setField('state', e.target.value)} maxLength={80} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="pf-pincode" className={labelClass}>Pincode *</label>
                      <input id="pf-pincode" inputMode="numeric" pattern="[0-9]{6}" value={profile.pincode} onChange={(e) => setField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} placeholder="6 digits" className={inputClass} />
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="pf-whatsapp" className={labelClass}>WhatsApp number</label>
                  <input id="pf-whatsapp" type="tel" inputMode="tel" value={profile.whatsapp} onChange={(e) => setField('whatsapp', e.target.value)} maxLength={16} placeholder="91XXXXXXXXXX" className={inputClass} />
                  <p className="text-[11px] text-zinc-400 mt-1">SNKRS CART uses this to share shipping details for your orders.</p>
                </div>
                <div>
                  <label htmlFor="pf-upi" className={labelClass}>UPI ID</label>
                  <input id="pf-upi" value={profile.upiId} onChange={(e) => setField('upiId', e.target.value)} maxLength={80} placeholder="name@bank" autoCapitalize="none" autoCorrect="off" className={inputClass} />
                  <p className="text-[11px] text-zinc-400 mt-1">Payouts are sent to this UPI ID after delivery.</p>
                </div>
                {profileError && <p className="text-xs text-red-600 font-medium">{profileError}</p>}
              </div>
              <div className="px-5 py-4 border-t border-zinc-100 flex items-center justify-between gap-3">
                <p className="text-[11px] text-zinc-400">Seller since {formatDate(seller.createdAt)}</p>
                <button type="submit" disabled={savingProfile} className={btnPrimary}>
                  {savingProfile ? 'Saving...' : 'Save profile'}
                </button>
              </div>
            </form>
          </Panel>
        )}

        <div className="space-y-6">
          <Panel>
            <form onSubmit={savePassword}>
              <div className="px-5 py-4 border-b border-zinc-100">
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">{forceReset ? 'New password' : 'Change password'}</p>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div>
                  <label htmlFor="pw-current" className={labelClass}>{forceReset ? 'Temporary password' : 'Current password'}</label>
                  <input
                    id="pw-current"
                    type={showPasswords ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => { setPasswordError(''); setCurrentPassword(e.target.value); }}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="pw-new" className={labelClass}>New password</label>
                  <input
                    id="pw-new"
                    type={showPasswords ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => { setPasswordError(''); setNewPassword(e.target.value); }}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="pw-confirm" className={labelClass}>Confirm new password</label>
                  <input
                    id="pw-confirm"
                    type={showPasswords ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => { setPasswordError(''); setConfirmPassword(e.target.value); }}
                    required
                    minLength={8}
                    className={inputClass}
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-zinc-600 min-h-[40px] cursor-pointer">
                  <input type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)} className="w-4 h-4 accent-zinc-900" />
                  Show passwords
                </label>
                {passwordError && <p className="text-xs text-red-600 font-medium">{passwordError}</p>}
              </div>
              <div className="px-5 py-4 border-t border-zinc-100 flex justify-end">
                <button type="submit" disabled={savingPassword} className={`${btnPrimary} ${forceReset ? 'w-full' : ''}`}>
                  {savingPassword ? 'Saving...' : forceReset ? 'Set password and continue' : 'Update password'}
                </button>
              </div>
            </form>
          </Panel>

          <Panel className="px-5 py-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-zinc-900">Log out</p>
              <p className="text-xs text-zinc-400">Signs you out on this device.</p>
            </div>
            <button type="button" onClick={logout} className={btnSecondary}>
              Log out
            </button>
          </Panel>
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}

export default function SellerSettingsPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading settings" />}>
      <SettingsInner />
    </Suspense>
  );
}
