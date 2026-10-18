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

function mapRowToInspection(row: any): Inspection {
  return {
    id: row.id,
    userId: row.user_id,
    propertyId: row.property_id || '',
    propertyName: row.property_name || '',
    propertyAddress: row.property_address || '',
    neighborhood: row.neighborhood || '',
    unitFloor: row.unit_floor || '',
    mapsUrl: row.maps_url || '',
    landlordName: row.landlord_name || '',
    landlordPhone: row.landlord_phone || '',
    landlordZalo: row.landlord_zalo || '',
    videoUrl: row.video_url || '',
    verdictScore: row.verdict_score || '',
    verdictBestFor: Array.isArray(row.verdict_best_for) ? row.verdict_best_for : [],
    verdictCatch: row.verdict_catch || '',
    checklistData: (row.checklist_data as Record<string, any>) || {},
    notes: (row.notes as Record<string, string>) || {},
    images: Array.isArray(row.images) ? (row.images as { sectionId: string; url: string }[]) : [],
    hiddenFields: Array.isArray(row.hidden_fields) ? (row.hidden_fields as string[]) : [],
    labelOverrides: (row.label_overrides as Record<string, string>) || {},
    customFields: Array.isArray(row.custom_fields) ? row.custom_fields : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  };
}

function mapInspectionToRow(insp: Partial<Inspection>): any {
  return {
    id: insp.id,
    user_id: insp.userId,
    property_id: insp.propertyId || null,
    property_name: insp.propertyName || '',
    property_address: insp.propertyAddress || '',
    neighborhood: insp.neighborhood || '',
    unit_floor: insp.unitFloor || '',
    maps_url: insp.mapsUrl || '',
    landlord_name: insp.landlordName || '',
    landlord_phone: insp.landlordPhone || '',
    landlord_zalo: insp.landlordZalo || '',
    video_url: insp.videoUrl || '',
    verdict_score: insp.verdictScore || '',
    verdict_best_for: insp.verdictBestFor || [],
    verdict_catch: insp.verdictCatch || '',
    checklist_data: insp.checklistData || {},
    notes: insp.notes || {},
    images: insp.images || [],
    hidden_fields: insp.hiddenFields || [],
    label_overrides: insp.labelOverrides || {},
    custom_fields: insp.customFields || [],
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
