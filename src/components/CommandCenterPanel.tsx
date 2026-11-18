'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Cloud,
  FlaskConical,
  ImagePlus,
  RefreshCw,
  Route,
  Search,
  Sparkles,
  Truck,
} from 'lucide-react';
import { InferenceSourceBadge } from '@/components/InferenceSourceBadge';
import {
  generateCommandBriefingCloud,
  runCloudMultimodalAnalysis,
} from '@/lib/hybrid-ai-engine';
import { generateSimulatedFieldPhoto } from '@/lib/preset-scenarios';
import type {
  CommandBriefing,
  IncidentCategory,
  IncidentReport,
  TriageSeverity,
} from '@/types/incident';

const TacticalMap = dynamic(() => import('@/components/TacticalMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[290px] items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600">
      Loading tactical sector map...
    </div>
  ),
});

interface CommandCenterPanelProps {
  incidents: IncidentReport[];
  isOnline: boolean;
  onSyncQueuedReports: () => Promise<void>;
  onUpdateIncident: (updated: IncidentReport) => void;
}

const SEVERITY_BADGE_STYLES: Record<TriageSeverity, string> = {
  CRITICAL: 'bg-red-50 text-[#B91C1C] border-red-200',
  HIGH: 'bg-amber-50 text-[#B45309] border-amber-200',
  MEDIUM: 'bg-blue-50 text-[#1D4ED8] border-blue-200',
  LOW: 'bg-emerald-50 text-[#15803D] border-emerald-200',
};

