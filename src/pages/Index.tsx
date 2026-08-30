import React, { useState, useEffect, type ReactNode } from 'react';
import { 
  CheckCircle2, Circle, ShieldAlert, Laptop, Coffee, ShowerHead, Sun, Building2, Handshake, Building, LogOut, Plus, FileText, ChevronLeft, Save, Loader2, MapPin, Camera, Trash2, Edit3, X, EyeOff, Eye, MessageSquare
} from 'lucide-react';
import { auth, db, signInWithGoogle, logout } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, getDoc, Timestamp, addDoc } from 'firebase/firestore';
import { compressImage } from '../imageUtils';

type StateValue = boolean | string;

interface Property {
  id: string;
  name: string;
  address: string;
  landlordName: string;
  landlordPhone: string;
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
  landlordName: string;
  landlordPhone: string;
  propertyName: string;
  propertyAddress: string;
  checklistData: Record<string, StateValue>;
  notes: Record<string, string>;
  images: { sectionId: string, url: string }[];
  hiddenFields: string[];
  labelOverrides: Record<string, string>;
  customFields: CustomField[];
  createdAt: any;
  updatedAt: any;
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentView, setCurrentView] = useState<'login' | 'dashboard' | 'checklist'>('login');
  const [currentInspectionId, setCurrentInspectionId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setCurrentView(v => v === 'login' ? 'dashboard' : v);
      } else {
        setCurrentView('login');
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

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
            <button onClick={logout} className="text-slate-400 hover:text-slate-600 transition-colors p-2 flex items-center gap-2 text-sm font-medium">
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </header>

      {currentView === 'login' && <LoginView />}
      {currentView === 'dashboard' && user && <DashboardView user={user} onOpenChecklist={(id) => {
        setCurrentInspectionId(id);
        setCurrentView('checklist');
      }} />}
      {currentView === 'checklist' && user && <ChecklistView user={user} inspectionId={currentInspectionId} onBack={() => setCurrentView('dashboard')} />}
    </div>
  );
}

