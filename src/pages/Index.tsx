import React, { useState, useEffect, type ReactNode } from 'react';
import { 
  CheckCircle2, Circle, ShieldAlert, Laptop, Coffee, ShowerHead, Sun, Building2, Handshake, Building, LogOut, Plus, FileText, ChevronLeft, Save, Loader2, MapPin, Camera, Trash2, Edit3, X, EyeOff, Eye, MessageSquare, Share2, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { auth, db, signInWithGoogle, logout } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, getDoc, Timestamp, addDoc } from 'firebase/firestore';
import { compressImage } from '../imageUtils';
import { 
  fetchInspectionsFromSupabase, 
  fetchInspectionByIdFromSupabase, 
  saveInspectionToSupabase, 
  fetchPropertiesFromSupabase, 
  savePropertyToSupabase 
} from '../services/supabaseStorage';
import ClientShareReportModal from '../components/ClientShareReportModal';

type StateValue = boolean | string;

interface Property {
  id: string;
  name: string;
  address: string;
  neighborhood?: string;
  landlordName: string;
  landlordPhone: string;
  landlordZalo?: string;
}

interface CustomField {
  id: string;
  sectionId: string;
  type: 'check' | 'text' | 'number';
  label: string;
}

interface Inspection {
  id: string;
  userId: string;
  propertyId?: string;
  propertyName: string;
  propertyAddress: string;
  neighborhood?: string;
  unitFloor?: string;
  mapsUrl?: string;
  videoUrl?: string;
  landlordName: string;
  landlordPhone: string;
  landlordZalo?: string;
  verdictScore?: string;
  verdictBestFor?: string[];
  verdictCatch?: string;
  checklistData: Record<string, StateValue>;
  notes: Record<string, string>;
  images: { sectionId: string, url: string }[];
  hiddenFields: string[];
  labelOverrides: Record<string, string>;
  customFields: CustomField[];
  createdAt: any;
  updatedAt: any;
}

export type AuthUser = { uid: string; displayName?: string | null; email?: string | null; isAnonymous?: boolean };

