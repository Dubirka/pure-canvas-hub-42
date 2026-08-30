export type FieldType = 'check' | 'radio' | 'number' | 'text';

export interface TemplateItem {
  id: string;
  type: FieldType;
  label: string;
  options?: string[]; // For radio
  suffix?: string; // For number
  description?: string;
}

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  items: TemplateItem[];
}

export const defaultTemplate: TemplateSection[] = [
  {
    id: "s1",
    title: "1. The TryViet Core Checks",
    description: "Dealbreakers for the soft landing packages.",
    items: [
      { id: "c1_1", type: "check", label: "Mold & Moisture Check (Smell test)" },
      { id: "c1_2", type: "check", label: "Inside kitchen cabinets (under sink)" },
      { id: "c1_3", type: "check", label: "Bathroom ceiling and corners" },
      { id: "c1_4", type: "check", label: "Inside wooden wardrobes and behind bed" },
      { id: "c1_5", type: "radio", label: "Mattress Test Result", options: ["Rock hard", "Medium", "Soft"] },
      { id: "c1_6", type: "check", label: "Landlord will provide thick memory foam topper (if hard)" },
      { id: "c1_7", type: "check", label: "Open windows: Checked for construction, traffic, roosters" },
      { id: "c1_8", type: "number", label: "Open window dB", suffix: "dB" },
      { id: "c1_9", type: "check", label: "Closed windows: Soundproofing works" },
      { id: "c1_10", type: "number", label: "Closed window dB", suffix: "dB" },
      { id: "c1_11", type: "check", label: "Internal noise: Walls are NOT paper-thin" },
      { id: "c1_12", type: "number", label: "Download Speed", suffix: "Mbps" },
      { id: "c1_13", type: "number", label: "Upload Speed", suffix: "Mbps" },
      { id: "c1_14", type: "check", label: "Room has a dedicated router (not shared on floor)" }
    ]
  },
  {
    id: "s2",
    title: "2. Workspace Setup",
    items: [
      { id: "c2_1", type: "check", label: "Dedicated desk with good height and stability" },
      { id: "c2_2", type: "check", label: "Ergonomic / actual office chair (not hard wooden)" },
      { id: "c2_3", type: "check", label: "Accessible power outlets directly next to desk" },
      { id: "c2_4", type: "check", label: "Outlets take international/universal plugs" },
      { id: "c2_5", type: "check", label: "Workspace is well-lit (natural light or good indoor)" }
    ]
  },
  {
    id: "s3",
    title: "3. Kitchen & Drinking Water",
    items: [
      { id: "c3_0", type: "radio", label: "Drinking Water Handling", options: ["Landlord supplies 20L", "Tenant must order/carry"] },
      { id: "c3_1", type: "check", label: "Cooking utensils included (spatula, knives, chopping board)" },
      { id: "c3_2", type: "check", label: "Eating wares included (plates, bowls, cutlery, glasses)" },
      { id: "c3_3", type: "check", label: "Cooking vessels included (pots, frying pans)" },
      { id: "c3_4", type: "check", label: "Microwave is provided" },
      { id: "c3_5", type: "check", label: "Exhaust fan/ventilation above stove" },
      { id: "c3_6", type: "check", label: "Refrigerator is clean, no smells, freezer works" }
    ]
  },
  {
    id: "s4",
    title: "4. Bathroom & Laundry",
    items: [
      { id: "c4_0", type: "radio", label: "Water Heater Type", options: ["Electric Tank", "Solar (Needs Backup)"] },
      { id: "c4_1", type: "check", label: "Water pressure is strong (sink + shower running)" },
      { id: "c4_2", type: "check", label: "Drainage works instantly (doesn't pool after 1 min)" },
      { id: "c4_3", type: "radio", label: "Washing Machine", options: ["Private in-unit", "Shared in building"] },
      { id: "c4_4", type: "check", label: "Covered, ventilated space to dry clothes (rainy season safe)" }
    ]
  },
  {
    id: "s5",
    title: "5. General Comfort & Lighting",
    items: [
      { id: "c5_1", type: "check", label: "AC cools fast, filters clean, no musty smells" },
      { id: "c5_2", type: "check", label: "Windows face outside (not a brick wall or hallway)" },
      { id: "c5_3", type: "check", label: "Blackout curtains in the bedroom area" },
      { id: "c5_4", type: "check", label: "Bedside power outlets available" }
    ]
  },
  {
    id: "s6",
    title: "6. Building Facilities & Security",
    items: [
      { id: "c6_1", type: "check", label: "Elevator available (Crucial for 3rd floor+, luggage, water)" },
      { id: "c6_2", type: "check", label: "24/7 free access (No curfew / locked gate at 11 PM)" },
      { id: "c6_3", type: "radio", label: "Main Gate Security", options: ["Fingerprint", "Key Card", "Physical Padlock"] },
      { id: "c6_4", type: "check", label: "Secure, covered parking area for a scooter" }
    ]
  },
  {
    id: "s7",
    title: "7. Landlord & Financial Terms",
    items: [
      { id: "c7_1", type: "radio", label: "Landlord English Level", options: ["Fluent", "Basic", "None"] },
      { id: "c7_2", type: "number", label: "Electricity Rate (Cost per kWh)", suffix: "VND" },
      { id: "c7_3", type: "check", label: "Individual, visible electricity meter for unit" },
      { id: "c7_4", type: "check", label: "Included: Water (Nước sinh hoạt)" },
      { id: "c7_5", type: "check", label: "Included: Wi-Fi" },
      { id: "c7_6", type: "check", label: "Included: Trash collection" },
      { id: "c7_7", type: "check", label: "Included: Building management fees" },
      { id: "c7_8", type: "check", label: "Included: Cleaning service" },
      { id: "c7_9", type: "text", label: "Cleaning Frequency (e.g. 1x/week)" },
      { id: "c7_10", type: "check", label: "Landlord is completely comfortable with 1 to 3-month lease" },
      { id: "c7_11", type: "text", label: "Deposit Amount (e.g. 1 month rent)" }
    ]
  }
];
