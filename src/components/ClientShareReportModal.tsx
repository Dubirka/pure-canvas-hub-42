import React, { useState } from 'react';
import { 
  ShieldCheck, X, Copy, Check, Printer, Wifi, Volume2, Bed, Laptop, 
  ShowerHead, Coffee, Wind, Building, ExternalLink, AlertTriangle, Sparkles, CheckCircle2, XCircle
} from 'lucide-react';
import type { Inspection } from '../services/supabaseStorage';

interface ClientShareReportModalProps {
  inspection: Inspection;
  onClose: () => void;
}

export default function ClientShareReportModal({ inspection, onClose }: ClientShareReportModalProps) {
  const [copied, setCopied] = useState(false);
  const data = inspection.checklistData || {};

  // Formatted date
  const dateStr = inspection.updatedAt 
    ? new Date(typeof inspection.updatedAt === 'number' ? inspection.updatedAt : (inspection.updatedAt?.seconds ? inspection.updatedAt.seconds * 1000 : Date.now())).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // Specs extraction
  const downloadMbps = data['c1_7_dl'] || '--';
  const uploadMbps = data['c1_7_ul'] || '--';
  const pingMs = data['c1_wifi_ping'] || '--';
  const isp = data['c1_wifi_isp'] || 'Standard Fiber';
  const dedicatedRouter = data['c1_7_router'] === true;

  const dbOpen = data['c1_6_db_open'] || '--';
  const dbClosed = data['c1_6_db_closed'] || '--';

  const mattressFeel = data['c1_5_mattress'] || 'Standard';
  const bedSize = data['c1_bed_size'] || 'Queen (1.6m)';
  const mattressTopper = data['c1_mattress_upgrade'] || (data['c1_5_topper'] ? 'Topper Provided' : 'Standard');

  const showerLayout = data['c4_shower_layout'] || 'Standard';
  const hotWaterTank = data['c4_tank_size'] || (data['c4_heater'] || 'Standard Electric');
  const sewerTrap = data['c4_sewer_trap'] === true;
  const waterPressure = data['c4_1'] === true;

  const deskSetup = data['c2_1'] === true;
  const ergoChair = data['c2_2'] === true;
  const grounding = data['c2_grounding'] || 'Standard';

  const stoveType = data['c3_stove'] || 'Induction';
  const fridgeSize = data['c3_fridge_size'] || 'Standard';

  const acCoverage = data['c5_ac_coverage'] || 'Air Conditioned';
  const windowOrientation = data['c5_window_orientation'] || 'Natural Light';
  const bugScreens = data['c5_bug_screens'] || 'Standard';

  const rentVnd = data['c7_rent_amount'] ? `${Number(data['c7_rent_amount']).toLocaleString('en-US')} VND` : 'Inquire with TryViet';
  const elecRate = data['c7_elec_rate'] ? `${data['c7_elec_rate']} VND/kWh` : 'Standard Rate';

  const verdictScore = inspection.verdictScore || 'Approved - Soft Landing Only';
  const isPremiumApproved = verdictScore.toLowerCase().includes('premium');
  const isSoftLanding = verdictScore.toLowerCase().includes('soft');
  const isRejected = verdictScore.toLowerCase().includes('reject');

  const bestFor = inspection.verdictBestFor || [];
  const catchFlaw = inspection.verdictCatch || '';

  const handleCopySummary = () => {
    const summaryText = `🏠 TryViet Property Audit: ${inspection.propertyName || 'TryViet Vetted Apartment'}
📍 Area: ${inspection.neighborhood || 'Da Nang, Vietnam'} • ${inspection.unitFloor || 'Private Unit'}
🏆 Verdict: ${verdictScore}
${bestFor.length > 0 ? `✨ Ideal For: ${bestFor.join(', ')}\n` : ''}
⚡ Wi-Fi: ${downloadMbps} Mbps DL / ${uploadMbps} Mbps UL (${pingMs} ms ping) • ${dedicatedRouter ? 'Dedicated Router in Room' : 'Shared Router'}
🔇 Sound: ${dbClosed} dB (Windows closed) vs ${dbOpen} dB (Windows open)
🛏️ Bed: ${bedSize} • Mattress: ${mattressFeel} (${mattressTopper})
🚿 Shower: ${showerLayout} • Hot Water: ${hotWaterTank} • ${sewerTrap ? 'Anti-Odor P-Trap Verified' : 'Standard'}
💻 Remote Work: ${deskSetup ? 'Dedicated Desk' : 'Table'} • ${ergoChair ? 'Ergo Chair' : 'Standard Chair'} • ${grounding}
❄️ AC & Climate: ${acCoverage} • ${windowOrientation}
${catchFlaw ? `\n⚠️ The Honest Catch: ${catchFlaw}\n` : ''}
Verified by TryViet Quality Assurance Team (tryviet.com)`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-slate-200 print:shadow-none print:border-none print:max-h-none print:overflow-visible my-auto">
        
        {/* Top Action Bar (Hidden in Print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-20 print:hidden">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck size={14} /> Client-Safe Mode (Confidential details hidden)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? 'Copied Summary!' : 'Copy Text Summary'}
            </button>
            <button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Certificate Content */}
        <div className="p-6 sm:p-10 space-y-8">
          
          {/* Header Banner */}
          <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-bold text-xl tracking-tight text-blue-600">TRYVIET</span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-200">
                  Apartment Inspection & Quality Certificate
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {inspection.propertyName || 'Verified Da Nang Residence'}
              </h1>
              <p className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                <span>📍 {inspection.neighborhood || 'Da Nang, Vietnam'}</span>
                {inspection.unitFloor && (
                  <>
                    <span>•</span>
                    <span>🏢 {inspection.unitFloor}</span>
                  </>
                )}
                <span>•</span>
                <span>📅 Inspected: {dateStr}</span>
              </p>
            </div>

            {/* Verdict Badge */}
            <div className="shrink-0">
              {isPremiumApproved && (
                <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-800 px-4 py-2.5 rounded-xl text-center shadow-sm">
                  <div className="flex items-center gap-1.5 justify-center font-bold text-sm">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    APPROVED FOR SIGHT-UNSEEN
                  </div>
                  <span className="text-[11px] font-medium text-emerald-600 block mt-0.5">
                    TryViet Premium Tier Verified
                  </span>
                </div>
              )}
              {isSoftLanding && (
                <div className="bg-blue-50 border-2 border-blue-500 text-blue-800 px-4 py-2.5 rounded-xl text-center shadow-sm">
                  <div className="flex items-center gap-1.5 justify-center font-bold text-sm">
                    <CheckCircle2 size={18} className="text-blue-600" />
                    APPROVED: SOFT LANDING
                  </div>
                  <span className="text-[11px] font-medium text-blue-600 block mt-0.5">
                    Recommended for In-Person Day 2 Blitz
                  </span>
                </div>
              )}
              {isRejected && (
                <div className="bg-red-50 border-2 border-red-500 text-red-800 px-4 py-2.5 rounded-xl text-center shadow-sm">
                  <div className="flex items-center gap-1.5 justify-center font-bold text-sm">
                    <XCircle size={18} className="text-red-600" />
                    NOT RECOMMENDED
                  </div>
                  <span className="text-[11px] font-medium text-red-600 block mt-0.5">
                    Unresolved Dealbreakers Found
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Best For Tags & Video Link */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {bestFor.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Best For:</span>
                {bestFor.map(tag => (
                  <span key={tag} className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-full font-medium border border-slate-200">
                    ✨ {tag}
                  </span>
                ))}
              </div>
            )}
            {inspection.videoUrl && (
              <a
                href={inspection.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors print:hidden"
              >
                <ExternalLink size={14} /> Watch Inspector Video Walkthrough
              </a>
            )}
          </div>

          {/* The Catch: Honest Flaw Section */}
          {catchFlaw && (
            <div className="bg-amber-50/80 border border-amber-300/80 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 text-amber-700 p-2 rounded-xl shrink-0 mt-0.5">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    The Honest Catch (TryViet Inspector Note)
                  </h3>
                  <p className="text-slate-700 text-sm leading-relaxed mt-1">
                    {catchFlaw}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Wi-Fi Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <div className="w-8 h-8 mx-auto bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-2">
                <Wifi size={18} />
              </div>
              <div className="text-xs text-slate-500 font-medium">Download Speed</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{downloadMbps} <span className="text-xs font-normal">Mbps</span></div>
              <div className="text-[11px] text-slate-500 mt-1">
                {uploadMbps} Mbps UL • {pingMs} ms
              </div>
              <div className="text-[10px] text-blue-600 font-semibold mt-1">
                {dedicatedRouter ? '✓ Private Router' : 'Floor Router'}
              </div>
            </div>

            {/* Noise Level Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <div className="w-8 h-8 mx-auto bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-2">
                <Volume2 size={18} />
              </div>
              <div className="text-xs text-slate-500 font-medium">Closed Window Noise</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{dbClosed} <span className="text-xs font-normal">dB</span></div>
              <div className="text-[11px] text-slate-500 mt-1">
                Open: {dbOpen} dB
              </div>
              <div className="text-[10px] text-slate-600 font-semibold mt-1">
                {Number(dbClosed) <= 45 ? '✓ Whisper Quiet' : (Number(dbClosed) <= 55 ? 'Moderate' : 'Noisy')}
              </div>
            </div>

            {/* Mattress & Bed Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <div className="w-8 h-8 mx-auto bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-2">
                <Bed size={18} />
              </div>
              <div className="text-xs text-slate-500 font-medium">Mattress Quality</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{mattressFeel}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {bedSize}
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                {mattressTopper}
              </div>
            </div>

            {/* Shower Setup Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <div className="w-8 h-8 mx-auto bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center mb-2">
                <ShowerHead size={18} />
              </div>
              <div className="text-xs text-slate-500 font-medium">Shower Setup</div>
              <div className="text-sm font-extrabold text-slate-900 mt-1 truncate" title={showerLayout}>
                {showerLayout.includes('Glass') ? 'Glass Enclosed' : showerLayout}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {hotWaterTank}
              </div>
              <div className="text-[10px] text-teal-600 font-semibold mt-1">
                {sewerTrap ? '✓ Anti-Odor Drain' : 'Standard Drain'}
              </div>
            </div>

          </div>

          {/* Section Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            
            {/* Workstation Details */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-2.5">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Laptop size={16} className="text-blue-500" /> Remote Workstation Audit
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className={deskSetup ? 'text-emerald-500' : 'text-slate-400'}>✓</span>
                  <span>{deskSetup ? 'Dedicated work desk with stable height' : 'Standard table'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={ergoChair ? 'text-emerald-500' : 'text-amber-500'}>✓</span>
                  <span>{ergoChair ? 'Ergonomic / adjustable office chair' : 'Standard dining / hard chair'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Electrical Grounding: <strong>{grounding}</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Ethernet Direct Link: <strong>{data['c2_ethernet'] || 'Wi-Fi Only'}</strong></span>
                </li>
              </ul>
            </div>

            {/* Bathroom & Hot Water */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-2.5">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <ShowerHead size={16} className="text-teal-500" /> Bathroom & Laundry
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Shower Separation: <strong>{showerLayout}</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Hot Water Heater: <strong>{hotWaterTank}</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={sewerTrap ? 'text-emerald-500 font-bold' : 'text-slate-400'}>✓</span>
                  <span>Anti-Odor Floor Trap: {sewerTrap ? 'Verified (No sewer smell)' : 'Standard'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Dryer / Laundry: <strong>{data['c4_dryer_type'] || (data['c4_washer'] ? `Washing machine: ${data['c4_washer']}` : 'Standard')}</strong></span>
                </li>
              </ul>
            </div>

            {/* Kitchen & Drinking Water */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-2.5">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Coffee size={16} className="text-amber-600" /> Kitchen & Utilities
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Stove: <strong>{stoveType}</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Refrigerator: <strong>{fridgeSize}</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Drinking Water: <strong>{data['c3_water'] || '20L jug delivery available'}</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={data['c3_4'] ? 'text-emerald-500' : 'text-slate-400'}>✓</span>
                  <span>Microwave: {data['c3_4'] ? 'Included' : 'Not provided'}</span>
                </li>
              </ul>
            </div>

            {/* Climate, Building & Security */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-2.5">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Wind size={16} className="text-indigo-500" /> Climate & Building Comfort
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Air Conditioning: <strong>{acCoverage}</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Window Orientation: <strong>{windowOrientation}</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Mosquito Screens: <strong>{bugScreens}</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Street Flooding Risk: <strong>{data['c6_flood_risk'] || 'Standard High Ground'}</strong></span>
                </li>
              </ul>
            </div>

          </div>

          {/* Attached Inspection Photos */}
          {inspection.images && inspection.images.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-slate-900 text-sm">
                Inspector Verified Photos ({inspection.images.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {inspection.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                    <img src={img.url} alt={`Inspection Photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute bottom-1 right-1 text-[10px] bg-slate-900/70 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {img.sectionId.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificate Footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Certified by TryViet Housing Operations, Da Nang, Vietnam</span>
            </div>
            <span>Confidential client preview • Protected under TryViet Terms</span>
          </div>

        </div>

      </div>
    </div>
  );
}
