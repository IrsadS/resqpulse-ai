import type { IncidentCategory, IncidentReport } from '@/types/incident';

export interface SectorPreset {
  name: string;
  latitude: number;
  longitude: number;
}

export interface ResponderPresetScenario {
  id: string;
  label: string;
  categoryHint: IncidentCategory;
  sectorName: string;
  latitude: number;
  longitude: number;
  rawText: string;
  simulatedPhotoScene: 'BRIDGE_COLLAPSE' | 'FLOODED_WARD' | 'LANDSLIDE_ROAD' | 'SHELTER_DEPOT';
}

export const MERAPI_SECTORS: SectorPreset[] = [
  { name: 'Cangkringan North Ridge', latitude: -7.6032, longitude: 110.4498 },
  { name: 'Kaliurang Clinic Sector', latitude: -7.5994, longitude: 110.4271 },
  { name: 'Sukamaju River Bridge', latitude: -7.6381, longitude: 110.3915 },
  { name: 'Muntilan Evacuation Post', latitude: -7.5812, longitude: 110.2924 },
  { name: 'Pakem Logistics Hub', latitude: -7.6654, longitude: 110.4189 },
];

export const RESPONDER_PRESETS: ResponderPresetScenario[] = [
  {
    id: 'preset-medical',
    label: 'Medical + PII',
    categoryHint: 'MEDICAL',
    sectorName: 'Kaliurang Clinic Sector',
    latitude: -7.5994,
    longitude: 110.4271,
    rawText:
      '3 trauma casualties near SD Kaliurang 2. Critical open tibia fracture with active arterial bleeding, patient: Budi Santoso NIK 3374011805880002 phone +6281234567890. Two other victims with mild lacerations. Need tourniquet, IV fluids, and immediate ambulance.',
    simulatedPhotoScene: 'FLOODED_WARD',
  },
  {
    id: 'preset-bridge',
    label: 'Bridge Collapse',
    categoryHint: 'INFRASTRUCTURE',
    sectorName: 'Sukamaju River Bridge',
    latitude: -7.6381,
    longitude: 110.3915,
    rawText:
      'Main concrete bridge at Sukamaju River collapsed after flash flood surge. Heavy debris blocking eastern approach. Standard ambulance and supply trucks cannot cross. Recommend rerouting via northern Pakem ridge.',
    simulatedPhotoScene: 'BRIDGE_COLLAPSE',
  },
  {
    id: 'preset-sos',
    label: 'Rooftop SOS',
    categoryHint: 'EVACUATION_SOS',
    sectorName: 'Cangkringan North Ridge',
    latitude: -7.6032,
    longitude: 110.4498,
    rawText:
      'Urgent SOS from RT 04 mosque rooftop: 15 residents trapped by rising 1.4m mudflow water. Includes 3 elderly patients and 2 infants. Contact caller a.n. Siti Rahayu 081398765432. Boat extraction required immediately.',
    simulatedPhotoScene: 'LANDSLIDE_ROAD',
  },
  {
    id: 'preset-logistics',
    label: 'Shelter Logistics',
    categoryHint: 'LOGISTICS',
    sectorName: 'Muntilan Evacuation Post',
    latitude: -7.5812,
    longitude: 110.2924,
    rawText:
      'Muntilan Village Hall shelter holding 120 displaced residents. Clean drinking water depleted, infant formula low, backup diesel generator has only 2 hours fuel remaining.',
    simulatedPhotoScene: 'SHELTER_DEPOT',
  },
];

