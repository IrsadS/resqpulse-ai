'use client';

import { useEffect, useState } from 'react';
import { CommandCenterPanel } from '@/components/CommandCenterPanel';
import { FieldResponderPanel } from '@/components/FieldResponderPanel';
import { HybridArchitectureModal } from '@/components/HybridArchitectureModal';
import { TacticalHeader } from '@/components/TacticalHeader';
import {
  isFirebaseConfigured,
  persistIncidentToFirestore,
} from '@/lib/firebase-client';
import { INITIAL_INCIDENTS } from '@/lib/preset-scenarios';
import type {
  IncidentReport,
  InferenceModeSetting,
  WorkspaceViewMode,
} from '@/types/incident';

const LOCAL_STORAGE_KEY = 'resqpulse_incidents_v1';

export default function HomePage() {
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('SPLIT_SIMULATOR');
  const [isOnline, setIsOnline] = useState(true);
  const [inferenceMode, setInferenceMode] =
    useState<InferenceModeSetting>('PREFER_ON_DEVICE');
  const [incidents, setIncidents] = useState<IncidentReport[]>(INITIAL_INCIDENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [firebaseLiveConfigured, setFirebaseLiveConfigured] = useState(false);

  useEffect(() => {
    setFirebaseLiveConfigured(isFirebaseConfigured());

    try {
      const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as IncidentReport[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setIncidents(parsed);
        }
      }
    } catch {
      // Ignore invalid local storage state and keep default incidents.
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  function saveLocalCache(nextIncidents: IncidentReport[]) {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextIncidents));
    } catch {
      // Storage quota fallback: keep state in memory.
    }
  }

  async function handleReportCreated(report: IncidentReport) {
    let finalReport = report;
    if (isOnline && isFirebaseConfigured()) {
      try {
        const synced = await persistIncidentToFirestore(report);
        if (synced) {
          finalReport = { ...report, syncStatus: 'SYNCED_FIRESTORE' };
        }
      } catch {
        finalReport = { ...report, syncStatus: 'QUEUED_OFFLINE' };
      }
    }

    setIncidents((prev) => {
      const next = [finalReport, ...prev];
      saveLocalCache(next);
      return next;
    });
  }

  function handleUpdateIncident(updated: IncidentReport) {
    setIncidents((prev) => {
      const next = prev.map((item) => (item.id === updated.id ? updated : item));
      saveLocalCache(next);
      return next;
    });
  }

  async function handleSyncQueuedReports() {
    if (!isOnline) return;

    const queued = incidents.filter((item) => item.syncStatus === 'QUEUED_OFFLINE');
    if (queued.length === 0) return;

    if (isFirebaseConfigured()) {
      await Promise.all(queued.map((item) => persistIncidentToFirestore(item)));
    }

    setIncidents((prev) => {
      const next = prev.map((item) =>
        item.syncStatus === 'QUEUED_OFFLINE'
          ? { ...item, syncStatus: 'SYNCED_FIRESTORE' as const }
          : item
      );
      saveLocalCache(next);
      return next;
    });
  }

  const queuedCount = incidents.filter(
    (item) => item.syncStatus === 'QUEUED_OFFLINE'
  ).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <TacticalHeader
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline((prev) => !prev)}
        inferenceMode={inferenceMode}
        onChangeInferenceMode={setInferenceMode}
        firebaseLiveConfigured={firebaseLiveConfigured}
        totalIncidents={incidents.length}
        queuedCount={queuedCount}
        onOpenArchitectureModal={() => setIsModalOpen(true)}
      />

      <main className="mx-auto max-w-[1600px] p-4">
        {viewMode === 'SPLIT_SIMULATOR' && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5 xl:col-span-4">
              <FieldResponderPanel
                isOnline={isOnline}
                inferenceMode={inferenceMode}
                onReportCreated={handleReportCreated}
              />
            </div>
            <div className="lg:col-span-7 xl:col-span-8">
              <CommandCenterPanel
                incidents={incidents}
                isOnline={isOnline}
                onSyncQueuedReports={handleSyncQueuedReports}
                onUpdateIncident={handleUpdateIncident}
              />
            </div>
          </div>
        )}

        {viewMode === 'FIELD_RESPONDER' && (
          <div className="mx-auto max-w-md">
            <FieldResponderPanel
              isOnline={isOnline}
              inferenceMode={inferenceMode}
              onReportCreated={handleReportCreated}
            />
          </div>
        )}

        {viewMode === 'COMMAND_CENTER' && (
          <CommandCenterPanel
            incidents={incidents}
            isOnline={isOnline}
            onSyncQueuedReports={handleSyncQueuedReports}
            onUpdateIncident={handleUpdateIncident}
          />
        )}
      </main>

      <HybridArchitectureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
