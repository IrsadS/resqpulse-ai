import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
  InferenceSource,
} from 'firebase/ai';
import { getFirebaseApp } from '@/lib/firebase-client';
import { redactSensitivePii } from '@/lib/pii-scrubber';
import type {
  CommandBriefing,
  IncidentCategory,
  IncidentReport,
  InferenceModeSetting,
  InferenceSourceType,
  OnDeviceAvailabilityState,
  RoadAccessStatus,
  TriageSeverity,
} from '@/types/incident';

export interface AnalyzeFieldReportParams {
  rawText: string;
  sectorName: string;
  latitude: number;
  longitude: number;
  inferenceMode: InferenceModeSetting;
  isOnline: boolean;
  photoDataUrl: string | null;
}

interface StructuredTriagePayload {
  category: IncidentCategory;
  severity: TriageSeverity;
  urgencyScore: number;
  structuredSummary: string;
  affectedHeadcount: number;
  vulnerableGroups: string[];
  requiredResources: string[];
  immediateActionChecklist: string[];
  accessRoadStatus: RoadAccessStatus;
}

const DEFAULT_CLOUD_MODEL =
  process.env.NEXT_PUBLIC_FIREBASE_CLOUD_MODEL || 'gemini-3.5-flash-lite';

export async function detectOnDeviceCapability(): Promise<OnDeviceAvailabilityState> {
  if (typeof window === 'undefined') {
    return 'UNAVAILABLE';
  }

  const lm = (
    window as unknown as {
      LanguageModel?: { availability?: () => Promise<string> };
    }
  ).LanguageModel;

  if (!lm || typeof lm.availability !== 'function') {
    return 'UNAVAILABLE';
  }

  try {
    const status = await lm.availability();
    if (status === 'available') return 'AVAILABLE';
    if (status === 'downloadable') return 'DOWNLOADABLE';
    if (status === 'downloading') return 'DOWNLOADING';
    return 'UNAVAILABLE';
  } catch {
    return 'UNAVAILABLE';
  }
}

function toSdkInferenceMode(mode: InferenceModeSetting): InferenceMode {
  if (mode === 'ONLY_ON_DEVICE') return InferenceMode.ONLY_ON_DEVICE;
  if (mode === 'ONLY_IN_CLOUD') return InferenceMode.ONLY_IN_CLOUD;
  return InferenceMode.PREFER_ON_DEVICE;
}

function mapSdkInferenceSource(
  source: InferenceSource | undefined,
  fallbackIfUnmarked: InferenceSourceType
): InferenceSourceType {
  if (source === InferenceSource.IN_CLOUD) return 'IN_CLOUD';
  if (source === InferenceSource.ON_DEVICE) return 'ON_DEVICE';
  return fallbackIfUnmarked;
}