export function CommandCenterPanel({
  incidents,
  isOnline,
  onSyncQueuedReports,
  onUpdateIncident,
}: CommandCenterPanelProps) {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    incidents[0]?.id || null
  );
  const [categoryFilter, setCategoryFilter] = useState<IncidentCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [isSyncing, setIsSyncing] = useState(false);
  const [briefing, setBriefing] = useState<CommandBriefing | null>(null);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [briefingError, setBriefingError] = useState<string | null>(null);

  const [analyzingPhotoId, setAnalyzingPhotoId] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const queuedCount = useMemo(
    () => incidents.filter((item) => item.syncStatus === 'QUEUED_OFFLINE').length,
    [incidents]
  );

  const filteredIncidents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return incidents.filter((item) => {
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }
      if (!query) return true;
      return (
        item.sectorName.toLowerCase().includes(query) ||
        item.structuredSummary.toLowerCase().includes(query) ||
        item.rawInputRedacted.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query)
      );
    });
  }, [incidents, categoryFilter, searchQuery]);

  async function handleSyncClick() {
    setIsSyncing(true);
    try {
      await onSyncQueuedReports();
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleGenerateBriefing() {
    setBriefingError(null);
    setIsGeneratingBriefing(true);
    try {
      const result = await generateCommandBriefingCloud(incidents, isOnline);
      setBriefing(result);
    } catch (error) {
      setBriefingError(
        error instanceof Error
          ? error.message
          : 'Failed to synthesize Cloud Command Briefing.'
      );
    } finally {
      setIsGeneratingBriefing(false);
    }
  }

  async function handleAnalyzePhoto(incident: IncidentReport) {
    setPhotoError(null);
    setAnalyzingPhotoId(incident.id);
    try {
      const targetIncident = incident.photoDataUrl
        ? incident
        : {
            ...incident,
            photoDataUrl: generateSimulatedFieldPhoto(
              incident.category === 'INFRASTRUCTURE'
                ? 'BRIDGE_COLLAPSE'
                : incident.category === 'MEDICAL'
                ? 'FLOODED_WARD'
                : incident.category === 'EVACUATION_SOS'
                ? 'LANDSLIDE_ROAD'
                : 'SHELTER_DEPOT'
            ),
          };

      const analysis = await runCloudMultimodalAnalysis(targetIncident, isOnline);
      onUpdateIncident({
        ...targetIncident,
        cloudMultimodalAssessment: `${analysis.assessment} (${analysis.latencyMs}ms)`,
      });
    } catch (error) {
      setPhotoError(
        error instanceof Error ? error.message : 'Multimodal image analysis failed.'
      );
    } finally {
      setAnalyzingPhotoId(null);
    }
  }

  return (
    <section
      aria-labelledby="command-center-heading"
      className="flex flex-col space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 id="command-center-heading" className="text-lg font-bold text-slate-900">
            Command Center &amp; Tactical Map
          </h2>
          <p className="text-xs text-slate-600">
            Firestore offline-synced incident feed with cloud multimodal &amp; dispatch synthesis
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateBriefing}
          disabled={isGeneratingBriefing || incidents.length === 0}
          className="btn-tactile inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-lg bg-[#1E40AF] px-4 text-xs font-bold text-white hover:bg-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span>
            {isGeneratingBriefing
              ? 'Synthesizing Plan...'
              : 'Generate Multi-Sector Operation Plan'}
          </span>
        </button>
      </div>

      {queuedCount > 0 && (
        <div className="surface-enter flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-[#FFFBEB] px-3.5 py-2.5 text-xs">
          <div className="flex items-center gap-2 font-semibold text-[#B45309]">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              <strong className="font-mono tabular-nums">{queuedCount}</strong> field report(s) stored in local offline cache awaiting Firestore sync.
            </span>
          </div>
          <button
            type="button"
            onClick={handleSyncClick}
            disabled={!isOnline || isSyncing}
            className="btn-tactile inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md bg-[#B45309] px-3 text-xs font-bold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{isOnline ? 'Sync Queued Reports Now' : 'Restore Signal to Sync'}</span>
          </button>
        </div>
      )}

      {briefingError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-xs font-semibold text-[#B91C1C]"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{briefingError}</span>
        </div>
      )}

      {briefing && (
        <div
          aria-live="polite"
          className="surface-enter space-y-3 rounded-xl border border-blue-200 bg-[#EFF6FF]/75 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200 pb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1E3A8A]">
              {briefing.inferenceSource === 'IN_CLOUD' ? (
                <Cloud className="h-4 w-4 text-[#1E40AF]" aria-hidden="true" />
              ) : (
                <FlaskConical className="h-4 w-4 text-[#B45309]" aria-hidden="true" />
              )}
              <span>
                {briefing.inferenceSource === 'IN_CLOUD'
                  ? 'AI Command Operation Plan (Cloud)'
                  : 'Simulated Command Operation Plan'}
              </span>
            </div>
            <InferenceSourceBadge
              source={briefing.inferenceSource}
              latencyMs={briefing.latencyMs}
            />
          </div>

          <p className="text-sm font-medium text-slate-900">
            {briefing.executiveSitRep}
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-blue-200 bg-white p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Truck className="h-4 w-4 text-[#1E40AF]" aria-hidden="true" />
                <span>Priority Dispatch Sequence</span>
              </div>
              <ol className="list-decimal space-y-1 pl-4 text-xs text-slate-700">
                {briefing.priorityDispatchPlan.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="rounded-lg border border-amber-200 bg-white p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#B45309]">
                <Route className="h-4 w-4" aria-hidden="true" />
                <span>Route Hazard Warnings</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-700">
                {briefing.routeHazardWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>

          {briefing.resourceAllocationMatrix.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-blue-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Target sector</th>
                    <th className="px-3 py-2 font-semibold">Dispatch resource</th>
                    <th className="px-3 py-2 font-semibold">Priority</th>
                    <th className="px-3 py-2 font-semibold">Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {briefing.resourceAllocationMatrix.map((row) => (
                    <tr key={`${row.targetSector}-${row.resourceItem}`}>
                      <td className="px-3 py-2 font-semibold text-slate-900">
                        {row.targetSector}
                      </td>
                      <td className="px-3 py-2 text-slate-800">{row.resourceItem}</td>
                      <td className="px-3 py-2 font-mono font-bold text-[#B91C1C]">
                        {row.priorityLevel}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{row.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <TacticalMap
        incidents={filteredIncidents}
        selectedIncidentId={selectedIncidentId}
        onSelectIncident={setSelectedIncidentId}
      />

      <search className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <label htmlFor="incident-search" className="sr-only">
            Search incident reports
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            id="incident-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Filter by sector, summary, or ID..."
            className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Category filter">
          {(
            ['ALL', 'MEDICAL', 'INFRASTRUCTURE', 'EVACUATION_SOS', 'LOGISTICS'] as const
          ).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              aria-pressed={categoryFilter === cat}
              className={`btn-tactile min-h-[40px] cursor-pointer rounded-md border px-2.5 text-xs font-semibold ${
                categoryFilter === cat
                  ? 'border-[#1E40AF] bg-[#1E40AF] text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cat === 'ALL' ? 'All' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </search>

      {photoError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-xs font-semibold text-[#B91C1C]"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{photoError}</span>
        </div>
      )}

      {filteredIncidents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
          No incident reports match the active search or category filter. Clear filters to view all sector telemetry.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIncidents.map((incident) => {
            const isSelected = incident.id === selectedIncidentId;
            return (
              <article
                key={incident.id}
                onClick={() => setSelectedIncidentId(incident.id)}
                className={`interactive-card cursor-pointer rounded-lg border p-3.5 ${
                  isSelected
                    ? 'border-[#1E40AF] bg-[#EFF6FF]/40'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded border px-2 py-0.5 font-mono text-xs font-bold tabular-nums ${
                        SEVERITY_BADGE_STYLES[incident.severity]
                      }`}
                    >
                      {incident.severity} {incident.urgencyScore}/10
                    </span>
                    <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-white">
                      {incident.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {incident.sectorName}
                    </h3>
                    {incident.isSyntheticSample && (
                      <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                        Sample
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    <InferenceSourceBadge
                      source={incident.inferenceSource}
                      latencyMs={incident.latencyMs}
                    />
                    <span
                      className={`rounded px-2 py-0.5 font-bold ${
                        incident.syncStatus === 'SYNCED_FIRESTORE'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-[#FFFBEB] text-[#B45309]'
                      }`}
                    >
                      {incident.syncStatus}
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-sm text-slate-800">
                  {incident.structuredSummary}
                </p>

                <div className="mt-2 rounded bg-slate-50 p-2.5 font-mono text-xs text-slate-700">
                  <span className="font-bold text-slate-900">Redacted Input: </span>
                  {incident.rawInputRedacted}
                  {incident.piiRedactedCount > 0 && (
                    <span className="ml-2 inline-block rounded bg-[#F0FDF4] px-1.5 py-0.5 font-bold text-[#15803D]">
                      {incident.piiRedactedCount} PII scrubbed locally
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    {incident.requiredResources.map((resource) => (
                      <span
                        key={resource}
                        className="rounded border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-700"
                      >
                        {resource}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleAnalyzePhoto(incident);
                    }}
                    disabled={analyzingPhotoId === incident.id}
                    className="btn-tactile inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md border border-blue-300 bg-[#EFF6FF] px-3 text-xs font-bold text-[#1D4ED8] hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {incident.photoDataUrl ? (
                      <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>
                      {analyzingPhotoId === incident.id
                        ? 'Analyzing Photo...'
                        : incident.photoDataUrl
                        ? 'Analyze Photo (Cloud)'
                        : 'Capture & Analyze Photo'}
                    </span>
                  </button>
                </div>

                {incident.photoDataUrl && (
                  <div className="mt-2.5 overflow-hidden rounded-md border border-slate-200">
                    <img
                      src={incident.photoDataUrl}
                      alt={`Field telemetry snapshot for ${incident.sectorName}`}
                      width={640}
                      height={360}
                      className="h-32 w-full object-cover"
                    />
                  </div>
                )}

                {incident.cloudMultimodalAssessment && (
                  <div className="mt-2.5 rounded-md border border-blue-200 bg-[#EFF6FF] p-2.5 text-xs text-slate-800">
                    <span className="font-bold text-[#1D4ED8]">
                      Visual Assessment:{' '}
                    </span>
                    {incident.cloudMultimodalAssessment}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
