import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { APP_CONFIG } from '../../config/appConfig';
import { Flame, Lock, Mail, User, ArrowRight, ShieldCheck, Shield } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { loginEmail, registerEmail, loginCashier, error: authError } = useAuth();
  const { success, error: toastError } = useToast();
  const { isOnline } = useNetworkStatus();

  const [mode, setMode] = useState<'quick' | 'login' | 'register'>('quick');
  const [cashierName, setCashierName] = useState<string>('کاشێری سەرەکی');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      toastError('پەیوەندی ئینتەرنێت پچڕاوە');
      return;
    }
    try {
      setIsSubmitting(true);
      setLocalError(null);
      await loginCashier(cashierName.trim() || 'کاشێری سەرەکی');
      success(`بەخێربێیت ${cashierName.trim() || 'کاشێری سەرەکی'}`);
    } catch (err: any) {
      setLocalError(err.message || 'چوونەژوورەوە سەرکەوتوو نەبوو');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      toastError('پەیوەندی ئینتەرنێت پچڕاوە');
      return;
    }
    if (!email || !password) {
      setLocalError('تکایە هەردوو خانەی ئیمەیڵ و وشەی نهێنی پڕبکەرەوە');
      return;
    }

    try {
      setIsSubmitting(true);
      setLocalError(null);

      if (mode === 'login') {
        await loginEmail(email, password);
        success('چوونەژوورەوە سەرکەوتوو بوو');
      } else {
        if (!displayName) {
          setLocalError('تکایە ناوی تەواو بنووسە');
          setIsSubmitting(false);
          return;
        }
        await registerEmail(email, password, displayName);
        success('هەژمار بە سەرکەوتوویی دروستکرا');
      }
    } catch (err: any) {
      setLocalError(err.message || 'کرداری چوونەژوورەوە سەرکەوتوو نەبوو');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50/70 text-gray-800 flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 bg-orange-500 text-white rounded-3xl shadow-lg">
            <Flame className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
            {APP_CONFIG.restaurantName}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-bold">
            {APP_CONFIG.systemName}
          </p>
        </div>

        {/* Auth Card */}
        <Card className="p-6 sm:p-8 bg-white border-2 border-orange-100 shadow-xl text-right rounded-3xl">
          {/* Mode Switcher */}
          <div className="flex rounded-2xl bg-orange-50 p-1.5 mb-6 border border-orange-100">
            <button
              type="button"
              onClick={() => {
                setMode('quick');
                setLocalError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                mode === 'quick'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              کاشێری خێرا
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLocalError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              چوونەژوورەوە
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setLocalError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              تۆمارکردن
            </button>
          </div>

          {/* Quick Cashier Mode */}
          {mode === 'quick' && (
            <form onSubmit={handleQuickLogin} className="space-y-4">
              <div className="p-3.5 bg-orange-50 border border-orange-100 rounded-2xl text-xs text-orange-900 leading-relaxed font-semibold">
                دەستپێکردنی خێرای POS بە ناوی کاشێر بۆ چێشتخانە.
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5 justify-end">
                  <span>ناوی کاشێر یان بەڕێوەبەر</span>
                  <User className="w-3.5 h-3.5 text-gray-400" />
                </label>
                <input
                  id="quick-cashier-name-input"
                  type="text"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  placeholder="ناوی کاشێر بنووسە..."
                  required
                  className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 min-h-[46px] text-right"
                />
              </div>

              {(localError || authError) && (
                <p className="text-xs text-red-600 bg-red-50 p-3 rounded-2xl border border-red-100 font-bold">
                  {localError || authError}
                </p>
              )}

              <Button
                id="quick-login-submit-btn"
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                disabled={!isOnline}
                className="font-black gap-2 custom-shadow py-3.5 rounded-2xl text-base"
              >
                <span>چوونەژوورەوەی کاشێر</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </Button>
            </form>
          )}

          {/* Email / Password Login & Register Mode */}
          {(mode === 'login' || mode === 'register') && (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5 justify-end">
                    <span>ناوی بەکارهێنەر</span>
                    <User className="w-3.5 h-3.5 text-gray-400" />
                  </label>
                  <input
                    id="auth-name-input"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="نموونە: ئارام ئەحمەد"
                    required
                    className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 min-h-[46px] text-right"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5 justify-end">
                  <span>ئیمەیڵ (Email)</span>
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                </label>
                <input
                  id="auth-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cashier@restaurant.com"
                  required
                  className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 min-h-[46px] text-right"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5 justify-end">
                  <span>وشەی نهێنی (Password)</span>
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                </label>
                <input
                  id="auth-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 min-h-[46px] text-right"
                  dir="ltr"
                />
              </div>

              {(localError || authError) && (
                <p className="text-xs text-red-600 bg-red-50 p-3 rounded-2xl border border-red-100 font-bold">
                  {localError || authError}
                </p>
              )}

              <Button
                id="email-auth-submit-btn"
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                disabled={!isOnline}
                className="font-black gap-2 custom-shadow py-3.5 rounded-2xl text-base"
              >
                <span>{mode === 'login' ? 'چوونەژوورەوە' : 'دروستکردنی هەژمار'}</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </Button>
            </form>
          )}

          {/* Security note */}
          <div className="mt-6 pt-4 border-t border-orange-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>پارێزراوە لە ڕێگەی Firebase Authentication و Cloud Firestore</span>
          </div>
        </Card>

        {/* Provider Attribution Footer */}
        <div className="text-center space-y-1 pt-2">
          <div className="flex items-center justify-center gap-1 text-xs font-bold text-gray-600">
            <Shield className="w-3.5 h-3.5 text-orange-500" />
            <span>{APP_CONFIG.providerAttributionKurdish}</span>
          </div>
          <p className="text-[10px] text-gray-400 font-medium">
            {APP_CONFIG.providerAttribution}
          </p>
        </div>
      </div>
    </div>
  );
};