export default function Index() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('tryviet_active_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentView, setCurrentView] = useState<'login' | 'dashboard' | 'checklist'>('login');
  const [currentInspectionId, setCurrentInspectionId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const u = { uid: currentUser.uid, displayName: currentUser.displayName, email: currentUser.email };
        setUser(u);
        localStorage.setItem('tryviet_active_user', JSON.stringify(u));
        setCurrentView(v => v === 'login' ? 'dashboard' : v);
      } else {
        const guest = localStorage.getItem('tryviet_active_user');
        if (guest) {
          setUser(JSON.parse(guest));
          setCurrentView(v => v === 'login' ? 'dashboard' : v);
        } else {
          setUser(null);
          setCurrentView('login');
        }
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('tryviet_active_user');
    setUser(null);
    setCurrentView('login');
    try {
      await logout();
    } catch (e) {
      console.warn("Logout error:", e);
    }
  };

  const handleGuestLogin = () => {
    const guestUser: AuthUser = {
      uid: 'guest_inspector',
      displayName: 'Guest Inspector',
      email: 'inspector@tryviet.com',
      isAnonymous: true
    };
    localStorage.setItem('tryviet_active_user', JSON.stringify(guestUser));
    setUser(guestUser);
    setCurrentView('dashboard');
  };

  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-4 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentView === 'checklist' && (
              <button onClick={() => setCurrentView('dashboard')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600">
                <ChevronLeft size={24} />
              </button>
            )}
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Building size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">TryViet</h1>
              <p className="text-xs text-slate-500 font-medium">Apartment Inspection</p>
            </div>
          </div>
          {user && (
            <button onClick={handleLogout} className="text-slate-400 hover:text-slate-600 transition-colors p-2 flex items-center gap-2 text-sm font-medium">
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </header>

      {currentView === 'login' && <LoginView onGuestLogin={handleGuestLogin} />}
      {currentView === 'dashboard' && user && <DashboardView user={user} onOpenChecklist={(id) => {
        setCurrentInspectionId(id);
        setCurrentView('checklist');
      }} />}
      {currentView === 'checklist' && user && <ChecklistView user={user} inspectionId={currentInspectionId} onBack={() => setCurrentView('dashboard')} />}
    </div>
  );
}

function LoginView({ onGuestLogin }: { onGuestLogin: () => void }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      await signInWithGoogle();
    } catch (e: any) {
      console.error("Login failure details:", e);
      if (e.code === 'auth/unauthorized-domain') {
        setErrorMessage(`Domain unauthorized (${window.location.hostname}). Add it to Firebase Console > Authentication > Settings > Authorized Domains, or use Guest Inspector mode below.`);
      } else if (e.code === 'auth/popup-blocked') {
        setErrorMessage("Sign-in popup was blocked by your browser. Please allow popups for this site, or use Guest Inspector mode.");
      } else if (e.code === 'auth/popup-closed-by-user') {
        setErrorMessage("Sign-in popup was closed before completing.");
      } else if (e.code === 'auth/operation-not-allowed') {
        setErrorMessage("Google Sign-In is not enabled in Firebase Console > Authentication > Sign-in method.");
      } else {
        setErrorMessage(e.message || "Failed to sign in. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto mt-16 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Building size={32} />
      </div>
      <h2 className="text-2xl font-bold mb-2">Inspector Portal</h2>
      <p className="text-slate-500 mb-6">Sign in to manage your property inspections and save checklists securely.</p>
      
      {errorMessage && (
        <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs text-left leading-relaxed">
          <strong className="block mb-1 font-semibold text-amber-800 flex items-center gap-1.5">
            <ShieldAlert size={15} className="shrink-0 text-amber-600" /> Sign-In Notice
          </strong>
          {errorMessage}
        </div>
      )}

      <div className="space-y-3">
        <button 
          onClick={handleLogin} 
          disabled={loading} 
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign in with Google"}
        </button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-xs text-slate-400 font-medium uppercase">Or</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <button 
          onClick={onGuestLogin} 
          type="button"
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
        >
          Continue as Guest Inspector (Offline / Demo)
        </button>
      </div>
    </main>
  );
}

function DashboardView({ user, onOpenChecklist }: { user: AuthUser, onOpenChecklist: (id: string | null) => void }) {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // 1. Fetch from Supabase backend (Lovable Cloud)
        const supabaseList = await fetchInspectionsFromSupabase(user.uid);

        // 2. Fetch from Firestore (Firebase)
        let firestoreList: Inspection[] = [];
        try {
          const q = query(collection(db, 'inspections'), where("userId", "==", user.uid));
          const snapshot = await getDocs(q);
          snapshot.forEach(docSnap => firestoreList.push({ id: docSnap.id, ...docSnap.data() } as Inspection));
        } catch (e) {
          console.warn("Firestore unavailable, checking local & Supabase:", e);
        }
        
        // 3. Merge with local storage
        const local: Inspection[] = JSON.parse(localStorage.getItem(`inspections_${user.uid}`) || '[]');
        
        const mergedMap = new Map<string, Inspection>();
        [...local, ...firestoreList, ...supabaseList].forEach(item => {
          if (item && item.id) {
            const existing = mergedMap.get(item.id);
            const itemTime = typeof item.updatedAt === 'object' && item.updatedAt?.seconds ? item.updatedAt.seconds * 1000 : Number(item.updatedAt || 0);
            const existingTime = existing ? (typeof existing.updatedAt === 'object' && existing.updatedAt?.seconds ? existing.updatedAt.seconds * 1000 : Number(existing.updatedAt || 0)) : -1;
            if (!existing || itemTime >= existingTime) {
              mergedMap.set(item.id, item);
            }
          }
        });

        const merged = Array.from(mergedMap.values());
        merged.sort((a, b) => {
          const timeA = typeof a.updatedAt === 'object' && a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : Number(a.updatedAt || 0);
          const timeB = typeof b.updatedAt === 'object' && b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : Number(b.updatedAt || 0);
          return timeB - timeA;
        });
        setInspections(merged);

        // Auto-sync existing locally stored inspections to Supabase backend in the background
        const supabaseIds = new Set(supabaseList.map(s => s.id));
        const unsyncedLocals = local.filter(loc => loc.id && !supabaseIds.has(loc.id));
        if (unsyncedLocals.length > 0) {
          Promise.allSettled(unsyncedLocals.map(loc => saveInspectionToSupabase(loc))).catch(err => {
            console.warn("Background auto-sync of local checklists to Supabase:", err);
          });
        }
      } catch (err) {
        console.warn("Error loading inspections, falling back to local:", err);
        const local: Inspection[] = JSON.parse(localStorage.getItem(`inspections_${user.uid}`) || '[]');
        setInspections(local);
      } finally { setLoading(false); }
    }
    load();
  }, [user]);


  return (
    <main className="max-w-3xl mx-auto p-4 mt-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Your Inspections</h2>
        <button onClick={() => onOpenChecklist(null)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg flex items-center gap-2 shadow-sm">
          <Plus size={16} /> New
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
      ) : inspections.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
          <FileText className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 font-medium">No inspections yet</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {inspections.map(insp => (
            <div key={insp.id} onClick={() => onOpenChecklist(insp.id)} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 cursor-pointer flex justify-between items-center group shadow-sm transition-all">
              <div>
                <h3 className="font-semibold text-slate-900 text-lg leading-tight">{insp.propertyName || 'Unnamed Property'}</h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {insp.propertyAddress || 'No address'}</span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5"><Handshake size={14} className="text-slate-400" /> {insp.landlordName || 'No landlord'}</span>
                </div>
              </div>
              <ChevronLeft size={20} className="text-slate-300 rotate-180 group-hover:text-blue-500 transition-transform" />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function ChecklistView({ user, inspectionId, onBack }: { user: AuthUser, inspectionId: string | null, onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Property Metadata
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [propertyName, setPropertyName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('An Thuong / My Khe');
  const [unitFloor, setUnitFloor] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [landlordName, setLandlordName] = useState('');
  const [landlordPhone, setLandlordPhone] = useState('');
  const [landlordZalo, setLandlordZalo] = useState('');

  // TryViet Verdict & Client Trust Data
  const [verdictScore, setVerdictScore] = useState('Approved - Soft Landing Only');
  const [verdictBestFor, setVerdictBestFor] = useState<string[]>(['Solo Nomad', 'Light Sleeper']);
  const [verdictCatch, setVerdictCatch] = useState('');

  // Client Share Report Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Inspection Data
  const [state, setState] = useState<Record<string, StateValue>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [images, setImages] = useState<{sectionId: string, url: string}[]>([]);
  
  // Customization Data
  const [hiddenFields, setHiddenFields] = useState<string[]>([]);
  const [labelOverrides, setLabelOverrides] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        // Load properties from Supabase & Firestore
        let props: Property[] = [];
        try {
          props = await fetchPropertiesFromSupabase();
        } catch (e) {
          console.warn("Could not fetch Supabase properties:", e);
        }

        try {
          const pSnap = await getDocs(collection(db, 'properties'));
          pSnap.forEach(d => {
            if (!props.some(x => x.id === d.id)) {
              props.push({ id: d.id, ...d.data() } as Property);
            }
          });
        } catch (e) {
          console.warn("Could not fetch remote Firestore properties:", e);
        }
        setProperties(props);

        if (inspectionId) {
          let loadedData: Inspection | null = null;
          
          // 1. Try Supabase backend (Lovable Cloud)
          try {
            loadedData = await fetchInspectionByIdFromSupabase(inspectionId);
          } catch (e) {
            console.warn("Supabase inspection load failed:", e);
          }

          // 2. Try Firestore
          if (!loadedData) {
            try {
              const docRef = doc(db, 'inspections', inspectionId);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                loadedData = { id: docSnap.id, ...docSnap.data() } as Inspection;
              }
            } catch (e) {
              console.warn("Firestore inspection load failed, falling back to local:", e);
            }
          }

          // 3. Fallback to localStorage
          if (!loadedData) {
            const localList: Inspection[] = JSON.parse(localStorage.getItem(`inspections_${user.uid}`) || '[]');
            loadedData = localList.find(x => x.id === inspectionId) || null;
          }

          if (loadedData) {
            setSelectedPropertyId(loadedData.propertyId || '');
            setPropertyName(loadedData.propertyName || '');
            setPropertyAddress(loadedData.propertyAddress || '');
            setNeighborhood(loadedData.neighborhood || 'An Thuong / My Khe');
            setUnitFloor(loadedData.unitFloor || '');
            setMapsUrl(loadedData.mapsUrl || '');
            setVideoUrl(loadedData.videoUrl || '');
            setLandlordName(loadedData.landlordName || '');
            setLandlordPhone(loadedData.landlordPhone || '');
            setLandlordZalo(loadedData.landlordZalo || '');
            setVerdictScore(loadedData.verdictScore || 'Approved - Soft Landing Only');
            setVerdictBestFor(loadedData.verdictBestFor || ['Solo Nomad']);
            setVerdictCatch(loadedData.verdictCatch || '');
            setState(loadedData.checklistData || {});
            setNotes(loadedData.notes || {});
            setImages(loadedData.images || []);
            setHiddenFields(loadedData.hiddenFields || []);
            setLabelOverrides(loadedData.labelOverrides || {});
            setCustomFields(loadedData.customFields || []);
          }
        }
      } finally { setLoading(false); }
    }
    loadData();
  }, [inspectionId, user.uid]);

  const handlePropertySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setSelectedPropertyId(pId);
    if (pId) {
      const p = properties.find(x => x.id === pId);
      if (p) {
        setPropertyName(p.name);
        setPropertyAddress(p.address);
        setLandlordName(p.landlordName);
        setLandlordPhone(p.landlordPhone);
        if (p.neighborhood) setNeighborhood(p.neighborhood);
        if (p.landlordZalo) setLandlordZalo(p.landlordZalo);
      }
    } else {
      setPropertyName(''); setPropertyAddress(''); setLandlordName(''); setLandlordPhone(''); setLandlordZalo('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const id = inspectionId || crypto.randomUUID();
      const payload: Partial<Inspection> = {
        id,
        userId: user.uid, 
        propertyId: selectedPropertyId, 
        propertyName, 
        propertyAddress,
        neighborhood,
        unitFloor,
        mapsUrl,
        videoUrl,
        landlordName, 
        landlordPhone, 
        landlordZalo,
        verdictScore,
        verdictBestFor,
        verdictCatch,
        checklistData: state, 
        notes, 
        images, 
        hiddenFields, 
        labelOverrides, 
        customFields,
        updatedAt: Timestamp.now(), 
        ...(inspectionId ? {} : { createdAt: Timestamp.now() })
      };

      // 1. Always save to localStorage backup (offline-first)
      try {
        const localList: any[] = JSON.parse(localStorage.getItem(`inspections_${user.uid}`) || '[]');
        const idx = localList.findIndex(x => x.id === id);
        const localItem = { id, ...payload, updatedAt: Date.now() };
        if (idx >= 0) localList[idx] = localItem;
        else localList.push(localItem);
        localStorage.setItem(`inspections_${user.uid}`, JSON.stringify(localList));
      } catch (localErr) {
        console.warn("Local storage save error:", localErr);
      }

      // 2. Save to Supabase backend (Lovable Cloud) for multi-device sync
      try {
        await saveInspectionToSupabase({
          id,
          userId: user.uid,
          propertyId: selectedPropertyId,
          propertyName,
          propertyAddress,
          neighborhood,
          unitFloor,
          mapsUrl,
          videoUrl,
          landlordName,
          landlordPhone,
          landlordZalo,
          verdictScore,
          verdictBestFor,
          verdictCatch,
          checklistData: state,
          notes,
          images,
          hiddenFields,
          labelOverrides,
          customFields,
        });
      } catch (supabaseErr) {
        console.warn("Supabase write failed:", supabaseErr);
      }

      // 3. Try saving to Firestore as additional backup
      try {
        const docRef = doc(db, 'inspections', id);
        await setDoc(docRef, payload, { merge: true });
      } catch (firestoreErr) {
        console.warn("Firestore write failed, saved locally and to Supabase:", firestoreErr);
      }

      onBack();
    } finally { setSaving(false); }
  };

  const handleImageUpload = async (sectionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const compressed = await compressImage(e.target.files[0]);
        setImages(prev => [...prev, { sectionId, url: compressed }]);
      } catch (err) { alert("Failed to compress image"); }
    }
  };

  // Helper objects passed to components
  const ctx = { state, setState, hiddenFields, setHiddenFields, labelOverrides, setLabelOverrides, editMode, notes, setNotes };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  const currentInspectionForShare: Inspection = {
    id: inspectionId || 'temp_preview',
    userId: user.uid,
    propertyId: selectedPropertyId,
    propertyName: propertyName || 'TryViet Vetted Apartment',
    propertyAddress,
    neighborhood,
    unitFloor,
    mapsUrl,
    videoUrl,
    landlordName,
    landlordPhone,
    landlordZalo,
    verdictScore,
    verdictBestFor,
    verdictCatch,
    checklistData: state,
    notes,
    images,
    hiddenFields,
    labelOverrides,
    customFields,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return (
    <>
      <main className="max-w-3xl mx-auto p-4 space-y-6 mt-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
           <div>
             <h2 className="text-2xl font-bold text-slate-900">Inspection Details</h2>
             <p className="text-xs text-slate-500">Da Nang Vetted Apartment Checklist</p>
           </div>
           <div className="flex flex-wrap gap-2 w-full sm:w-auto">
             <button 
               onClick={() => setShowShareModal(true)} 
               className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
               title="Create sanitized, branded report for Western clients without landlord contacts"
             >
               <Share2 size={16} /> Share Client Report
             </button>
             <button onClick={() => setEditMode(!editMode)} className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${editMode ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
               <Edit3 size={16} /> {editMode ? 'Done Editing' : 'Edit Checklist'}
             </button>
             <button onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
               {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
             </button>
           </div>
        </div>

        {editMode && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-sm mb-4 flex gap-3 items-start">
            <Edit3 className="shrink-0 mt-0.5" size={18} />
            <div>
              <strong className="block mb-1">Edit Mode Active</strong>
              You can now click on any checklist label to rewrite it, click the 'Eye' icon to hide specific default checks, and use the 'Add Check' button at the bottom of sections to add your own custom fields.
            </div>
          </div>
        )}

        {/* --- HEADER: PROPERTY INFO --- */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Property</label>
            <div className="flex gap-2">
              <select value={selectedPropertyId} onChange={handlePropertySelect} className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500">
                <option value="">-- Custom / Unlisted --</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name} ({p.neighborhood || 'Da Nang'}) - {p.landlordName}</option>)}
              </select>
              <button onClick={() => setShowPropertyModal(true)} title="Add Property" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 flex items-center gap-1 font-medium text-sm"><Plus size={18} /> New</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Property Name</label>
              <input type="text" placeholder="e.g. My Khe Seaside Studio" value={propertyName} onChange={e => setPropertyName(e.target.value)} disabled={!!selectedPropertyId} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:opacity-70 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Neighborhood Area</label>
              <select value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium text-slate-800">
                <option value="An Thuong / My Khe">An Thuong / My Khe</option>
                <option value="Son Tra / My An">Son Tra / My An</option>
                <option value="Hai Chau (City Center)">Hai Chau (City Center)</option>
                <option value="Hoi An">Hoi An</option>
                <option value="Other Da Nang District">Other Da Nang District</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Unit Number & Floor Level</label>
              <input type="text" placeholder="e.g. Unit 402, Floor 4 of 6 (Elevator)" value={unitFloor} onChange={e => setUnitFloor(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Property Address (Confidential / Internal)</label>
              <input type="text" placeholder="e.g. 15 An Thuong 4, My An" value={propertyAddress} onChange={e => setPropertyAddress(e.target.value)} disabled={!!selectedPropertyId} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:opacity-70 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Google Maps Pin URL</label>
              <input type="url" placeholder="https://maps.app.goo.gl/..." value={mapsUrl} onChange={e => setMapsUrl(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Walkthrough Video Link (YouTube / Loom / Drive)</label>
              <input type="url" placeholder="Crucial for $1,199 sight-unseen clients" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="w-full border border-indigo-200 bg-indigo-50/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Landlord Name (Internal Only)</label>
              <input type="text" value={landlordName} onChange={e => setLandlordName(e.target.value)} disabled={!!selectedPropertyId} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:opacity-70 outline-none focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                <input type="tel" value={landlordPhone} onChange={e => setLandlordPhone(e.target.value)} disabled={!!selectedPropertyId} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:opacity-70 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Zalo Number</label>
                <input type="tel" placeholder="Zalo contact" value={landlordZalo} onChange={e => setLandlordZalo(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 1 --- */}
        <Section title="1. The TryViet Core Checks" icon={<ShieldAlert className="text-red-500" size={20} />} sectionId="s1" ctx={ctx} customFields={customFields} setCustomFields={setCustomFields} images={images} setImages={setImages} handleImageUpload={handleImageUpload}>
          <EditableCheckItem id="c1_1" label="Mold & Moisture Check (Smell test)" ctx={ctx} />
          <EditableCheckItem id="c1_2" label="Inside kitchen cabinets (under sink)" ctx={ctx} />
          <EditableCheckItem id="c1_3" label="Bathroom ceiling and corners" ctx={ctx} />
          <EditableCheckItem id="c1_4" label="Inside wooden wardrobes and behind bed" ctx={ctx} />
          
          <FieldWrapper id="c1_dehumidifier_box" ctx={ctx} label="Dehumidifier Availability">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-2 mb-4 border border-slate-200/60">
              <BoxHeader id="c1_dehumidifier_lbl" label="Dehumidifier Provided? (Crucial for Oct-Dec Da Nang rainy season)" ctx={ctx} />
              <RadioGroup id="c1_dehumidifier" options={['Yes', 'No', 'Needed in rainy season']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <FieldWrapper id="c1_5_box" ctx={ctx} label="Mattress & Noise Box">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mb-4 border border-slate-200/60">
              <BoxHeader id="c1_5_lbl" label="Mattress Quality & Bed Dimensions" ctx={ctx} />
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">Mattress Firmness</span>
                <RadioGroup id="c1_5_mattress" options={['Rock hard', 'Medium', 'Soft']} ctx={ctx} />
              </div>
              <div className="pt-2 space-y-1">
                <span className="text-xs text-slate-500 font-medium">Bed Dimensions</span>
                <RadioGroup id="c1_bed_size" options={['Queen (1.6m)', 'King (1.8m)', 'Single (1.2m)', 'Twin']} ctx={ctx} />
              </div>
              <div className="pt-2 space-y-1">
                <span className="text-xs text-slate-500 font-medium">Mattress Upgrade Option</span>
                <RadioGroup id="c1_mattress_upgrade" options={['Landlord will add padded topper', 'Good as-is', 'Cannot change']} ctx={ctx} />
              </div>
              {state['c1_5_mattress'] === 'Rock hard' && (
                <div className="pt-1">
                  <EditableCheckItem id="c1_5_topper" label="Landlord will provide thick memory foam topper" ctx={ctx} hideBg />
                </div>
              )}
            </div>

            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mb-4 border border-slate-200/60">
              <BoxHeader id="c1_6_lbl" label="Noise Level (Decibels)" ctx={ctx} />
              <EditableCheckItem id="c1_6_noise1" label="Open windows: Checked for construction, traffic, roosters" ctx={ctx} hideBg />
              <NumberInput id="c1_6_db_open" placeholder="Open window dB" suffix="dB" ctx={ctx} />
              
              <EditableCheckItem id="c1_6_noise2" label="Closed windows: Soundproofing works" ctx={ctx} hideBg />
              <NumberInput id="c1_6_db_closed" placeholder="Closed window dB" suffix="dB" ctx={ctx} />
              
              <EditableCheckItem id="c1_6_noise3" label="Internal noise: Walls are NOT paper-thin" ctx={ctx} hideBg />
            </div>

            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mb-4 border border-slate-200/60">
              <BoxHeader id="c1_7_lbl" label="Wi-Fi Speed & Setup" ctx={ctx} />
              <div className="grid grid-cols-2 gap-3 mb-2">
                <NumberInput id="c1_7_dl" placeholder="Download" suffix="Mbps" ctx={ctx} />
                <NumberInput id="c1_7_ul" placeholder="Upload" suffix="Mbps" ctx={ctx} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <NumberInput id="c1_wifi_ping" placeholder="Latency / Ping" suffix="ms" ctx={ctx} />
                <div>
                  <span className="text-xs text-slate-500 font-medium mb-1 block">Internet Provider (ISP)</span>
                  <RadioGroup id="c1_wifi_isp" options={['Viettel', 'FPT', 'VNPT', 'Other']} ctx={ctx} />
                </div>
              </div>
              <EditableCheckItem id="c1_7_router" label="Room has a dedicated router (not shared on floor)" ctx={ctx} hideBg />
              <EditableCheckItem id="c7_inc_wifi" label="Wi-Fi is included in rent (No extra fee)" ctx={ctx} hideBg />
            </div>

            <div className="bg-slate-100/50 p-4 rounded-xl space-y-2 mb-2 border border-slate-200/60">
              <BoxHeader id="c1_mobile_lbl" label="Mobile 4G/5G Indoor Signal (Viettel/Vinaphone eSIM)" ctx={ctx} />
              <RadioGroup id="c1_mobile_signal" options={['Strong (4-5 bars)', 'Moderate (2-3 bars)', 'Weak / Deadzone (Call drops)']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <EditableCheckItem id="c1_perimeter_construction" label="Perimeter check: NO adjacent empty sand lot or active pile-driving construction within 100m" ctx={ctx} />
          <EditableCheckItem id="c1_perimeter_karaoke" label="Perimeter check: NO loud local karaoke / nhậu drinking spots on immediate block" ctx={ctx} />
          <EditableCheckItem id="c1_window_seals" label="Typhoon seals: Checked window frames for paint bubbling, silicone peeling, or rain leaks" ctx={ctx} />
        </Section>

        {/* --- SECTION 2 --- */}
        <Section title="2. Workspace Setup" icon={<Laptop className="text-blue-500" size={20} />} sectionId="s2" ctx={ctx} customFields={customFields} setCustomFields={setCustomFields} images={images} setImages={setImages} handleImageUpload={handleImageUpload}>
          <EditableCheckItem id="c2_1" label="Dedicated desk with good height and stability" ctx={ctx} />
          <EditableCheckItem id="c2_2" label="Ergonomic / actual office chair (not hard wooden)" ctx={ctx} />
          
          <FieldWrapper id="c2_grounding_box" ctx={ctx} label="Electrical Grounding">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-2 my-3 border border-slate-200/60">
              <BoxHeader id="c2_grounding_lbl" label="Outlet Grounding (MacBook Tingling Risk)" ctx={ctx} />
              <RadioGroup id="c2_grounding" options={['3-prong grounded', '2-prong ungrounded (tingling MacBook risk)']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <FieldWrapper id="c2_ethernet_box" ctx={ctx} label="Router Proximity to Desk">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-2 my-3 border border-slate-200/60">
              <BoxHeader id="c2_ethernet_lbl" label="Router Proximity to Desk" ctx={ctx} />
              <RadioGroup id="c2_ethernet" options={['Can plug Ethernet cable directly', 'Wi-Fi only']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <EditableCheckItem id="c2_glare" label="Glare Check: Sun does NOT hit monitor screen directly without blinds" ctx={ctx} />
          <EditableCheckItem id="c2_3" label="Accessible power outlets directly next to desk" ctx={ctx} />
          <EditableCheckItem id="c2_4" label="Outlets take international/universal plugs" ctx={ctx} />
          <EditableCheckItem id="c2_5" label="Workspace is well-lit (natural light or good indoor)" ctx={ctx} />
        </Section>

        {/* --- SECTION 3 --- */}
        <Section title="3. Kitchen & Drinking Water" icon={<Coffee className="text-amber-600" size={20} />} sectionId="s3" ctx={ctx} customFields={customFields} setCustomFields={setCustomFields} images={images} setImages={setImages} handleImageUpload={handleImageUpload}>
          <FieldWrapper id="c3_water_box" ctx={ctx} label="Drinking Water Section">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mb-4 border border-slate-200/60">
              <BoxHeader id="c3_water_lbl" label="Drinking Water Handling" ctx={ctx} />
              <RadioGroup id="c3_water" options={['Landlord supplies 20L to door', 'Tenant must order/carry']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <FieldWrapper id="c3_stove_box" ctx={ctx} label="Cooking Stove Type">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mb-4 border border-slate-200/60">
              <BoxHeader id="c3_stove_lbl" label="Stove Type" ctx={ctx} />
              <RadioGroup id="c3_stove" options={['2-Burner Induction', '1-Burner Induction', 'Gas Stove', 'None / Hotplate only']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <FieldWrapper id="c3_fridge_box" ctx={ctx} label="Refrigerator Size">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mb-4 border border-slate-200/60">
              <BoxHeader id="c3_fridge_lbl" label="Fridge Size (Capacity for Client Grocery Stocking)" ctx={ctx} />
              <RadioGroup id="c3_fridge_size" options={['Full-size (separate freezer)', 'Mini-bar fridge (limited groceries)']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <FieldWrapper id="c3_appliance_box" ctx={ctx} label="Appliances Present">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-2 mb-4 border border-slate-200/60">
              <BoxHeader id="c3_appliance_lbl" label="Appliances Present" ctx={ctx} />
              <EditableCheckItem id="c3_appliance_kettle" label="Electric kettle provided" ctx={ctx} hideBg />
              <EditableCheckItem id="c3_appliance_rice" label="Rice cooker provided" ctx={ctx} hideBg />
              <EditableCheckItem id="c3_appliance_toaster" label="Toaster / Air Fryer provided" ctx={ctx} hideBg />
              <EditableCheckItem id="c3_4" label="Microwave is provided" ctx={ctx} hideBg />
            </div>
          </FieldWrapper>

          <EditableCheckItem id="c3_pests" label="Pest check: No ant trails near counters, unsealed AC holes, or door gaps (cockroach/gecko safe)" ctx={ctx} />
          <EditableCheckItem id="c3_1" label="Cooking utensils included (spatula, knives, chopping board)" ctx={ctx} />
          <EditableCheckItem id="c3_2" label="Eating wares included (plates, bowls, cutlery, glasses)" ctx={ctx} />
          <EditableCheckItem id="c3_3" label="Cooking vessels included (pots, frying pans)" ctx={ctx} />
          <EditableCheckItem id="c3_5" label="Exhaust fan/ventilation above stove" ctx={ctx} />
          <EditableCheckItem id="c3_6" label="Refrigerator is clean, no smells, freezer works" ctx={ctx} />
        </Section>

        {/* --- SECTION 4 --- */}
        <Section title="4. Bathroom & Laundry" icon={<ShowerHead className="text-teal-500" size={20} />} sectionId="s4" ctx={ctx} customFields={customFields} setCustomFields={setCustomFields} images={images} setImages={setImages} handleImageUpload={handleImageUpload}>
          <FieldWrapper id="c4_layout_box" ctx={ctx} label="Shower Separation & Layout">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mb-4 border border-slate-200/60">
              <BoxHeader id="c4_layout_lbl" label="Bathroom Layout & Shower Separation" ctx={ctx} />
              <RadioGroup id="c4_shower_layout" options={['Glass Partition / Enclosed (Dry Toilet)', 'Curtain Only', 'Wet Room (Shower sprays over toilet)']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <FieldWrapper id="c4_heater_box" ctx={ctx} label="Water Heater Type & Tank Size">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mb-4 border border-slate-200/60">
              <BoxHeader id="c4_heater_lbl" label="Hot Water System & Tank Size" ctx={ctx} />
              <RadioGroup id="c4_tank_size" options={['20L-30L (10+ min shower)', '15L (5 min shower)', 'Instant (continuous electric)', 'Solar only (no backup)']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <EditableCheckItem id="c4_sewer_trap" label="P-Trap Check: Floor drain has anti-odor trap (No sewer gas smell rising in evening)" ctx={ctx} />
          <EditableCheckItem id="c4_1" label="Water pressure is strong (sink + shower running simultaneously)" ctx={ctx} />
          <EditableCheckItem id="c4_2" label="Drainage works instantly (doesn't pool after 1 min)" ctx={ctx} />
          
          <FieldWrapper id="c4_washer_box" ctx={ctx} label="Laundry & Dryer Options">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 my-4 border border-slate-200/60">
              <BoxHeader id="c4_washer_lbl" label="Washing Machine Setup" ctx={ctx} />
              <RadioGroup id="c4_washer" options={['Private in-unit', 'Shared in building']} ctx={ctx} />
              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Dryer Availability (Hang-drying takes 3 days in Nov humidity)</label>
                <RadioGroup id="c4_dryer_type" options={['Washer + Dryer Combo', 'Separate Dryer Machine', 'Hang-dry only']} ctx={ctx} />
              </div>
            </div>
          </FieldWrapper>

          <EditableCheckItem id="c4_3" label="Covered, ventilated space to dry clothes (rainy season safe)" ctx={ctx} />
        </Section>

        {/* --- SECTION 5 --- */}
        <Section title="5. General Comfort & Lighting" icon={<Sun className="text-orange-400" size={20} />} sectionId="s5" ctx={ctx} customFields={customFields} setCustomFields={setCustomFields} images={images} setImages={setImages} handleImageUpload={handleImageUpload}>
          <FieldWrapper id="c5_ac_box" ctx={ctx} label="AC Coverage">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mb-4 border border-slate-200/60">
              <BoxHeader id="c5_ac_lbl" label="Air Conditioning Coverage" ctx={ctx} />
              <RadioGroup id="c5_ac_coverage" options={['Both Bedroom & Living Room have separate AC units', 'Bedroom Only (Living room gets hot)', 'Studio single unit']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <FieldWrapper id="c5_win_box" ctx={ctx} label="Window Orientation & Breezes">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mb-4 border border-slate-200/60">
              <BoxHeader id="c5_win_lbl" label="Window Sun Orientation" ctx={ctx} />
              <RadioGroup id="c5_window_orientation" options={['East / Morning Sun', 'West / Hot Afternoon Sun', 'North / South (Gentle light)', 'Sea Breeze Orientation']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <FieldWrapper id="c5_screen_box" ctx={ctx} label="Window Bug Screens">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mb-4 border border-slate-200/60">
              <BoxHeader id="c5_screen_lbl" label="Window Bug Screens" ctx={ctx} />
              <RadioGroup id="c5_bug_screens" options={['Bug screens installed on opening windows', 'None (Mosquito risk on lower floors)']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <EditableCheckItem id="c5_1" label="AC cools fast, filters clean, no musty smells" ctx={ctx} />
          <EditableCheckItem id="c5_bedding" label="Bedding quality: 2 pillows per person + clean quality duvet & fresh protector included" ctx={ctx} />
          <EditableCheckItem id="c5_2" label="Windows face outside (not a brick wall or hallway)" ctx={ctx} />
          <EditableCheckItem id="c5_3" label="Blackout curtains in the bedroom area" ctx={ctx} />
          <EditableCheckItem id="c5_4" label="Bedside power outlets available" ctx={ctx} />
        </Section>

        {/* --- SECTION 6 --- */}
        <Section title="6. Building Facilities & Security" icon={<Building2 className="text-purple-500" size={20} />} sectionId="s6" ctx={ctx} customFields={customFields} setCustomFields={setCustomFields} images={images} setImages={setImages} handleImageUpload={handleImageUpload}>
          <FieldWrapper id="c6_flood_box" ctx={ctx} label="Street Flooding Risk">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mb-4 border border-slate-200/60">
              <BoxHeader id="c6_flood_lbl" label="Street Flooding Risk (Heavy Rain & Typhoons)" ctx={ctx} />
              <RadioGroup id="c6_flood_risk" options={['High ground / Dry street (No flood history)', 'Prone to ankle-deep water during heavy storms']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <FieldWrapper id="c6_gen_box" ctx={ctx} label="Backup Generator">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mb-4 border border-slate-200/60">
              <BoxHeader id="c6_gen_lbl" label="Backup Generator for Power Outages" ctx={ctx} />
              <RadioGroup id="c6_generator" options={['Powers Elevator & Room Wi-Fi/Plugs', 'Powers Common Areas Only', 'None (Standard in VN)']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <EditableCheckItem id="c6_delivery" label="Dedicated lobby shelf or 24/7 guard for GrabFood / Shopee package drop-offs" ctx={ctx} />
          <EditableCheckItem id="c6_1" label="Elevator available (Crucial for 3rd floor+, luggage, water)" ctx={ctx} />
          <EditableCheckItem id="c6_2" label="24/7 free access (No curfew / locked gate at 11 PM)" ctx={ctx} />
          
          <FieldWrapper id="c6_sec_box" ctx={ctx} label="Main Gate Security">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 my-4 border border-slate-200/60">
              <BoxHeader id="c6_sec_lbl" label="Main Gate Security" ctx={ctx} />
              <RadioGroup id="c6_sec" options={['Fingerprint', 'Key Card', 'Physical Padlock']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <EditableCheckItem id="c6_3" label="Secure, covered parking area for a scooter" ctx={ctx} />
        </Section>

        {/* --- SECTION 7 --- */}
        <Section title="7. Landlord & Financial Terms" icon={<Handshake className="text-emerald-500" size={20} />} sectionId="s7" ctx={ctx} customFields={customFields} setCustomFields={setCustomFields} images={images} setImages={setImages} handleImageUpload={handleImageUpload}>
          <EditableCheckItem id="c7_police_reg" label="Foreigner Police Registration: Landlord confirms immediate online police registration (Khai báo tạm trú - mandatory for visa extensions)" ctx={ctx} />

          <FieldWrapper id="c7_trust_box" ctx={ctx} label="Deposit Return Track Record">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 my-4 border border-slate-200/60">
              <BoxHeader id="c7_trust_lbl" label="Deposit Return Track Record" ctx={ctx} />
              <RadioGroup id="c7_deposit_trust" options={['Verified Trusted Landlord (TryViet vetted)', 'New / Unverified Landlord']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <FieldWrapper id="c7_pay_box" ctx={ctx} label="Payment Methods Accepted">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 my-4 border border-slate-200/60">
              <BoxHeader id="c7_pay_lbl" label="Payment Method Accepted" ctx={ctx} />
              <RadioGroup id="c7_payment_method" options={['Local Bank / Wise Transfer', 'Cash VND', 'Credit/Debit Card']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <FieldWrapper id="c7_eng_box" ctx={ctx} label="Landlord English Level">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mb-4 border border-slate-200/60">
              <BoxHeader id="c7_eng_lbl" label="Landlord English Level" ctx={ctx} />
              <RadioGroup id="c7_eng" options={['Fluent', 'Basic', 'None (TryViet translates)']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <FieldWrapper id="c7_rent_box" ctx={ctx} label="Rent Amount">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mb-4 border border-slate-200/60">
              <BoxHeader id="c7_rent_lbl" label="Monthly Rent Amount (VND)" ctx={ctx} />
              <SmartInput id="c7_rent_amount" placeholder="e.g. 7500 -> 7,500,000" ctx={ctx} autoVnd={true} />
            </div>
          </FieldWrapper>

          <FieldWrapper id="c7_elec_box" ctx={ctx} label="Electricity Rate">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mb-4 border border-slate-200/60">
              <BoxHeader id="c7_elec_lbl" label="Electricity Rate (Cost per kWh)" ctx={ctx} />
              <SmartInput id="c7_elec_rate" placeholder="e.g. 3500" options={['Free', '3,500', '3,800', '4,000']} ctx={ctx} autoVnd={false} />
              <div className="pt-2">
                <EditableCheckItem id="c7_elec_meter" label="Individual, visible electricity meter for unit" ctx={ctx} hideBg />
              </div>
            </div>
          </FieldWrapper>

          <FieldWrapper id="c7_inc_box" ctx={ctx} label="Included in Rent">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mb-4 border border-slate-200/60">
              <BoxHeader id="c7_inc_lbl" label="Included in Rent" ctx={ctx} />
              <EditableCheckItem id="c7_inc_water" label="Water (Nước sinh hoạt)" ctx={ctx} hideBg />
              <EditableCheckItem id="c7_inc_trash" label="Trash collection" ctx={ctx} hideBg />
              <EditableCheckItem id="c7_inc_mgmt" label="Building management fees" ctx={ctx} hideBg />
              
              <div className="pt-2">
                <EditableCheckItem id="c7_inc_clean" label="Cleaning service" ctx={ctx} hideBg />
                {state['c7_inc_clean'] && (
                  <div className="mt-2 pl-8 pr-2 space-y-2">
                    <SmartInput id="c7_clean_freq" placeholder="Frequency" options={['1x/week', '2x/week', '3x/week']} ctx={ctx} autoVnd={false} />
                    <EditableCheckItem id="c7_clean_bedsheet" label="Includes regular bedsheet & towel change" ctx={ctx} hideBg />
                  </div>
                )}
              </div>
            </div>
          </FieldWrapper>

          <EditableCheckItem id="c7_lease" label="Landlord is completely comfortable with 1 to 3-month lease" ctx={ctx} />
          
          <FieldWrapper id="c7_dep_box" ctx={ctx} label="Deposit Amount">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mt-4 border border-slate-200/60">
               <BoxHeader id="c7_dep_lbl" label="Deposit Amount" ctx={ctx} />
               <SmartInput id="c7_deposit" placeholder="E.g. 1 month or 7500" options={['1 month', '2 months', '3 months']} ctx={ctx} autoVnd={true} />
            </div>
          </FieldWrapper>
        </Section>

        {/* --- SECTION 8: INSPECTOR SUMMARY & VERDICT --- */}
        <section className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">8. Inspector Summary & TryViet Verdict</h3>
              <p className="text-xs text-slate-300">Liability Shield & Client Trust Artifact</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {/* Overall Verdict */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Overall TryViet Score</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'Approved - Premium Tier ($1,199 Sight-Unseen Ready)', label: 'Approved: Premium Tier', desc: '$1,199 Sight-Unseen Ready', color: 'emerald' },
                  { id: 'Approved - Soft Landing Only ($599 Blitz)', label: 'Approved: Soft Landing Only', desc: '$599 Pre-Vetted Blitz Only', color: 'blue' },
                  { id: 'Rejected - Do Not Show (Has Dealbreakers)', label: 'Rejected: Do Not Show', desc: 'Has Fatal Dealbreaker', color: 'red' }
                ].map(opt => {
                  const selected = verdictScore === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setVerdictScore(opt.id)}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        selected 
                          ? (opt.color === 'emerald' ? 'bg-emerald-600/30 border-emerald-400 text-white shadow-sm ring-1 ring-emerald-400' : (opt.color === 'blue' ? 'bg-blue-600/30 border-blue-400 text-white shadow-sm ring-1 ring-blue-400' : 'bg-red-600/30 border-red-400 text-white shadow-sm ring-1 ring-red-400'))
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold text-sm">{opt.label}</div>
                      <div className="text-[11px] opacity-80 mt-0.5">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Best For Tags */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Best For (Target Match)</label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Light Sleeper', 'Heavy Zoom Caller', 'Couple', 'Cook-at-Home', 
                  'Solo Nomad', 'Rainy Season Stay', 'Beach Lover'
                ].map(tag => {
                  const active = verdictBestFor.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (active) setVerdictBestFor(verdictBestFor.filter(t => t !== tag));
                        else setVerdictBestFor([...verdictBestFor, tag]);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        active 
                          ? 'bg-blue-500 text-white border-blue-400' 
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* The Catch */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-400" />
                The Catch (Honest #1 Flaw of this Apartment)
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Telling the client the single flaw upfront eliminates post-move-in liability and builds 100% trust.
              </p>
              <textarea
                value={verdictCatch}
                onChange={e => setVerdictCatch(e.target.value)}
                placeholder="e.g. Great ocean breeze and 120Mbps Wi-Fi, but living room AC takes ~15 min to cool at 2 PM, and shower is wet-room style without glass partition."
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-400 min-h-[80px]"
              />
            </div>
          </div>
        </section>

        <div className="pt-4 pb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
           <button 
             onClick={() => setShowShareModal(true)} 
             className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-base shadow-sm transition-colors"
           >
             <Share2 size={18} /> Preview Client Report
           </button>
           <button onClick={handleSave} disabled={saving} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-lg shadow-sm">
             {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} Save Inspection
           </button>
        </div>
      </main>

      {showPropertyModal && <NewPropertyModal onClose={() => setShowPropertyModal(false)} onAdded={(p) => {
        setProperties([...properties, p]); setSelectedPropertyId(p.id); setPropertyName(p.name);
        setPropertyAddress(p.address); setLandlordName(p.landlordName); setLandlordPhone(p.landlordPhone);
        if (p.neighborhood) setNeighborhood(p.neighborhood);
        if (p.landlordZalo) setLandlordZalo(p.landlordZalo);
        setShowPropertyModal(false);
      }} />}

      {showShareModal && (
        <ClientShareReportModal 
          inspection={currentInspectionForShare} 
          onClose={() => setShowShareModal(false)} 
        />
      )}
    </>
  );
}

// --- HELPER COMPONENTS ---

function NoteToggle({ id, ctx, showNote, setShowNote }: any) {
  const hasNote = !!ctx.notes[id];
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); setShowNote(!showNote); }} 
      className={`p-1 rounded transition-colors shrink-0 ${hasNote ? 'text-blue-500' : 'text-slate-300 hover:text-slate-400'}`}
      title="Add Note"
    >
      <MessageSquare size={16} />
    </button>
  );
}

function NoteArea({ id, ctx }: any) {
  return (
    <textarea
      value={ctx.notes[id] || ''}
      onChange={e => ctx.setNotes((p:any) => ({...p, [id]: e.target.value}))}
      placeholder="Add a note or context..."
      className="w-full bg-yellow-50/40 border border-yellow-200/60 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-yellow-400 resize-y min-h-[60px]"
    />
  );
}

function BoxHeader({ id, label, ctx, className = "font-medium text-sm text-slate-700" }: any) {
  const [showNote, setShowNote] = useState(!!ctx.notes[id]);
  return (
    <div className="mb-2">
      <div className="flex justify-between items-start gap-2">
        <EditableLabel id={id} label={label} ctx={ctx} className={`${className} block flex-1`} />
        <NoteToggle id={id} ctx={ctx} showNote={showNote} setShowNote={setShowNote} />
      </div>
      {showNote && <div className="mt-2"><NoteArea id={id} ctx={ctx} /></div>}
    </div>
  );
}

function Section({ title, icon, sectionId, ctx, customFields, setCustomFields, images, setImages, handleImageUpload, children }: any) {
  const { editMode } = ctx;
  const myCustomFields = customFields.filter((f: any) => f.sectionId === sectionId);
  const myImages = images.filter((img: any) => img.sectionId === sectionId);

  const addCustomField = (type: 'check' | 'text' | 'number') => {
    setCustomFields([...customFields, { id: `custom_${Date.now()}`, sectionId, type, label: 'New Custom Field' }]);
  };
  const updateCustomField = (id: string, label: string) => {
    setCustomFields(customFields.map((f: any) => f.id === id ? { ...f, label } : f));
  };
  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter((f: any) => f.id !== id));
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
        {icon}
        <h2 className="font-semibold text-lg text-slate-800">{title}</h2>
      </div>
      <div className="p-5 space-y-4">
        {children}

        {/* Render Custom Fields */}
        {myCustomFields.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
            {myCustomFields.map((field: any) => (
              <CustomFieldItem key={field.id} field={field} ctx={ctx} removeCustomField={removeCustomField} updateCustomField={updateCustomField} />
            ))}
          </div>
        )}

        {editMode && (
          <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex flex-wrap gap-2">
            <span className="text-xs text-slate-400 w-full mb-1">Add Custom Field:</span>
            <button onClick={() => addCustomField('check')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-xs font-medium text-slate-600 flex gap-1 items-center"><Plus size={14}/> Checkbox</button>
            <button onClick={() => addCustomField('text')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-xs font-medium text-slate-600 flex gap-1 items-center"><Plus size={14}/> Text Input</button>
            <button onClick={() => addCustomField('number')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-xs font-medium text-slate-600 flex gap-1 items-center"><Plus size={14}/> Number Input</button>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap gap-2 mb-3">
            {myImages.map((img: any, idx: number) => {
              const globalIdx = images.indexOf(img);
              return (
                <div key={globalIdx} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                  <img src={img.url} className="w-full h-full object-cover" alt="Inspection" />
                  <button onClick={() => setImages(images.filter((_:any, i:number) => i !== globalIdx))} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                </div>
              )
            })}
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium cursor-pointer transition-colors">
            <Camera size={18} /> Add Photo
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(sectionId, e)} />
          </label>
        </div>

      </div>
    </section>
  );
}

function CustomFieldItem({ field, ctx, removeCustomField, updateCustomField }: any) {
  const { editMode } = ctx;
  const [showNote, setShowNote] = useState(!!ctx.notes[field.id]);

  return (
     <div className="group flex items-start gap-2">
       {editMode && (
         <button onClick={() => removeCustomField(field.id)} className="mt-1 shrink-0 text-slate-300 hover:text-red-500 bg-white p-1.5 rounded-full shadow-sm border border-slate-100 z-10 transition-colors"><Trash2 size={16}/></button>
       )}
       <div className={`flex-1 ${editMode ? 'pl-3 border-l-2 border-blue-200' : ''}`}>
         {field.type === 'check' && (
            <div className="flex flex-col">
               <div className="flex items-start gap-3 w-full">
                 <CheckboxIcon id={field.id} ctx={ctx} />
                 <div className="flex-1 mt-0.5">
                   {editMode ? (
                     <input type="text" value={field.label} onChange={e => updateCustomField(field.id, e.target.value)} className="border-b border-blue-300 bg-blue-50 px-1 py-0.5 outline-none text-[15px] w-full" />
                   ) : (
                     <span onClick={() => ctx.setState((p:any) => ({...p, [field.id]: !p[field.id]}))} className="text-[15px] cursor-pointer text-slate-700">{field.label}</span>
                   )}
                 </div>
                 <NoteToggle id={field.id} ctx={ctx} showNote={showNote} setShowNote={setShowNote} />
               </div>
               {showNote && <div className="pl-9 pr-1 mt-1"><NoteArea id={field.id} ctx={ctx} /></div>}
            </div>
         )}
         {(field.type === 'text' || field.type === 'number') && (
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 border border-slate-200/60">
               <div className="flex justify-between items-start mb-2 gap-2">
                 {editMode ? (
                   <input type="text" value={field.label} onChange={e => updateCustomField(field.id, e.target.value)} className="border-b border-blue-300 bg-blue-50 px-1 py-0.5 outline-none text-sm font-medium w-full flex-1" />
                 ) : (
                   <label className="font-medium text-sm text-slate-700 block flex-1">{field.label}</label>
                 )}
                 <NoteToggle id={field.id} ctx={ctx} showNote={showNote} setShowNote={setShowNote} />
               </div>
               {field.type === 'text' ? <TextInput id={field.id} ctx={ctx} placeholder="Type here..." /> : <NumberInput id={field.id} ctx={ctx} placeholder="Number..." />}
               {showNote && <div className="mt-2"><NoteArea id={field.id} ctx={ctx} /></div>}
            </div>
         )}
       </div>
     </div>
  );
}

function FieldWrapper({ id, label, ctx, children }: any) {
  const { hiddenFields, setHiddenFields, editMode } = ctx;
  const isHidden = hiddenFields.includes(id);

  if (isHidden && !editMode) return null;

  return (
    <div className={`group transition-all flex items-start gap-2 ${isHidden ? 'opacity-40 grayscale' : ''}`}>
      {editMode && (
        <button 
          title={isHidden ? "Unhide this block" : "Hide this block"}
          onClick={() => setHiddenFields(isHidden ? hiddenFields.filter((x:string) => x !== id) : [...hiddenFields, id])}
          className="mt-4 shrink-0 text-slate-300 hover:text-blue-500 bg-white p-1.5 rounded-full shadow-sm border border-slate-100 z-10 transition-colors"
        >
          {isHidden ? <Eye size={16} className="text-blue-500" /> : <EyeOff size={16} />}
        </button>
      )}
      <div className={`flex-1 ${editMode ? 'pl-3 border-l-2 border-blue-200' : ''}`}>
        {children}
      </div>
    </div>
  );
}

function EditableLabel({ id, label, ctx, className }: any) {
  const { labelOverrides, setLabelOverrides, editMode } = ctx;
  const currentLabel = labelOverrides[id] ?? label;

  if (editMode) {
    return (
      <input 
        type="text" 
        value={currentLabel} 
        onChange={e => setLabelOverrides({...labelOverrides, [id]: e.target.value})}
        className={`border-b border-blue-300 bg-blue-50 outline-none w-full px-1 py-0.5 ${className}`}
      />
    );
  }
  return <label className={className}>{currentLabel}</label>;
}

function EditableCheckItem({ id, label, ctx, hideBg = false }: any) {
  const { state, setState, hiddenFields, setHiddenFields, labelOverrides, setLabelOverrides, editMode } = ctx;
  const [showNote, setShowNote] = useState(!!ctx.notes[id]);
  const isHidden = hiddenFields.includes(id);
  const currentLabel = labelOverrides[id] ?? label;

  if (isHidden && !editMode) return null;

  return (
    <div className={`group transition-all flex items-start gap-2 ${isHidden ? 'opacity-40 grayscale' : ''}`}>
      {editMode && (
        <button 
          onClick={() => setHiddenFields(isHidden ? hiddenFields.filter((x:string) => x !== id) : [...hiddenFields, id])}
          className="mt-1 shrink-0 text-slate-300 hover:text-blue-500 bg-white p-1.5 rounded-full shadow-sm border border-slate-100 z-10 transition-colors"
        >
          {isHidden ? <Eye size={16} className="text-blue-500" /> : <EyeOff size={16} />}
        </button>
      )}
      <div className={`flex flex-col flex-1 ${editMode ? 'pl-3 border-l-2 border-blue-200' : ''} ${!hideBg && !editMode ? 'py-1' : ''}`}>
        <div className="flex items-start gap-3 w-full">
          <CheckboxIcon id={id} ctx={ctx} />
          <div className="flex-1 mt-0.5">
            {editMode ? (
              <input 
                type="text" 
                value={currentLabel} 
                onChange={e => setLabelOverrides({...labelOverrides, [id]: e.target.value})}
                className="border-b border-blue-300 bg-blue-50 px-1 py-0.5 outline-none text-[15px] w-full"
              />
            ) : (
              <span onClick={() => setState((p:any) => ({...p, [id]: !p[id]}))} className={`text-[15px] leading-snug cursor-pointer transition-colors ${state[id] ? 'text-slate-900' : 'text-slate-700'}`}>
                {currentLabel}
              </span>
            )}
          </div>
          <NoteToggle id={id} ctx={ctx} showNote={showNote} setShowNote={setShowNote} />
        </div>
        {showNote && <div className="pl-9 pr-1 mt-1"><NoteArea id={id} ctx={ctx} /></div>}
      </div>
    </div>
  );
}

function CheckboxIcon({ id, ctx }: any) {
  const isChecked = !!ctx.state[id];
  return (
    <div className="mt-0.5 flex-shrink-0 cursor-pointer" onClick={() => ctx.setState((p:any) => ({...p, [id]: !p[id]}))}>
      {isChecked ? (
        <CheckCircle2 className="text-blue-600 drop-shadow-sm" size={22} />
      ) : (
        <Circle className="text-slate-300 hover:text-slate-400 transition-colors" size={22} />
      )}
    </div>
  );
}

function RadioGroup({ id, options, ctx }: any) {
  const current = ctx.state[id] as string | undefined;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt: string) => (
        <button key={opt} onClick={() => ctx.setState((p:any) => ({...p, [id]: opt}))}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${current === opt ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
          {opt}
        </button>
      ))}
    </div>
  );
}

function NumberInput({ id, placeholder, suffix, ctx }: any) {
  const val = (ctx.state[id] as string) || '';
  return (
    <div className="relative flex-1">
      <input type="number" placeholder={placeholder} value={val} onChange={(e) => ctx.setState((p:any) => ({...p, [id]: e.target.value}))}
        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400" />
      {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">{suffix}</span>}
    </div>
  );
}

function TextInput({ id, placeholder, ctx }: any) {
  const val = (ctx.state[id] as string) || '';
  return (
    <input type="text" placeholder={placeholder} value={val} onChange={(e) => ctx.setState((p:any) => ({...p, [id]: e.target.value}))}
      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400" />
  );
}

function SmartInput({ id, placeholder, options, ctx, autoVnd = false }: any) {
  const val = (ctx.state[id] as string) || '';
  const [localVal, setLocalVal] = useState(val);
  
  useEffect(() => { setLocalVal(val); }, [val]);

  const handleBlur = () => {
    if (!autoVnd || !localVal || /[a-zA-Z]/.test(localVal)) {
      ctx.setState((p:any) => ({...p, [id]: localVal}));
      return;
    }
    const cleanStr = localVal.replace(/[^0-9.]/g, '');
    let parsed = parseFloat(cleanStr);
    if (!isNaN(parsed)) {
      if (parsed > 0 && parsed <= 200000) {
        parsed = parsed * 1000;
      }
      const formatted = parsed.toLocaleString('en-US');
      ctx.setState((p:any) => ({...p, [id]: formatted}));
      setLocalVal(formatted);
    } else {
      ctx.setState((p:any) => ({...p, [id]: localVal}));
    }
  };

  return (
    <div className="space-y-2 w-full">
      {options && options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {options.map((opt: string) => (
            <button 
              key={opt}
              onClick={() => {
                ctx.setState((p:any) => ({...p, [id]: opt}));
                setLocalVal(opt);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${val === opt ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      <input 
        type="text" 
        placeholder={placeholder} 
        value={localVal} 
        onChange={e => setLocalVal(e.target.value)} 
        onBlur={handleBlur}
        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400" 
      />
    </div>
  );
}

function NewPropertyModal({ onClose, onAdded }: { onClose: () => void, onAdded: (p: Property) => void }) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('An Thuong / My Khe');
  const [landlordName, setLandlordName] = useState('');
  const [landlordPhone, setLandlordPhone] = useState('');
  const [landlordZalo, setLandlordZalo] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const id = crypto.randomUUID();
      const propertyItem: Property = { 
        id, 
        name, 
        address, 
        neighborhood, 
        landlordName, 
        landlordPhone, 
        landlordZalo 
      };

      // 1. Save to Supabase backend (Lovable Cloud)
      try {
        await savePropertyToSupabase(propertyItem);
      } catch (supabaseErr) {
        console.warn("Supabase save property failed:", supabaseErr);
      }

      // 2. Try saving to Firestore
      try {
        await setDoc(doc(db, 'properties', id), {
          ...propertyItem,
          createdAt: Timestamp.now()
        });
      } catch (firestoreErr) {
        console.warn("Firestore property save failed (non-fatal):", firestoreErr);
      }

      onAdded(propertyItem);
    } catch (err) {
      alert("Failed to add property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">Add New Property</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Property Name</label>
            <input required type="text" placeholder="e.g. My Khe Seaside Residence" value={name} onChange={e=>setName(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Neighborhood</label>
            <select value={neighborhood} onChange={e=>setNeighborhood(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500">
              <option value="An Thuong / My Khe">An Thuong / My Khe</option>
              <option value="Son Tra / My An">Son Tra / My An</option>
              <option value="Hai Chau (City Center)">Hai Chau (City Center)</option>
              <option value="Hoi An">Hoi An</option>
              <option value="Other Da Nang District">Other Da Nang District</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input required type="text" placeholder="e.g. 15 An Thuong 4" value={address} onChange={e=>setAddress(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Landlord Name</label>
              <input required type="text" value={landlordName} onChange={e=>setLandlordName(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input required type="tel" value={landlordPhone} onChange={e=>setLandlordPhone(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Zalo Number (Optional)</label>
            <input type="tel" placeholder="Zalo contact" value={landlordZalo} onChange={e=>setLandlordZalo(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-xl transition-colors shadow-sm">{loading ? 'Saving...' : 'Save Property'}</button>
        </form>
      </div>
    </div>
  );
}