function extractFirstNumber(text: string, pattern: RegExp, fallback: number): number {
  const match = text.match(pattern);
  if (!match) return fallback;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function countKeywordMatches(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function classifyLocallyDeterministic(redactedText: string): StructuredTriagePayload {
  const lower = redactedText.toLowerCase();

  const scores: Record<IncidentCategory, number> = {
    MEDICAL: countKeywordMatches(
      lower,
      /\b(?:fracture|bleeding|trauma|patient|victim|casualt\w*|wound\w*|oxygen|respiratory|tourniquet|luka|patah)\b/g
    ),
    INFRASTRUCTURE: countKeywordMatches(
      lower,
      /\b(?:bridge|collapse\w*|road|blocked|blocking|impassable|landslide|abutment|washout|rerout\w*|debris|jembatan)\b/g
    ),
    EVACUATION_SOS: countKeywordMatches(
      lower,
      /\b(?:sos|trapped|rooftop|evacuat\w*|boat|mudflow|stranded|terjebak|ataps?)\b/g
    ),
    LOGISTICS: countKeywordMatches(
      lower,
      /\b(?:shelter|water|blanket\w*|fuel|diesel|generator|formula|food|suppl\w*|logistics|posko|inventory)\b/g
    ),
  };

  let category: IncidentCategory = 'LOGISTICS';
  let bestScore = -1;
  for (const key of Object.keys(scores) as IncidentCategory[]) {
    if (scores[key] > bestScore) {
      bestScore = scores[key];
      category = key;
    }
  }

  const isCritical =
    /critical|arterial|bleeding|trapped|rooftop|sos|collapsed|immediately|respiratory|infant|elderly/.test(
      lower
    );
  const isHigh = /urgent|blocked|impassable|depleted|hours|severe|high|flood/.test(lower);

  const severity: TriageSeverity = isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'MEDIUM';
  const urgencyScore =
    severity === 'CRITICAL' ? 9 : severity === 'HIGH' ? 8 : severity === 'MEDIUM' ? 5 : 3;

  const headcount = extractFirstNumber(
    redactedText,
    /\b(\d{1,3})\s+(?:residents|victims|casualties|patients|displaced|people|warga|korban)/i,
    category === 'INFRASTRUCTURE' ? 0 : 2
  );

  const vulnerableGroups: string[] = [];
  if (/elderly|lansia/.test(lower)) vulnerableGroups.push('Elderly');
  if (/infant|baby|bayi/.test(lower)) vulnerableGroups.push('Infants');
  if (/respiratory|oxygen/.test(lower)) vulnerableGroups.push('Respiratory Patients');
  if (/fracture|bleeding|trauma/.test(lower)) vulnerableGroups.push('Acute Trauma');

  let accessRoadStatus: RoadAccessStatus = 'OPEN';
  if (/collapsed|blocked|impassable|washout|terputus/.test(lower)) {
    accessRoadStatus = 'BLOCKED';
  } else if (/debris|mudflow|flood|rising|restricted/.test(lower)) {
    accessRoadStatus = 'RESTRICTED';
  }

  const requiredResourcesByCategory: Record<IncidentCategory, string[]> = {
    MEDICAL: ['Trauma & Tourniquet Kit', 'IV Crystalloid Fluids', '4x4 Medical Ambulance'],
    INFRASTRUCTURE: ['Route Diversion Signage', 'Heavy Excavator', 'Bailey Bridge Assessment'],
    EVACUATION_SOS: ['Inflatable Rescue Boat', 'SAR Rope Extraction Team', 'Thermal Blankets'],
    LOGISTICS: ['Potable Water Tanks', 'Diesel Generator Fuel', 'Infant Nutrition Packs'],
  };

  const checklistByCategory: Record<IncidentCategory, string[]> = {
    MEDICAL: [
      'Apply direct pressure or proximal tourniquet for arterial bleeding.',
      'Immobilize suspected open fracture and cover with sterile dressing.',
      'Keep redacted patient identity local until medical handover.',
    ],
    INFRASTRUCTURE: [
      'Establish safety perimeter 100m upstream of damaged structure.',
      'Flag corridor as BLOCKED for heavy ambulance convoys.',
      'Direct approaching units to verified ridge bypass.',
    ],
    EVACUATION_SOS: [
      'Confirm rooftop headcount and prioritize elderly and infants first.',
      'Verify mudflow depth before launching rescue craft.',
      'Stage warm dry shelter transport at nearest dry ridge.',
    ],
    LOGISTICS: [
      'Ration potable water for critical hydration and infant needs.',
      'Conserve remaining diesel generator fuel for medical cold chain.',
      'Request convoy replenishment from Pakem Logistics Hub.',
    ],
  };

  const summaryPrefix: Record<IncidentCategory, string> = {
    MEDICAL: `${headcount} medical casualties reported requiring rapid trauma stabilization and ambulance dispatch.`,
    INFRASTRUCTURE: `Critical transport corridor damage detected; road access status ${accessRoadStatus}.`,
    EVACUATION_SOS: `${headcount} stranded residents requesting urgent extraction from rising floodwater.`,
    LOGISTICS: `Shelter supply shortage affecting ${headcount} displaced residents; immediate resupply needed.`,
  };

  return {
    category,
    severity,
    urgencyScore,
    structuredSummary: summaryPrefix[category],
    affectedHeadcount: headcount,
    vulnerableGroups,
    requiredResources: requiredResourcesByCategory[category],
    immediateActionChecklist: checklistByCategory[category],
    accessRoadStatus,
  };
}

function parseJsonPayload<T>(rawText: string): T | null {
  const cleaned = rawText.replace(/```json|```/gi, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace <= firstBrace) return null;
  try {
    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as T;
  } catch {
    return null;
  }
}

export async function analyzeFieldReportHybrid(
  params: AnalyzeFieldReportParams
): Promise<IncidentReport> {
  const startedAt = performance.now();

  if (!params.isOnline && params.inferenceMode === 'ONLY_IN_CLOUD') {
    throw new Error(
      'Cloud inference unreachable while offline. Switch InferenceMode to PREFER_ON_DEVICE or ONLY_ON_DEVICE.'
    );
  }

  // Stage 1: Privacy protection always runs locally on-device before any prompt or persistence.
  const redaction = redactSensitivePii(params.rawText);

  let structured: StructuredTriagePayload | null = null;
  let actualSource: InferenceSourceType = 'SIMULATED';

  const firebaseApp = getFirebaseApp();
  if (firebaseApp && (params.isOnline || params.inferenceMode !== 'ONLY_IN_CLOUD')) {
    try {
      const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
      const model = getGenerativeModel(ai, {
        mode: toSdkInferenceMode(params.inferenceMode),
        inCloudParams: { model: DEFAULT_CLOUD_MODEL },
      });

      const prompt = [
        'Classify this disaster field report into strict JSON with keys:',
        'category (MEDICAL|INFRASTRUCTURE|EVACUATION_SOS|LOGISTICS),',
        'severity (CRITICAL|HIGH|MEDIUM|LOW), urgencyScore (1-10 integer),',
        'structuredSummary (1 concise sentence), affectedHeadcount (integer),',
        'vulnerableGroups (string[]), requiredResources (string[]),',
        'immediateActionChecklist (3 short imperatives), accessRoadStatus (OPEN|RESTRICTED|BLOCKED).',
        `Sector: ${params.sectorName}`,
        `Redacted Report: ${redaction.redactedText}`,
      ].join('\n');

      const result = await model.generateContent(prompt);
      const parsed = parseJsonPayload<StructuredTriagePayload>(result.response.text());
      if (parsed && parsed.category && parsed.severity) {
        structured = parsed;
        actualSource = mapSdkInferenceSource(
          result.response.inferenceSource,
          params.inferenceMode === 'ONLY_IN_CLOUD'
            ? 'IN_CLOUD'
            : params.inferenceMode === 'ONLY_ON_DEVICE'
            ? 'ON_DEVICE'
            : 'SIMULATED'
        );
      }
    } catch (error) {
      if (params.inferenceMode === 'ONLY_IN_CLOUD' && !params.isOnline) {
        throw error;
      }
    }
  }

  if (!structured) {
    structured = classifyLocallyDeterministic(redaction.redactedText);
    actualSource = 'SIMULATED';
  }

  const elapsedMs = Math.max(1, Math.round(performance.now() - startedAt));

  return {
    id: `INC-${Date.now().toString().slice(-6)}`,
    createdAtIso: new Date().toISOString(),
    sectorName: params.sectorName,
    latitude: params.latitude,
    longitude: params.longitude,
    rawInputRedacted: redaction.redactedText,
    piiRedactedCount: redaction.piiRedactedCount,
    piiRedactedTypes: redaction.piiRedactedTypes,
    category: structured.category,
    severity: structured.severity,
    urgencyScore: Math.min(10, Math.max(1, Number(structured.urgencyScore) || 5)),
    structuredSummary: structured.structuredSummary,
    affectedHeadcount: Number(structured.affectedHeadcount) || 0,
    vulnerableGroups: Array.isArray(structured.vulnerableGroups)
      ? structured.vulnerableGroups
      : [],
    requiredResources: Array.isArray(structured.requiredResources)
      ? structured.requiredResources
      : [],
    immediateActionChecklist: Array.isArray(structured.immediateActionChecklist)
      ? structured.immediateActionChecklist
      : [],
    accessRoadStatus: structured.accessRoadStatus || 'OPEN',
    inferenceSource: actualSource,
    inferenceModeUsed: params.inferenceMode,
    latencyMs: elapsedMs,
    syncStatus: params.isOnline ? 'SYNCED_FIRESTORE' : 'QUEUED_OFFLINE',
    photoDataUrl: params.photoDataUrl,
    cloudMultimodalAssessment: null,
  };
}

export async function runCloudMultimodalAnalysis(
  incident: IncidentReport,
  isOnline: boolean
): Promise<{ assessment: string; inferenceSource: InferenceSourceType; latencyMs: number }> {
  if (!isOnline) {
    throw new Error(
      'Cannot run Cloud Multimodal Analysis while signal is OFFLINE. Restore connection first.'
    );
  }

  const startedAt = performance.now();
  const firebaseApp = getFirebaseApp();

  if (firebaseApp && incident.photoDataUrl?.includes('base64,')) {
    try {
      const [meta, base64Data] = incident.photoDataUrl.split('base64,');
      const mimeType = meta.replace('data:', '').replace(';', '') || 'image/jpeg';
      const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
      const cloudModel = getGenerativeModel(ai, {
        mode: InferenceMode.ONLY_IN_CLOUD,
        inCloudParams: { model: DEFAULT_CLOUD_MODEL },
      });

      const result = await cloudModel.generateContent([
        `Evaluate disaster field image for sector ${incident.sectorName} (${incident.category}). Assess structural safety, water/debris hazard, and heavy rescue vehicle passability in 2 concise sentences.`,
        { type: 'inlineData', inlineData: { data: base64Data, mimeType } },
      ]);

      return {
        assessment: result.response.text().trim(),
        inferenceSource: mapSdkInferenceSource(result.response.inferenceSource, 'IN_CLOUD'),
        latencyMs: Math.max(1, Math.round(performance.now() - startedAt)),
      };
    } catch {
      // Fall back to deterministic simulator assessment when live Firebase AI fails or is unconfigured.
    }
  }

  const assessmentsByCategory: Record<IncidentCategory, string> = {
    MEDICAL:
      'Simulated Structural Assessment: Triage bay intrusion estimated at 30-40cm water depth. Elevate patient stretchers and stage high-clearance 4x4 ambulance.',
    INFRASTRUCTURE:
      'Simulated Structural Assessment: Primary deck separation and abutment scour indicated. Heavy emergency vehicles should avoid span and detour via northern Pakem bypass.',
    EVACUATION_SOS:
      'Simulated Structural Assessment: Fast-moving debris-laden floodwater surrounding structure. Inflatable motorized rescue boat extraction recommended from eastern ridge.',
    LOGISTICS:
      'Simulated Structural Assessment: Staging area accessible via dry perimeter road with clearance for 2 supply trucks and portable generator offload.',
  };

  return {
    assessment: assessmentsByCategory[incident.category],
    inferenceSource: 'SIMULATED',
    latencyMs: Math.max(1, Math.round(performance.now() - startedAt)),
  };
}

export async function generateCommandBriefingCloud(
  incidents: IncidentReport[],
  isOnline: boolean
): Promise<CommandBriefing> {
  if (!isOnline) {
    throw new Error(
      'Command Center Cloud Synthesis requires an active connection (ONLY_IN_CLOUD). Local reports remain safe in offline queue.'
    );
  }

  const startedAt = performance.now();
  const firebaseApp = getFirebaseApp();

  if (firebaseApp && incidents.length > 0) {
    try {
      const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
      const cloudModel = getGenerativeModel(ai, {
        mode: InferenceMode.ONLY_IN_CLOUD,
        inCloudParams: { model: DEFAULT_CLOUD_MODEL },
      });

      const compactFeed = incidents
        .slice(0, 12)
        .map(
          (item) =>
            `${item.id} | ${item.sectorName} | ${item.category} | ${item.severity} (${item.urgencyScore}/10) | Road:${item.accessRoadStatus} | ${item.structuredSummary}`
        )
        .join('\n');

      const prompt = [
        'Synthesize these redacted disaster field reports into strict JSON CommandBriefing:',
        'Keys: executiveSitRep (2 sentences), priorityDispatchPlan (array of 3 actions),',
        'routeHazardWarnings (array of strings), resourceAllocationMatrix (array of {targetSector, resourceItem, priorityLevel, rationale}).',
        compactFeed,
      ].join('\n');

      const result = await cloudModel.generateContent(prompt);
      const parsed = parseJsonPayload<
        Omit<CommandBriefing, 'generatedAtIso' | 'inferenceSource' | 'latencyMs'>
      >(result.response.text());

      if (parsed && parsed.executiveSitRep) {
        return {
          generatedAtIso: new Date().toISOString(),
          inferenceSource: mapSdkInferenceSource(result.response.inferenceSource, 'IN_CLOUD'),
          latencyMs: Math.max(1, Math.round(performance.now() - startedAt)),
          executiveSitRep: parsed.executiveSitRep,
          priorityDispatchPlan: parsed.priorityDispatchPlan || [],
          routeHazardWarnings: parsed.routeHazardWarnings || [],
          resourceAllocationMatrix: parsed.resourceAllocationMatrix || [],
        };
      }
    } catch {
      // Fall through to deterministic simulator when Firebase credentials are not provided.
    }
  }

  const criticalCount = incidents.filter((item) => item.severity === 'CRITICAL').length;
  const blockedRoutes = incidents.filter((item) => item.accessRoadStatus === 'BLOCKED');
  const medicalUnits = incidents.filter((item) => item.category === 'MEDICAL');
  const sosUnits = incidents.filter((item) => item.category === 'EVACUATION_SOS');
  const logisticsUnits = incidents.filter((item) => item.category === 'LOGISTICS');

  const routeHazardWarnings =
    blockedRoutes.length > 0
      ? blockedRoutes.map(
          (item) =>
            `${item.sectorName} access is BLOCKED (${item.structuredSummary}). Reroute heavy ambulances via Pakem northern ridge.`
        )
      : ['All primary response corridors currently passable with 4x4 caution.'];

  const priorityDispatchPlan: string[] = [];
  if (sosUnits.length > 0) {
    priorityDispatchPlan.push(
      `Dispatch SAR motorized rescue boat immediately to ${sosUnits[0].sectorName} (${sosUnits[0].affectedHeadcount} residents stranded).`
    );
  }
  if (medicalUnits.length > 0) {
    priorityDispatchPlan.push(
      `Route 4x4 Trauma Ambulance to ${medicalUnits[0].sectorName} via northern ridge bypass, carrying tourniquets, IV fluids, and oxygen.`
    );
  }
  if (logisticsUnits.length > 0) {
    priorityDispatchPlan.push(
      `Mobilize Pakem Hub supply convoy with potable water and diesel fuel toward ${logisticsUnits[0].sectorName}.`
    );
  }
  if (priorityDispatchPlan.length === 0) {
    priorityDispatchPlan.push('Maintain active sector telemetry watch and keep medical reserves staged at Pakem Hub.');
  }

  const resourceAllocationMatrix = incidents
    .slice()
    .sort((a, b) => b.urgencyScore - a.urgencyScore)
    .slice(0, 4)
    .map((item) => ({
      targetSector: item.sectorName,
      resourceItem: item.requiredResources[0] || 'Emergency Response Team',
      priorityLevel: item.severity,
      rationale: `${item.category} urgency ${item.urgencyScore}/10 (Road: ${item.accessRoadStatus})`,
    }));

  return {
    generatedAtIso: new Date().toISOString(),
    inferenceSource: 'SIMULATED',
    latencyMs: Math.max(1, Math.round(performance.now() - startedAt)),
    executiveSitRep: `Simulated SitRep across ${incidents.length} redacted field reports (${criticalCount} CRITICAL). Medical stabilization and rooftop boat extraction are prioritized along northern bypass routes due to ${blockedRoutes.length} blocked crossing(s).`,
    priorityDispatchPlan,
    routeHazardWarnings,
    resourceAllocationMatrix,
  };
}
