import React, { useState } from 'react';
import { 
  ShieldCheck, X, Copy, Check, Printer, Wifi, Volume2, Bed, Laptop, 
  ShowerHead, Coffee, Wind, ExternalLink, AlertTriangle, CheckCircle2, XCircle, ClipboardList
} from 'lucide-react';
import type { Inspection } from '../services/supabaseStorage';

interface ClientShareReportModalProps {
  inspection: Inspection;
  onClose: () => void;
}

const isFilled = (val: unknown): boolean =>
  val !== undefined && val !== null && val !== '' && val !== false;

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

  // Recorded Specs extraction (no fabricated defaults)
  const downloadMbps = isFilled(data['c1_7_dl']) ? String(data['c1_7_dl']) : null;
  const uploadMbps = isFilled(data['c1_7_ul']) ? String(data['c1_7_ul']) : null;
  const pingMs = isFilled(data['c1_wifi_ping']) ? String(data['c1_wifi_ping']) : null;
  const isp = isFilled(data['c1_wifi_isp']) ? String(data['c1_wifi_isp']) : null;
  const dedicatedRouter = data['c1_7_router'] === true;
  const wifiIncluded = data['c7_inc_wifi'] === true;
  const hasWifiCard = Boolean(downloadMbps || uploadMbps || pingMs || isp || dedicatedRouter || wifiIncluded);

  const dbOpen = isFilled(data['c1_6_db_open']) ? String(data['c1_6_db_open']) : null;
  const dbClosed = isFilled(data['c1_6_db_closed']) ? String(data['c1_6_db_closed']) : null;
  const dbClosedNum = dbClosed !== null && !isNaN(Number(dbClosed)) ? Number(dbClosed) : null;
  const hasNoiseCard = Boolean(dbOpen || dbClosed);

  const mattressFeel = isFilled(data['c1_5_mattress']) ? String(data['c1_5_mattress']) : null;
  const bedSize = isFilled(data['c1_bed_size']) ? String(data['c1_bed_size']) : null;
  const mattressTopper = isFilled(data['c1_mattress_upgrade'])
    ? String(data['c1_mattress_upgrade'])
    : (data['c1_5_topper'] === true ? 'Thick memory foam topper' : null);
  const hasBedCard = Boolean(mattressFeel || bedSize || mattressTopper);

  const showerLayout = isFilled(data['c4_shower_layout']) ? String(data['c4_shower_layout']) : null;
  const hotWaterTank = isFilled(data['c4_tank_size']) ? String(data['c4_tank_size']) : null;
  const sewerTrap = data['c4_sewer_trap'] === true;
  const waterPressure = data['c4_1'] === true;
  const hasShowerCard = Boolean(showerLayout || hotWaterTank || sewerTrap || waterPressure);

  // Breakdown items (only include actually recorded items)
  const workspaceItems: { ok?: boolean; text: string }[] = [];
  if (data['c2_1'] === true) workspaceItems.push({ ok: true, text: 'Dedicated work desk with stable height' });
  if (data['c2_2'] === true) workspaceItems.push({ ok: true, text: 'Ergonomic / adjustable office chair' });
  if (isFilled(data['c2_grounding'])) workspaceItems.push({ text: `Electrical Grounding: ${data['c2_grounding']}` });
  if (isFilled(data['c2_ethernet'])) workspaceItems.push({ text: `Router Proximity: ${data['c2_ethernet']}` });
  if (data['c2_glare'] === true) workspaceItems.push({ ok: true, text: 'No direct monitor glare' });
  if (data['c2_3'] === true) workspaceItems.push({ ok: true, text: 'Power outlets next to desk' });
  if (data['c2_4'] === true) workspaceItems.push({ ok: true, text: 'Universal / international outlets' });
  if (data['c2_5'] === true) workspaceItems.push({ ok: true, text: 'Well-lit workspace' });

  const bathroomItems: { ok?: boolean; text: string }[] = [];
  if (showerLayout) bathroomItems.push({ text: `Shower Layout: ${showerLayout}` });
  if (hotWaterTank) bathroomItems.push({ text: `Hot Water Heater: ${hotWaterTank}` });
  if (sewerTrap) bathroomItems.push({ ok: true, text: 'Anti-Odor Floor Trap verified (no sewer smell)' });
  if (waterPressure) bathroomItems.push({ ok: true, text: 'Strong water pressure' });
  if (data['c4_2'] === true) bathroomItems.push({ ok: true, text: 'Fast drainage verified' });
  if (isFilled(data['c4_washer'])) bathroomItems.push({ text: `Washing Machine: ${data['c4_washer']}` });
  if (isFilled(data['c4_dryer_type'])) bathroomItems.push({ text: `Dryer Setup: ${data['c4_dryer_type']}` });
  if (data['c4_3'] === true) bathroomItems.push({ ok: true, text: 'Covered, ventilated clothes drying area' });

  const kitchenItems: { ok?: boolean; text: string }[] = [];
  if (isFilled(data['c3_stove'])) kitchenItems.push({ text: `Stove: ${data['c3_stove']}` });
  if (isFilled(data['c3_fridge_size'])) kitchenItems.push({ text: `Refrigerator: ${data['c3_fridge_size']}` });
  if (isFilled(data['c3_water'])) kitchenItems.push({ text: `Drinking Water: ${data['c3_water']}` });
  const appliances: string[] = [];
  if (data['c3_4'] === true) appliances.push('Microwave');
  if (data['c3_appliance_kettle'] === true) appliances.push('Electric Kettle');
  if (data['c3_appliance_rice'] === true) appliances.push('Rice Cooker');
  if (data['c3_appliance_toaster'] === true) appliances.push('Toaster / Air Fryer');
  if (appliances.length > 0) kitchenItems.push({ ok: true, text: `Appliances: ${appliances.join(', ')}` });
  if (data['c3_5'] === true) kitchenItems.push({ ok: true, text: 'Exhaust fan / ventilation above stove' });
  if (data['c3_6'] === true) kitchenItems.push({ ok: true, text: 'Clean refrigerator & working freezer' });
  if (data['c3_pests'] === true) kitchenItems.push({ ok: true, text: 'Pest check passed (no ant trails / unsealed gaps)' });

  const climateItems: { ok?: boolean; text: string }[] = [];
  if (isFilled(data['c5_ac_coverage'])) climateItems.push({ text: `Air Conditioning: ${data['c5_ac_coverage']}` });
  if (isFilled(data['c5_window_orientation'])) climateItems.push({ text: `Window Orientation: ${data['c5_window_orientation']}` });
  if (isFilled(data['c5_bug_screens'])) climateItems.push({ text: `Mosquito Screens: ${data['c5_bug_screens']}` });
  if (data['c5_1'] === true) climateItems.push({ ok: true, text: 'AC cools fast, clean filters, no musty smell' });
  if (data['c5_2'] === true) climateItems.push({ ok: true, text: 'Windows face outside (open view)' });
  if (data['c5_3'] === true) climateItems.push({ ok: true, text: 'Blackout curtains in bedroom' });
  if (isFilled(data['c6_flood_risk'])) climateItems.push({ text: `Street Flooding Risk: ${data['c6_flood_risk']}` });
  if (isFilled(data['c6_generator'])) climateItems.push({ text: `Backup Generator: ${data['c6_generator']}` });
  if (data['c6_1'] === true) climateItems.push({ ok: true, text: 'Elevator available' });
  if (data['c6_2'] === true) climateItems.push({ ok: true, text: '24/7 free access (no curfew)' });
  if (isFilled(data['c6_sec'])) climateItems.push({ text: `Main Gate Security: ${data['c6_sec']}` });

  // Also include verified safety/core checks if marked
  const coreChecks: string[] = [];
  if (data['c1_1'] === true) coreChecks.push('Mold & moisture smell test passed');
  if (data['c1_window_seals'] === true) coreChecks.push('Window typhoon seals inspected');
  if (isFilled(data['c1_dehumidifier'])) coreChecks.push(`Dehumidifier: ${data['c1_dehumidifier']}`);
  if (isFilled(data['c1_mobile_signal'])) coreChecks.push(`Indoor Mobile Signal: ${data['c1_mobile_signal']}`);
  if (data['c1_perimeter_construction'] === true) coreChecks.push('No adjacent active construction');
  if (data['c1_perimeter_karaoke'] === true) coreChecks.push('No loud karaoke spots on block');

  // Custom fields that were filled/checked
  const answeredCustomFields = (inspection.customFields || []).filter((f: any) => isFilled(data[f.id]));

  const hasAnyRecordedData =
    hasWifiCard ||
    hasNoiseCard ||
    hasBedCard ||
    hasShowerCard ||
    workspaceItems.length > 0 ||
    bathroomItems.length > 0 ||
    kitchenItems.length > 0 ||
    climateItems.length > 0 ||
    coreChecks.length > 0 ||
    answeredCustomFields.length > 0 ||
    (inspection.images && inspection.images.length > 0);

  const verdictScore = inspection.verdictScore || '';
  const isPremiumApproved = verdictScore.toLowerCase().includes('premium');
  const isSoftLanding = verdictScore.toLowerCase().includes('soft');
  const isRejected = verdictScore.toLowerCase().includes('reject');

  const bestFor = inspection.verdictBestFor || [];
  const catchFlaw = inspection.verdictCatch || '';

  const handleCopySummary = () => {
    const lines: string[] = [
      `🏠 TryViet Property Audit: ${inspection.propertyName || 'TryViet Vetted Apartment'}`,
      `📍 Area: ${inspection.neighborhood || 'Da Nang, Vietnam'}${inspection.unitFloor ? ` • ${inspection.unitFloor}` : ''}`,
    ];
    if (verdictScore) lines.push(`🏆 Verdict: ${verdictScore}`);
    if (bestFor.length > 0) lines.push(`✨ Ideal For: ${bestFor.join(', ')}`);

    if (hasWifiCard) {
      const wifiParts: string[] = [];
      if (downloadMbps || uploadMbps) wifiParts.push(`${downloadMbps || '?'} Mbps DL / ${uploadMbps || '?'} Mbps UL`);
      if (pingMs) wifiParts.push(`${pingMs} ms ping`);
      if (isp) wifiParts.push(isp);
      if (dedicatedRouter) wifiParts.push('Dedicated Router in Room');
      if (wifiIncluded) wifiParts.push('Included in rent');
      lines.push(`⚡ Wi-Fi: ${wifiParts.join(' • ')}`);
    }

    if (hasNoiseCard) {
      const soundParts: string[] = [];
      if (dbClosed) soundParts.push(`${dbClosed} dB (Windows closed)`);
      if (dbOpen) soundParts.push(`${dbOpen} dB (Windows open)`);
      lines.push(`🔇 Sound: ${soundParts.join(' vs ')}`);
    }

    if (hasBedCard) {
      const bedParts = [bedSize, mattressFeel ? `Mattress: ${mattressFeel}` : null, mattressTopper].filter(Boolean);
      lines.push(`🛏️ Bed: ${bedParts.join(' • ')}`);
    }

    if (hasShowerCard) {
      const showerParts = [
        showerLayout,
        hotWaterTank ? `Hot Water: ${hotWaterTank}` : null,
        sewerTrap ? 'Anti-Odor P-Trap Verified' : null,
        waterPressure ? 'Strong Water Pressure' : null,
      ].filter(Boolean);
      lines.push(`🚿 Bathroom: ${showerParts.join(' • ')}`);
    }

    if (workspaceItems.length > 0) {
      lines.push(`💻 Remote Work: ${workspaceItems.map(i => i.text).join(' • ')}`);
    }
    if (kitchenItems.length > 0) {
      lines.push(`🍳 Kitchen: ${kitchenItems.map(i => i.text).join(' • ')}`);
    }
    if (climateItems.length > 0) {
      lines.push(`❄️ Comfort & Building: ${climateItems.map(i => i.text).join(' • ')}`);
    }
    if (coreChecks.length > 0) {
      lines.push(`🛡️ Core Checks: ${coreChecks.join(' • ')}`);
    }
    if (answeredCustomFields.length > 0) {
      lines.push(`📝 Additional Notes: ${answeredCustomFields.map((f: any) => f.type === 'check' ? f.label : `${f.label}: ${data[f.id]}`).join(' • ')}`);
    }
    if (catchFlaw) {
      lines.push(`\n⚠️ The Honest Catch: ${catchFlaw}`);
    }
    lines.push(`\nVerified by TryViet Quality Assurance Team (tryviet.com)`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-slate-200 print:shadow-none print:border-none print:max-h-none print:overflow-visible my-auto">
        
        {/* Top Action Bar (Hidden in Print) */}
        <div className="px-4 sm:px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 sticky top-0 z-20 print:hidden">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck size={14} /> Client-Safe Mode
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Summary'}
            </button>
            <button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer size={14} /> PDF / Print
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors ml-1"
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
            {verdictScore && (
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
            )}
          </div>

          {/* Best For Tags & Video Link */}
          {(bestFor.length > 0 || inspection.videoUrl) && (
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
          )}

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

          {!hasAnyRecordedData && (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-2">
              <ClipboardList className="mx-auto text-slate-300" size={36} />
              <p className="text-sm font-medium">No checklist checks have been recorded yet.</p>
              <p className="text-xs text-slate-400">Only verified measurements and checked items appear in this client report.</p>
            </div>
          )}

          {/* Key Metrics Dashboard (Only cards with recorded data) */}
          {(hasWifiCard || hasNoiseCard || hasBedCard || hasShowerCard) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {hasWifiCard && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <div className="w-8 h-8 mx-auto bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-2">
                    <Wifi size={18} />
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Wi-Fi Speed</div>
                  {downloadMbps ? (
                    <div className="text-xl font-extrabold text-slate-900 mt-0.5">{downloadMbps} <span className="text-xs font-normal">Mbps</span></div>
                  ) : (
                    <div className="text-sm font-bold text-slate-800 mt-1">{isp || 'Verified'}</div>
                  )}
                  {(uploadMbps || pingMs) && (
                    <div className="text-[11px] text-slate-500 mt-1">
                      {[uploadMbps ? `${uploadMbps} Mbps UL` : null, pingMs ? `${pingMs} ms` : null].filter(Boolean).join(' • ')}
                    </div>
                  )}
                  {dedicatedRouter && (
                    <div className="text-[10px] text-blue-600 font-semibold mt-1">✓ Private Router</div>
                  )}
                  {isp && downloadMbps && (
                    <div className="text-[10px] text-slate-500 mt-0.5">{isp}</div>
                  )}
                </div>
              )}

              {hasNoiseCard && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <div className="w-8 h-8 mx-auto bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-2">
                    <Volume2 size={18} />
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Closed Window Noise</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {dbClosed || '--'} <span className="text-xs font-normal">dB</span>
                  </div>
                  {dbOpen && (
                    <div className="text-[11px] text-slate-500 mt-1">Open: {dbOpen} dB</div>
                  )}
                  {dbClosedNum !== null && (
                    <div className="text-[10px] text-slate-600 font-semibold mt-1">
                      {dbClosedNum <= 45 ? '✓ Whisper Quiet' : (dbClosedNum <= 55 ? 'Moderate' : 'Noisy')}
                    </div>
                  )}
                </div>
              )}

              {hasBedCard && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <div className="w-8 h-8 mx-auto bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-2">
                    <Bed size={18} />
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Mattress & Bed</div>
                  <div className="text-base font-extrabold text-slate-900 mt-1">{mattressFeel || bedSize || 'Checked'}</div>
                  {bedSize && mattressFeel && (
                    <div className="text-[11px] text-slate-500 mt-1">{bedSize}</div>
                  )}
                  {mattressTopper && (
                    <div className="text-[10px] text-emerald-600 font-semibold mt-1">{mattressTopper}</div>
                  )}
                </div>
              )}

              {hasShowerCard && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <div className="w-8 h-8 mx-auto bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center mb-2">
                    <ShowerHead size={18} />
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Bathroom Setup</div>
                  <div className="text-sm font-extrabold text-slate-900 mt-1 truncate" title={showerLayout || 'Checked'}>
                    {showerLayout ? (showerLayout.includes('Glass') ? 'Glass Enclosed' : showerLayout) : (hotWaterTank || 'Verified')}
                  </div>
                  {hotWaterTank && showerLayout && (
                    <div className="text-[11px] text-slate-500 mt-1">{hotWaterTank}</div>
                  )}
                  {sewerTrap && (
                    <div className="text-[10px] text-teal-600 font-semibold mt-1">✓ Anti-Odor Drain</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section Breakdown Grid (Only show sections with recorded answers) */}
          {(workspaceItems.length > 0 || bathroomItems.length > 0 || kitchenItems.length > 0 || climateItems.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              {workspaceItems.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Laptop size={16} className="text-blue-500" /> Remote Workstation Audit
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {workspaceItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className={item.ok ? 'text-emerald-500 font-bold' : 'text-slate-400'}>{item.ok ? '✓' : '•'}</span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {bathroomItems.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <ShowerHead size={16} className="text-teal-500" /> Bathroom & Laundry
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {bathroomItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className={item.ok ? 'text-emerald-500 font-bold' : 'text-slate-400'}>{item.ok ? '✓' : '•'}</span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {kitchenItems.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Coffee size={16} className="text-amber-600" /> Kitchen & Utilities
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {kitchenItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className={item.ok ? 'text-emerald-500 font-bold' : 'text-slate-400'}>{item.ok ? '✓' : '•'}</span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {climateItems.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Wind size={16} className="text-indigo-500" /> Climate & Building Comfort
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {climateItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className={item.ok ? 'text-emerald-500 font-bold' : 'text-slate-400'}>{item.ok ? '✓' : '•'}</span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Core Safety & Custom Verified Notes */}
          {(coreChecks.length > 0 || answeredCustomFields.length > 0) && (
            <div className="p-4 rounded-xl border border-slate-200 space-y-2.5 text-sm">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" /> Additional Verified Checks
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
                {coreChecks.map((txt, i) => (
                  <li key={`core-${i}`} className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{txt}</span>
                  </li>
                ))}
                {answeredCustomFields.map((f: any) => (
                  <li key={f.id} className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{f.type === 'check' ? f.label : `${f.label}: ${data[f.id]}`}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
