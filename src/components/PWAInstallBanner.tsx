import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Share, PlusSquare, ShieldCheck } from 'lucide-react';

interface PWAInstallBannerProps {
  forceOpenModal?: boolean;
  onCloseModal?: () => void;
}

export default function PWAInstallBanner({ forceOpenModal, onCloseModal }: PWAInstallBannerProps = {}) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (forceOpenModal) {
      setShowGuideModal(true);
    }
  }, [forceOpenModal]);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Check getInstalledRelatedApps if supported
    const navAny = window.navigator as any;
    if (typeof navAny.getInstalledRelatedApps === 'function') {
      navAny.getInstalledRelatedApps().then((apps: any[]) => {
        if (apps && apps.length > 0) {
          setIsInstalled(true);
        }
      }).catch(() => {});
    }

    // Detect iPhone / iPad / iPod
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('tryviet_pwa_dismissed') === 'true';
    setDismissed(isDismissed);

    // Listen for Android / Desktop Chrome/Edge install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setDismissed(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isIOS) {
      setShowGuideModal(true);
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsInstalled(true);
          setDismissed(true);
        }
      } catch (err) {
        console.warn('Automatic install prompt failed:', err);
      }
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    sessionStorage.setItem('tryviet_pwa_dismissed', 'true');
  };

  const handleCloseModal = () => {
    setShowGuideModal(false);
    if (onCloseModal) onCloseModal();
  };

  // Show banner ONLY when not installed/standalone/dismissed, AND either:
  // - On iPhone/iOS ("How to Install")
  // - On Android/Desktop when native auto-install prompt is ready ("Install on Device")
  const shouldShowBanner = !isStandalone && !isInstalled && !dismissed && (isIOS || Boolean(deferredPrompt));

  return (
    <>
      {shouldShowBanner && (
        <div className="relative z-30 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white px-4 py-2.5 shadow-sm border-b border-blue-500/30">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <Smartphone size={18} className="text-white" />
              </div>
              <div className="truncate">
                <strong className="font-bold block truncate text-white leading-tight">Install TryViet App</strong>
                <span className="text-[11px] text-blue-100 truncate block">
                  Removes browser URL bar & enables 100% offline access
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
                <span>{isIOS ? 'How to Install' : 'Install on Device'}</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-white/70 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer touch-manipulation active:scale-90"
                title="Dismiss banner"
                aria-label="Dismiss banner"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iPhone / Safari Step-by-Step Install Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-sm sm:max-w-md p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <img src="/icons/icon.svg" alt="TryViet" className="w-8 h-8 object-contain shrink-0" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-tight">Add to Home Screen (iPhone)</h3>
                  <p className="text-[11px] text-slate-500">Removes URL bar so it runs full-screen</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleCloseModal} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl active:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Share size={18} />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">1. Tap Safari Share Icon</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Tap the Share icon at the bottom of Safari</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <PlusSquare size={18} />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">2. Tap "Add to Home Screen"</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Scroll down and tap "Add to Home Screen", then "Add"</p>
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

            <button
              type="button"
              onClick={handleCloseModal}
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
