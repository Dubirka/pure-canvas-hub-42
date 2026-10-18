import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Share, PlusSquare, ShieldCheck, MoreVertical, Chrome, Apple, Laptop } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA without URL bar)
    const standalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);
    setActiveTab(isIosDevice ? 'ios' : 'android');

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('tryviet_pwa_dismissed') === 'true';
    setDismissed(isDismissed);

    // Listen for Android / Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If native prompt is available (Chrome/Android), trigger it
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setDeferredPrompt(null);
          setDismissed(true);
          return;
        }
      } catch (err) {
        console.warn('Native install prompt failed, showing guide:', err);
      }
    }

    // Always fallback to the visual instruction modal so the button NEVER fails to respond
    setShowGuideModal(true);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    sessionStorage.setItem('tryviet_pwa_dismissed', 'true');
  };

  // If already running standalone (no URL bar) or dismissed, don't show the top banner
  if (isStandalone || dismissed) {
    return null;
  }

  return (
    <>
      {/* Sleek Mobile App Install Banner - Relative positioning to never overlap sticky header */}
      <div className="relative z-30 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white px-4 py-2.5 shadow-sm border-b border-blue-500/30">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <Smartphone size={18} className="text-white" />
            </div>
            <div className="truncate">
              <strong className="font-bold block truncate text-white leading-tight">Install TryViet App</strong>
              <span className="text-[11px] text-blue-100 truncate block">
                Removes URL bar & enables 100% offline access
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="bg-white hover:bg-blue-50 active:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer touch-manipulation"
            >
              <Download size={14} className="shrink-0" />
              <span>{deferredPrompt ? 'Install App' : (isIOS ? 'Add to Home' : 'How to Install')}</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-white/70 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer touch-manipulation active:scale-90"
              title="Dismiss for this session"
              aria-label="Dismiss banner"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Universal Step-by-Step Install Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-sm sm:max-w-md p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  TV
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-tight">Install Mobile App</h3>
                  <p className="text-[11px] text-slate-500">Run full-screen without the browser URL bar</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowGuideModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl active:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'ios' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Apple size={14} /> iPhone / Safari
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'android' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Chrome size={14} /> Android / Chrome
              </button>
            </div>

            {/* iOS Instructions */}
            {activeTab === 'ios' && (
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Share size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">1. Tap Safari Share</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Tap the Share icon at the bottom of Safari</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <PlusSquare size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">2. Add to Home Screen</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Scroll down and tap "Add to Home Screen"</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">3. Open from Home Screen</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Launches full screen with no address bar</p>
                  </div>
                </div>
              </div>
            )}

            {/* Android Instructions */}
            {activeTab === 'android' && (
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <MoreVertical size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">1. Tap Chrome Menu</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Tap the 3 dots in the top right corner</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Download size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">2. Tap "Install App"</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Or tap "Add to Home Screen"</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">3. Open App</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Launches in standalone mode with no URL bar</p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 rounded-2xl text-xs transition-colors cursor-pointer"
            >
              Got It, Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
