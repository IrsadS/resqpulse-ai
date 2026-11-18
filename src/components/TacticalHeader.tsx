'use client';

import {
  Activity,
  Cpu,
  Info,
  Layers,
  Radio,
  Smartphone,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { InferenceModeSetting, WorkspaceViewMode } from '@/types/incident';

interface TacticalHeaderProps {
  viewMode: WorkspaceViewMode;
  onChangeViewMode: (mode: WorkspaceViewMode) => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  inferenceMode: InferenceModeSetting;
  onChangeInferenceMode: (mode: InferenceModeSetting) => void;
  firebaseLiveConfigured: boolean;
  totalIncidents: number;
  queuedCount: number;
  onOpenArchitectureModal: () => void;
}

export function TacticalHeader({
  viewMode,
  onChangeViewMode,
  isOnline,
  onToggleOnline,
  inferenceMode,
  onChangeInferenceMode,
  firebaseLiveConfigured,
  totalIncidents,
  queuedCount,
  onOpenArchitectureModal,
}: TacticalHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E40AF] text-white">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                ResQPulse AI
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-[#1D4ED8]">
                <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
                {firebaseLiveConfigured
                  ? 'Firebase AI Logic Connected'
                  : 'Hybrid AI Local Simulator'}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Mount Merapi &amp; Central Java Crisis Corridor | Unified Medical &amp; Disaster Triage
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="group"
            aria-label="Workspace layout mode"
            className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1"
          >
            <button
              type="button"
              onClick={() => onChangeViewMode('SPLIT_SIMULATOR')}
              aria-pressed={viewMode === 'SPLIT_SIMULATOR'}
              className={`inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors ${
                viewMode === 'SPLIT_SIMULATOR'
                  ? 'bg-[#1E40AF] text-white'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="h-4 w-4" aria-hidden="true" />
              Split Demo
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('FIELD_RESPONDER')}
              aria-pressed={viewMode === 'FIELD_RESPONDER'}
              className={`inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors ${
                viewMode === 'FIELD_RESPONDER'
                  ? 'bg-[#1E40AF] text-white'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Smartphone className="h-4 w-4" aria-hidden="true" />
              Field PWA
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('COMMAND_CENTER')}
              aria-pressed={viewMode === 'COMMAND_CENTER'}
              className={`inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors ${
                viewMode === 'COMMAND_CENTER'
                  ? 'bg-[#1E40AF] text-white'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Radio className="h-4 w-4" aria-hidden="true" />
              Command Desk
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleOnline}
            aria-pressed={!isOnline}
            className={`inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-lg border px-3.5 text-xs font-bold transition-colors ${
              isOnline
                ? 'border-emerald-300 bg-emerald-50 text-[#15803D] hover:bg-emerald-100'
                : 'border-red-300 bg-red-50 text-[#B91C1C] hover:bg-red-100'
            }`}
          >
            {isOnline ? (
              <Wifi className="h-4 w-4" aria-hidden="true" />
            ) : (
              <WifiOff className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{isOnline ? 'Signal: ONLINE (4G/Sat)' : 'Signal: OFFLINE (Blackout)'}</span>
          </button>

          <div className="flex flex-col">
            <label htmlFor="inference-mode-select" className="sr-only">
              Firebase AI Inference Mode
            </label>
            <select
              id="inference-mode-select"
              value={inferenceMode}
              onChange={(event) =>
                onChangeInferenceMode(event.target.value as InferenceModeSetting)
              }
              className="min-h-[48px] cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 hover:border-slate-400"
            >
              <option value="PREFER_ON_DEVICE">Mode: PREFER_ON_DEVICE</option>
              <option value="ONLY_ON_DEVICE">Mode: ONLY_ON_DEVICE</option>
              <option value="ONLY_IN_CLOUD">Mode: ONLY_IN_CLOUD</option>
            </select>
          </div>

          <div className="hidden items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs xl:flex">
            <div>
              <span className="text-slate-500">Reports:</span>{' '}
              <strong className="font-mono tabular-nums text-slate-900">
                {totalIncidents}
              </strong>
            </div>
            <div className="h-4 w-px bg-slate-300" aria-hidden="true" />
            <div>
              <span className="text-slate-500">Offline Queue:</span>{' '}
              <strong
                className={`font-mono tabular-nums ${
                  queuedCount > 0 ? 'text-[#B45309]' : 'text-[#15803D]'
                }`}
              >
                {queuedCount}
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenArchitectureModal}
            className="inline-flex min-h-[48px] cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100"
          >
            <Info className="h-4 w-4 text-[#1E40AF]" aria-hidden="true" />
            Hybrid SDK Guide
          </button>
        </div>
      </div>
    </header>
  );
}