function LoginView() {
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (e) {
      alert("Failed to sign in");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Building size={32} />
      </div>
      <h2 className="text-2xl font-bold mb-2">Inspector Portal</h2>
      <p className="text-slate-500 mb-8">Sign in to manage your property inspections and save checklists securely.</p>
      <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
        {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign in with Google"}
      </button>
    </main>
  );
}

function DashboardView({ user, onOpenChecklist }: { user: User, onOpenChecklist: (id: string | null) => void }) {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, 'inspections'), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const list: Inspection[] = [];
        snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() } as Inspection));
        list.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
        setInspections(list);
      } finally { setLoading(false); }
    }
    load();
  }, [user]);

  return (
    <main className="max-w-3xl mx-auto p-4 mt-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Your Inspections</h2>
        <button onClick={() => onOpenChecklist(null)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg flex items-center gap-2">
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
            <div key={insp.id} onClick={() => onOpenChecklist(insp.id)} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 cursor-pointer flex justify-between items-center group">
              <div>
                <h3 className="font-semibold text-slate-900 text-lg leading-tight">{insp.propertyName || 'Unnamed Property'}</h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {insp.propertyAddress || 'No address'}</span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5"><Handshake size={14} className="text-slate-400" /> {insp.landlordName || 'No landlord'}</span>
                </div>
              </div>
              <ChevronLeft size={20} className="text-slate-300 rotate-180 group-hover:text-blue-500" />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function ChecklistView({ user, inspectionId, onBack }: { user: User, inspectionId: string | null, onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Property Metadata
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [landlordName, setLandlordName] = useState('');
  const [landlordPhone, setLandlordPhone] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  
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
        const pSnap = await getDocs(collection(db, 'properties'));
        const props: Property[] = [];
        pSnap.forEach(d => props.push({ id: d.id, ...d.data() } as Property));
        setProperties(props);

        if (inspectionId) {
          const docRef = doc(db, 'inspections', inspectionId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as Inspection;
            setSelectedPropertyId(data.propertyId || '');
            setLandlordName(data.landlordName || '');
            setLandlordPhone(data.landlordPhone || '');
            setPropertyName(data.propertyName || '');
            setPropertyAddress(data.propertyAddress || '');
            setState(data.checklistData || {});
            setNotes(data.notes || {});
            setImages(data.images || []);
            setHiddenFields(data.hiddenFields || []);
            setLabelOverrides(data.labelOverrides || {});
            setCustomFields(data.customFields || []);
          }
        }
      } finally { setLoading(false); }
    }
    loadData();
  }, [inspectionId]);

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
      }
    } else {
      setPropertyName(''); setPropertyAddress(''); setLandlordName(''); setLandlordPhone('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const id = inspectionId || crypto.randomUUID();
      const docRef = doc(db, 'inspections', id);
      const payload: Partial<Inspection> = {
        userId: user.uid, propertyId: selectedPropertyId, landlordName, landlordPhone, propertyName, propertyAddress,
        checklistData: state, notes, images, hiddenFields, labelOverrides, customFields,
        updatedAt: Timestamp.now(), ...(inspectionId ? {} : { createdAt: Timestamp.now() })
      };
      await setDoc(docRef, payload, { merge: true });
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

  return (
    <>
      <main className="max-w-3xl mx-auto p-4 space-y-6 mt-2">
        <div className="flex justify-between items-center mb-2">
           <h2 className="text-2xl font-bold">Inspection Details</h2>
           <div className="flex gap-2">
             <button onClick={() => setEditMode(!editMode)} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${editMode ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
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

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Property</label>
            <div className="flex gap-2">
              <select value={selectedPropertyId} onChange={handlePropertySelect} className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500">
                <option value="">-- Custom / Unlisted --</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name} - {p.landlordName}</option>)}
              </select>
              <button onClick={() => setShowPropertyModal(true)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"><Plus size={20} /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Property Name</label>
              <input type="text" value={propertyName} onChange={e => setPropertyName(e.target.value)} disabled={!!selectedPropertyId} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:opacity-70" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Property Address</label>
              <input type="text" value={propertyAddress} onChange={e => setPropertyAddress(e.target.value)} disabled={!!selectedPropertyId} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:opacity-70" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Landlord Name</label>
              <input type="text" value={landlordName} onChange={e => setLandlordName(e.target.value)} disabled={!!selectedPropertyId} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:opacity-70" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Landlord Phone</label>
              <input type="text" value={landlordPhone} onChange={e => setLandlordPhone(e.target.value)} disabled={!!selectedPropertyId} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:opacity-70" />
            </div>
          </div>
        </section>

        {/* --- SECTION 1 --- */}
        <Section title="1. The TryViet Core Checks" icon={<ShieldAlert className="text-red-500" size={20} />} sectionId="s1" ctx={ctx} customFields={customFields} setCustomFields={setCustomFields} images={images} setImages={setImages} handleImageUpload={handleImageUpload}>
          <EditableCheckItem id="c1_1" label="Mold & Moisture Check (Smell test)" ctx={ctx} />
          <EditableCheckItem id="c1_2" label="Inside kitchen cabinets (under sink)" ctx={ctx} />
          <EditableCheckItem id="c1_3" label="Bathroom ceiling and corners" ctx={ctx} />
          <EditableCheckItem id="c1_4" label="Inside wooden wardrobes and behind bed" ctx={ctx} />
          
          <FieldWrapper id="c1_5_box" ctx={ctx} label="Mattress & Noise Box">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mt-4 border border-slate-200/60">
              <BoxHeader id="c1_5_lbl" label="Mattress Test Result" ctx={ctx} />
              <RadioGroup id="c1_5_mattress" options={['Rock hard', 'Medium', 'Soft']} ctx={ctx} />
              {state['c1_5_mattress'] === 'Rock hard' && (
                <div className="pt-2">
                  <EditableCheckItem id="c1_5_topper" label="Landlord will provide thick memory foam topper" ctx={ctx} hideBg />
                </div>
              )}
            </div>

            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mt-4 border border-slate-200/60">
              <BoxHeader id="c1_6_lbl" label="Noise Level (Decibels)" ctx={ctx} />
              <EditableCheckItem id="c1_6_noise1" label="Open windows: Checked for construction, traffic, roosters" ctx={ctx} hideBg />
              <NumberInput id="c1_6_db_open" placeholder="Open window dB" suffix="dB" ctx={ctx} />
              
              <EditableCheckItem id="c1_6_noise2" label="Closed windows: Soundproofing works" ctx={ctx} hideBg />
              <NumberInput id="c1_6_db_closed" placeholder="Closed window dB" suffix="dB" ctx={ctx} />
              
              <EditableCheckItem id="c1_6_noise3" label="Internal noise: Walls are NOT paper-thin" ctx={ctx} hideBg />
            </div>

            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mt-4 border border-slate-200/60">
              <BoxHeader id="c1_7_lbl" label="Wi-Fi Speed & Setup" ctx={ctx} />
              <div className="grid grid-cols-2 gap-3 mb-2">
                <NumberInput id="c1_7_dl" placeholder="Download" suffix="Mbps" ctx={ctx} />
                <NumberInput id="c1_7_ul" placeholder="Upload" suffix="Mbps" ctx={ctx} />
              </div>
              <EditableCheckItem id="c1_7_router" label="Room has a dedicated router (not shared on floor)" ctx={ctx} hideBg />
              <EditableCheckItem id="c7_inc_wifi" label="Wi-Fi is included in rent (No extra fee)" ctx={ctx} hideBg />
            </div>
          </FieldWrapper>
        </Section>

        {/* --- SECTION 2 --- */}
        <Section title="2. Workspace Setup" icon={<Laptop className="text-blue-500" size={20} />} sectionId="s2" ctx={ctx} customFields={customFields} setCustomFields={setCustomFields} images={images} setImages={setImages} handleImageUpload={handleImageUpload}>
          <EditableCheckItem id="c2_1" label="Dedicated desk with good height and stability" ctx={ctx} />
          <EditableCheckItem id="c2_2" label="Ergonomic / actual office chair (not hard wooden)" ctx={ctx} />
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
          <EditableCheckItem id="c3_1" label="Cooking utensils included (spatula, knives, chopping board)" ctx={ctx} />
          <EditableCheckItem id="c3_2" label="Eating wares included (plates, bowls, cutlery, glasses)" ctx={ctx} />
          <EditableCheckItem id="c3_3" label="Cooking vessels included (pots, frying pans)" ctx={ctx} />
          <EditableCheckItem id="c3_4" label="Microwave is provided" ctx={ctx} />
          <EditableCheckItem id="c3_5" label="Exhaust fan/ventilation above stove" ctx={ctx} />
          <EditableCheckItem id="c3_6" label="Refrigerator is clean, no smells, freezer works" ctx={ctx} />
        </Section>

        {/* --- SECTION 4 --- */}
        <Section title="4. Bathroom & Laundry" icon={<ShowerHead className="text-teal-500" size={20} />} sectionId="s4" ctx={ctx} customFields={customFields} setCustomFields={setCustomFields} images={images} setImages={setImages} handleImageUpload={handleImageUpload}>
          <FieldWrapper id="c4_heater_box" ctx={ctx} label="Water Heater Type">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 mb-4 border border-slate-200/60">
              <BoxHeader id="c4_heater_lbl" label="Water Heater Type" ctx={ctx} />
              <RadioGroup id="c4_heater" options={['Electric Tank', 'Solar (Needs Backup)']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <EditableCheckItem id="c4_1" label="Water pressure is strong (sink + shower running)" ctx={ctx} />
          <EditableCheckItem id="c4_2" label="Drainage works instantly (doesn't pool after 1 min)" ctx={ctx} />
          
          <FieldWrapper id="c4_washer_box" ctx={ctx} label="Washing Machine Type">
            <div className="bg-slate-100/50 p-4 rounded-xl space-y-3 my-4 border border-slate-200/60">
              <BoxHeader id="c4_washer_lbl" label="Washing Machine" ctx={ctx} />
              <RadioGroup id="c4_washer" options={['Private in-unit', 'Shared in building']} ctx={ctx} />
            </div>
          </FieldWrapper>

          <EditableCheckItem id="c4_3" label="Covered, ventilated space to dry clothes (rainy season safe)" ctx={ctx} />
        </Section>

        {/* --- SECTION 5 --- */}
        <Section title="5. General Comfort & Lighting" icon={<Sun className="text-orange-400" size={20} />} sectionId="s5" ctx={ctx} customFields={customFields} setCustomFields={setCustomFields} images={images} setImages={setImages} handleImageUpload={handleImageUpload}>
          <EditableCheckItem id="c5_1" label="AC cools fast, filters clean, no musty smells" ctx={ctx} />
          <EditableCheckItem id="c5_2" label="Windows face outside (not a brick wall or hallway)" ctx={ctx} />
          <EditableCheckItem id="c5_3" label="Blackout curtains in the bedroom area" ctx={ctx} />
          <EditableCheckItem id="c5_4" label="Bedside power outlets available" ctx={ctx} />
        </Section>

        {/* --- SECTION 6 --- */}
        <Section title="6. Building Facilities & Security" icon={<Building2 className="text-purple-500" size={20} />} sectionId="s6" ctx={ctx} customFields={customFields} setCustomFields={setCustomFields} images={images} setImages={setImages} handleImageUpload={handleImageUpload}>
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
                   <div className="mt-2 pl-8 pr-2">
                     <SmartInput id="c7_clean_freq" placeholder="Frequency" options={['1x/week', '2x/week', '3x/week']} ctx={ctx} autoVnd={false} />
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

        <div className="pt-4 pb-8 flex justify-end">
           <button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 text-lg shadow-sm">
             {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} Save Inspection
           </button>
        </div>
      </main>

      {showPropertyModal && <NewPropertyModal onClose={() => setShowPropertyModal(false)} onAdded={(p) => {
        setProperties([...properties, p]); setSelectedPropertyId(p.id); setPropertyName(p.name);
        setPropertyAddress(p.address); setLandlordName(p.landlordName); setLandlordPhone(p.landlordPhone);
        setShowPropertyModal(false);
      }} />}
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
  const [landlordName, setLandlordName] = useState('');
  const [landlordPhone, setLandlordPhone] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name, address, landlordName, landlordPhone, createdAt: Timestamp.now() };
      const docRef = await addDoc(collection(db, 'properties'), payload);
      onAdded({ id: docRef.id, ...payload });
    } catch (err) { alert("Failed to add property"); } 
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">Add New Property</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Property Name</label><input required type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Address</label><input required type="text" value={address} onChange={e=>setAddress(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Landlord Name</label><input required type="text" value={landlordName} onChange={e=>setLandlordName(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Landlord Phone</label><input required type="text" value={landlordPhone} onChange={e=>setLandlordPhone(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500" /></div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-xl transition-colors">{loading ? 'Saving...' : 'Save Property'}</button>
        </form>
      </div>
    </div>
  );
}
