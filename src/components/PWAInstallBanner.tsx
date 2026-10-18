import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Share, PlusSquare, ShieldCheck } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA without URL bar)
    const standalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Check if dismissed before
    const isDismissed = localStorage.getItem('tryviet_pwa_dismissed') === 'true';
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

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('tryviet_pwa_dismissed', 'true');
  };

  // If already running standalone (no URL bar), don't show the install banner
  if (isStandalone || dismissed) {
    return null;
  }

  // Only show if prompt is available (Android/Chrome) or on iOS Safari
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  return (
    <>
      {/* Sleek Mobile App Install Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs sm:text-sm sticky top-0 z-50">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Smartphone size={18} className="text-white" />
          </div>
          <div className="truncate">
            <strong className="font-semibold block truncate">Install TryViet App</strong>
            <span className="text-[11px] text-blue-100 truncate block">
              Removes browser URL bar & enables 100% offline access
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="bg-white hover:bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            <Download size={14} /> {isIOS ? 'Add to Home' : 'Install App'}
          </button>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white p-1 rounded-md transition-colors"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  TV
                </div>
                <h3 className="font-bold text-slate-900 text-base">Install on iPhone / iPad</h3>
              </div>
              <button onClick={() => setShowIOSModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              To remove the Safari address bar and use TryViet in full-screen standalone mode:
            </p>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Share size={18} />
                </div>
                <div>
                  <span className="font-bold text-slate-900">1. Tap Share</span>
                  <p className="text-[11px] text-slate-500">Tap the Share icon at the bottom of Safari</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <PlusSquare size={18} />
                </div>
                <div>
                  <span className="font-bold text-slate-900">2. Add to Home Screen</span>
                  <p className="text-[11px] text-slate-500">Scroll down and select "Add to Home Screen"</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <span className="font-bold text-slate-900">3. Open Fullscreen</span>
                  <p className="text-[11px] text-slate-500">Launch from your Home Screen with no URL bar</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
