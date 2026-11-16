import { supabase, isSupabaseConfigured } from '../integrations/supabase/client';

export interface Property {
  id: string;
  name: string;
  address: string;
  neighborhood?: string;
  landlordName: string;
  landlordPhone: string;
  landlordZalo?: string;
}

export interface Inspection {
  id: string;
  userId: string;
  propertyId?: string;
  propertyName: string;
  propertyAddress: string;
  neighborhood?: string;
  unitFloor?: string;
  mapsUrl?: string;
  landlordName: string;
  landlordPhone: string;
  landlordZalo?: string;
  videoUrl?: string;
  verdictScore?: string;
  verdictBestFor?: string[];
  verdictCatch?: string;
  checklistData: Record<string, any>;
  notes: Record<string, string>;
  images: { sectionId: string; url: string }[];
  hiddenFields: string[];
  labelOverrides: Record<string, string>;
  customFields: any[];
  createdAt: any;
  updatedAt: any;
}

function parseJsonSafe<T>(val: any, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return val as T;
}

export function mapRowToInspection(row: any): Inspection {
  if (!row || typeof row !== 'object') {
    return {
      id: '',
      userId: '',
      propertyName: '',
      propertyAddress: '',
      landlordName: '',
      landlordPhone: '',
      checklistData: {},
      notes: {},
      images: [],
      hiddenFields: [],
      labelOverrides: {},
      customFields: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  const checklistData = parseJsonSafe<Record<string, any>>(
    row.checklistData ?? row.checklist_data,
    {}
  );
  const notes = parseJsonSafe<Record<string, string>>(
    row.notes,
    {}
  );
  const images = parseJsonSafe<any[]>(
    row.images,
    []
  );
  const hiddenFields = parseJsonSafe<string[]>(
    row.hiddenFields ?? row.hidden_fields,
    []
  );
  const labelOverrides = parseJsonSafe<Record<string, string>>(
    row.labelOverrides ?? row.label_overrides,
    {}
  );
  const customFields = parseJsonSafe<any[]>(
    row.customFields ?? row.custom_fields,
    []
  );
  const verdictBestFor = parseJsonSafe<string[]>(
    row.verdictBestFor ?? row.verdict_best_for,
    []
  );

  return {
    id: String(row.id || ''),
    userId: String(row.userId || row.user_id || 'guest_inspector'),
    propertyId: row.propertyId || row.property_id || '',
    propertyName: row.propertyName || row.property_name || '',
    propertyAddress: row.propertyAddress || row.property_address || '',
    neighborhood: row.neighborhood || 'An Thuong / My Khe',
    unitFloor: row.unitFloor || row.unit_floor || '',
    mapsUrl: row.mapsUrl || row.maps_url || '',
    landlordName: row.landlordName || row.landlord_name || '',
    landlordPhone: row.landlordPhone || row.landlord_phone || '',
    landlordZalo: row.landlordZalo || row.landlord_zalo || '',
    videoUrl: row.videoUrl || row.video_url || '',
    verdictScore: row.verdictScore || row.verdict_score || 'Approved - Soft Landing Only',
    verdictBestFor: Array.isArray(verdictBestFor) ? verdictBestFor : ['Solo Nomad'],
    verdictCatch: row.verdictCatch || row.verdict_catch || '',
    checklistData: typeof checklistData === 'object' && checklistData !== null ? checklistData : {},
    notes: typeof notes === 'object' && notes !== null ? notes : {},
    images: Array.isArray(images) ? images : [],
    hiddenFields: Array.isArray(hiddenFields) ? hiddenFields : [],
    labelOverrides: typeof labelOverrides === 'object' && labelOverrides !== null ? labelOverrides : {},
    customFields: Array.isArray(customFields) ? customFields : [],
    createdAt: row.createdAt || row.created_at || Date.now(),
    updatedAt: row.updatedAt || row.updated_at
      ? (typeof (row.updatedAt || row.updated_at) === 'object' && (row.updatedAt || row.updated_at)?.seconds
          ? (row.updatedAt || row.updated_at).seconds * 1000
          : (typeof (row.updatedAt || row.updated_at) === 'string' && !isNaN(Date.parse(row.updatedAt || row.updated_at))
              ? new Date(row.updatedAt || row.updated_at).getTime()
              : Number(row.updatedAt || row.updated_at || Date.now())))
      : Date.now(),
  };
}

export function mapInspectionToRow(insp: Partial<Inspection>): any {
  return {
    id: insp.id,
    user_id: insp.userId || (insp as any).user_id || 'guest_inspector',
    property_id: insp.propertyId || (insp as any).property_id || null,
    property_name: insp.propertyName || (insp as any).property_name || '',
    property_address: insp.propertyAddress || (insp as any).property_address || '',
    neighborhood: insp.neighborhood || '',
    unit_floor: insp.unitFloor || (insp as any).unit_floor || '',
    maps_url: insp.mapsUrl || (insp as any).maps_url || '',
    landlord_name: insp.landlordName || (insp as any).landlord_name || '',
    landlord_phone: insp.landlordPhone || (insp as any).landlord_phone || '',
    landlord_zalo: insp.landlordZalo || (insp as any).landlord_zalo || '',
    video_url: insp.videoUrl || (insp as any).video_url || '',
    verdict_score: insp.verdictScore || (insp as any).verdict_score || '',
    verdict_best_for: insp.verdictBestFor || (insp as any).verdict_best_for || [],
    verdict_catch: insp.verdictCatch || (insp as any).verdict_catch || '',
    checklist_data: insp.checklistData || (insp as any).checklist_data || {},
    notes: insp.notes || {},
    images: insp.images || [],
    hidden_fields: insp.hiddenFields || (insp as any).hidden_fields || [],
    label_overrides: insp.labelOverrides || (insp as any).label_overrides || {},
    custom_fields: insp.customFields || (insp as any).custom_fields || [],
    updated_at: new Date().toISOString(),
  };
}

export async function fetchInspectionsFromSupabase(userId: string): Promise<Inspection[]> {
  try {
    let query = supabase
      .from('inspections')
      .select('*')
      .order('updated_at', { ascending: false });

    if (userId && userId !== 'guest_inspector') {
      query = query.or(`user_id.eq.${userId},user_id.eq.guest_inspector`);
    } else if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase fetch inspections error:', error.message);
      return [];
    }

    return (data || []).map(mapRowToInspection);
  } catch (err) {
    console.warn('Supabase inspections fetch exception:', err);
    return [];
  }
}

export async function fetchInspectionByIdFromSupabase(id: string): Promise<Inspection | null> {
  try {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      if (error) console.warn('Supabase fetch inspection by id error:', error.message);
      return null;
    }

    return mapRowToInspection(data);
  } catch (err) {
    console.warn('Supabase fetch inspection by id exception:', err);
    return null;
  }
}

export async function saveInspectionToSupabase(inspection: Partial<Inspection>): Promise<boolean> {
  try {
    const row = mapInspectionToRow(inspection);
    const { error } = await supabase
      .from('inspections')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase save inspection error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Supabase save inspection exception:', err);
    return false;
  }
}

export async function fetchPropertiesFromSupabase(): Promise<Property[]> {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Supabase fetch properties error:', error.message);
      return [];
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      address: p.address || '',
      neighborhood: p.neighborhood || '',
      landlordName: p.landlord_name || '',
      landlordPhone: p.landlord_phone || '',
      landlordZalo: p.landlord_zalo || '',
    }));
  } catch (err) {
    console.warn('Supabase fetch properties exception:', err);
    return [];
  }
}

export async function savePropertyToSupabase(property: Property): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('properties')
      .upsert({
        id: property.id,
        name: property.name,
        address: property.address,
        neighborhood: property.neighborhood || null,
        landlord_name: property.landlordName,
        landlord_phone: property.landlordPhone,
        landlord_zalo: property.landlordZalo || null,
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase save property error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Supabase save property exception:', err);
    return false;
  }
}