export const INITIAL_INCIDENTS: IncidentReport[] = [
  {
    id: 'INC-2026-101',
    createdAtIso: '2026-11-18T06:12:00.000Z',
    sectorName: 'Kaliurang Clinic Sector',
    latitude: -7.5994,
    longitude: 110.4271,
    rawInputRedacted:
      'Primary clinic backup generator offline. 2 respiratory distress patients requiring oxygen cylinders, patient: [NAME_REDACTED] NIK [NIK_REDACTED].',
    piiRedactedCount: 2,
    piiRedactedTypes: ['PERSON_NAME', 'NATIONAL_ID_NIK'],
    category: 'MEDICAL',
    severity: 'CRITICAL',
    urgencyScore: 9,
    structuredSummary: '2 respiratory distress patients at Kaliurang Clinic requiring portable oxygen and power restoration.',
    affectedHeadcount: 2,
    vulnerableGroups: ['Respiratory Patients'],
    requiredResources: ['Portable Oxygen Cylinders', 'Emergency Ambulance', 'Medical Oxygen Regulator'],
    immediateActionChecklist: [
      'Elevate patient head 45 degrees and clear airway.',
      'Monitor SpO2 continuously and ration cylinder flow.',
      'Prepare stretcher transfer once route clearance confirmed.',
    ],
    accessRoadStatus: 'RESTRICTED',
    inferenceSource: 'ON_DEVICE',
    inferenceModeUsed: 'PREFER_ON_DEVICE',
    latencyMs: 38,
    syncStatus: 'SYNCED_FIRESTORE',
    photoDataUrl: null,
    cloudMultimodalAssessment: null,
  },
  {
    id: 'INC-2026-102',
    createdAtIso: '2026-11-18T06:18:00.000Z',
    sectorName: 'Sukamaju River Bridge',
    latitude: -7.6381,
    longitude: 110.3915,
    rawInputRedacted:
      'Sukamaju River western abutment washed out by flash flood. Bridge structural integrity failed; impassable for 4x4 trucks.',
    piiRedactedCount: 0,
    piiRedactedTypes: [],
    category: 'INFRASTRUCTURE',
    severity: 'HIGH',
    urgencyScore: 8,
    structuredSummary: 'Sukamaju River Bridge structural washout blocking primary eastern medical supply corridor.',
    affectedHeadcount: 0,
    vulnerableGroups: [],
    requiredResources: ['Route Diversion Signage', 'Bailey Bridge Engineering Assessment', 'Heavy Excavator'],
    immediateActionChecklist: [
      'Deploy physical barrier 100m before bridge deck.',
      'Broadcast route closure to approaching medical convoys.',
      'Mark northern Pakem ridge detour on tactical map.',
    ],
    accessRoadStatus: 'BLOCKED',
    inferenceSource: 'IN_CLOUD',
    inferenceModeUsed: 'PREFER_ON_DEVICE',
    latencyMs: 412,
    syncStatus: 'SYNCED_FIRESTORE',
    photoDataUrl: null,
    cloudMultimodalAssessment:
      'Cloud Multimodal Assessment (Gemini Flash): Severe abutment erosion detected along western span. Surface deflection indicates unsafe load capacity for vehicles above 1.5 tons.',
  },
  {
    id: 'INC-2026-103',
    createdAtIso: '2026-11-18T06:24:00.000Z',
    sectorName: 'Pakem Logistics Hub',
    latitude: -7.6654,
    longitude: 110.4189,
    rawInputRedacted:
      'Pakem Hub inventory check: 400L clean water, 80 hygiene kits, 60 thermal blankets ready for dispatch to northern shelters.',
    piiRedactedCount: 0,
    piiRedactedTypes: [],
    category: 'LOGISTICS',
    severity: 'MEDIUM',
    urgencyScore: 5,
    structuredSummary: 'Pakem Hub staging 400L clean water, 80 hygiene kits, and 60 thermal blankets ready for convoy dispatch.',
    affectedHeadcount: 0,
    vulnerableGroups: [],
    requiredResources: ['4x4 Logistics Truck', 'Fuel Jerrycans', 'Dispatch Escort'],
    immediateActionChecklist: [
      'Load water pallets and blankets onto high-clearance 4x4.',
      'Verify northern bypass clearance before departure.',
    ],
    accessRoadStatus: 'OPEN',
    inferenceSource: 'ON_DEVICE',
    inferenceModeUsed: 'PREFER_ON_DEVICE',
    latencyMs: 29,
    syncStatus: 'SYNCED_FIRESTORE',
    photoDataUrl: null,
    cloudMultimodalAssessment: null,
  },
];

export function generateSimulatedFieldPhoto(
  scene: 'BRIDGE_COLLAPSE' | 'FLOODED_WARD' | 'LANDSLIDE_ROAD' | 'SHELTER_DEPOT'
): string {
  if (typeof document === 'undefined') {
    return '';
  }

  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const palettes: Record<
    typeof scene,
    { sky: string; ground: string; accent: string; title: string; detail: string }
  > = {
    BRIDGE_COLLAPSE: {
      sky: '#1E293B',
      ground: '#475569',
      accent: '#DC2626',
      title: 'FIELD CAM 02 // SUKAMAJU BRIDGE',
      detail: 'SPAN COLLAPSE - FLASH FLOOD SCOUR',
    },
    FLOODED_WARD: {
      sky: '#0F172A',
      ground: '#1E3A8A',
      accent: '#D97706',
      title: 'FIELD CAM 01 // KALIURANG TRIAGE',
      detail: 'TRAUMA BAY WATER INTRUSION - 35CM',
    },
    LANDSLIDE_ROAD: {
      sky: '#334155',
      ground: '#78350F',
      accent: '#DC2626',
      title: 'FIELD CAM 04 // CANGKRINGAN RIDGE',
      detail: 'MUDFLOW WATER LEVEL RISING - ROOFTOP SOS',
    },
    SHELTER_DEPOT: {
      sky: '#1E293B',
      ground: '#334155',
      accent: '#2563EB',
      title: 'FIELD CAM 07 // MUNTILAN HALL',
      detail: 'EVACUATION POST - WATER SUPPLY LOW',
    },
  };

  const theme = palettes[scene];
  ctx.fillStyle = theme.sky;
  ctx.fillRect(0, 0, 640, 210);
  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, 210, 640, 150);

  if (scene === 'BRIDGE_COLLAPSE') {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 175, 210, 42);
    ctx.fillRect(420, 185, 220, 42);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(210, 220, 210, 140);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(195, 165, 240, 95);
  } else if (scene === 'FLOODED_WARD') {
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(90, 95, 460, 130);
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(305, 115, 30, 70);
    ctx.fillRect(285, 135, 70, 30);
    ctx.fillStyle = 'rgba(30, 64, 175, 0.55)';
    ctx.fillRect(0, 225, 640, 135);
  } else if (scene === 'LANDSLIDE_ROAD') {
    ctx.fillStyle = '#92400E';
    ctx.beginPath();
    ctx.moveTo(0, 120);
    ctx.lineTo(360, 260);
    ctx.lineTo(0, 260);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(420, 150, 130, 80);
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(465, 125, 40, 25);
  } else {
    ctx.fillStyle = '#475569';
    ctx.fillRect(80, 100, 480, 130);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(120, 180, 90, 45);
    ctx.fillRect(240, 180, 90, 45);
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fillRect(0, 0, 640, 46);
  ctx.fillRect(0, 314, 640, 46);

  ctx.fillStyle = theme.accent;
  ctx.fillRect(16, 15, 12, 12);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '600 14px monospace';
  ctx.fillText(theme.title, 38, 26);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '500 13px monospace';
  ctx.fillText(`${theme.detail} | GPS MERAPI CORRIDOR`, 16, 342);

  return canvas.toDataURL('image/jpeg', 0.85);
}
