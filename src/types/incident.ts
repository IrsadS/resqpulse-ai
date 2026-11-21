export type IncidentCategory = 'MEDICAL' | 'INFRASTRUCTURE' | 'EVACUATION_SOS' | 'LOGISTICS';
export type TriageSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type InferenceSourceType = 'ON_DEVICE' | 'IN_CLOUD' | 'SIMULATED';
export type InferenceModeSetting = 'PREFER_ON_DEVICE' | 'ONLY_ON_DEVICE' | 'ONLY_IN_CLOUD';
export type RoadAccessStatus = 'OPEN' | 'RESTRICTED' | 'BLOCKED';
export type SyncState = 'SYNCED_FIRESTORE' | 'QUEUED_OFFLINE';
export type WorkspaceViewMode = 'SPLIT_SIMULATOR' | 'FIELD_RESPONDER' | 'COMMAND_CENTER';
export type OnDeviceAvailabilityState =
  | 'CHECKING'
  | 'AVAILABLE'
  | 'DOWNLOADABLE'
  | 'DOWNLOADING'
  | 'UNAVAILABLE';

export interface IncidentReport {
  id: string;
  createdAtIso: string;
  sectorName: string;
  latitude: number;
  longitude: number;
  rawInputRedacted: string;
  piiRedactedCount: number;
  piiRedactedTypes: string[];
  category: IncidentCategory;
  severity: TriageSeverity;
  urgencyScore: number;
  structuredSummary: string;
  affectedHeadcount: number;
  vulnerableGroups: string[];
  requiredResources: string[];
  immediateActionChecklist: string[];
  accessRoadStatus: RoadAccessStatus;
  inferenceSource: InferenceSourceType;
  inferenceModeUsed: InferenceModeSetting;
  latencyMs: number;
  syncStatus: SyncState;
  photoDataUrl: string | null;
  cloudMultimodalAssessment: string | null;
  isSyntheticSample?: boolean;
}

export interface CommandBriefing {
  generatedAtIso: string;
  inferenceSource: InferenceSourceType;
  latencyMs: number;
  executiveSitRep: string;
  priorityDispatchPlan: string[];
  routeHazardWarnings: string[];
  resourceAllocationMatrix: Array<{
    targetSector: string;
    resourceItem: string;
    priorityLevel: TriageSeverity;
    rationale: string;
  }>;
}

export interface PiiRedactionResult {
  redactedText: string;
  piiRedactedCount: number;
  piiRedactedTypes: string[];
}
