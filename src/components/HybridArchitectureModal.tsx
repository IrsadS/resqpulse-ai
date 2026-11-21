'use client';

import { useEffect, useRef } from 'react';
import { Cloud, Cpu, FlaskConical, Lock, X } from 'lucide-react';

interface HybridArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HybridArchitectureModal({
  isOpen,
  onClose,
}: HybridArchitectureModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hybrid-modal-title"
      onClick={onClose}
    >
      <div
        className="surface-enter max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2
              id="hybrid-modal-title"
              className="text-xl font-bold text-slate-900"
            >
              Firebase AI Logic Hybrid Inference Guide
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              How ResQPulse AI routes tasks across Gemini Nano (on-device), Gemini Flash (cloud), and transparent fallback simulation.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="btn-tactile inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 space-y-3 text-sm text-slate-800">
          <div className="rounded-lg border border-emerald-200 bg-[#F0FDF4] p-4">
            <div className="flex items-center gap-2 font-bold text-[#15803D]">
              <Lock className="h-4 w-4" aria-hidden="true" />
              <span>ON_DEVICE &amp; Privacy Guard (ONLY_ON_DEVICE)</span>
            </div>
            <p className="mt-1 text-slate-700">
              Scrubs Indonesian NIK, phone numbers, and patient names locally before storage or cloud escalation. When Chrome Built-in AI (Gemini Nano) runs triage locally, the badge displays <code>ON_DEVICE</code>.
            </p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-[#EFF6FF] p-4">
            <div className="flex items-center gap-2 font-bold text-[#1D4ED8]">
              <Cloud className="h-4 w-4" aria-hidden="true" />
              <span>IN_CLOUD (PREFER_ON_DEVICE fallback &amp; ONLY_IN_CLOUD)</span>
            </div>
            <p className="mt-1 text-slate-700">
              When Chrome lacks local Gemini Nano or Command Center escalates a field photo/SitRep, <code>firebase/ai</code> falls back to cloud inference and reports <code>IN_CLOUD</code> via <code>result.response.inferenceSource</code>.
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-[#FFFBEB] p-4">
            <div className="flex items-center gap-2 font-bold text-[#B45309]">
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
              <span>SIMULATED (Offline / Unconfigured Fallback)</span>
            </div>
            <p className="mt-1 text-slate-700">
              If Firebase environment keys are not configured yet or an offline device lacks Chrome Gemini Nano flags, the local deterministic classifier handles triage cleanly and explicitly displays <code>SIMULATED</code> with genuine elapsed timing.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-900 p-4 text-xs text-slate-100">
            <div className="mb-2 flex items-center gap-2 font-semibold text-slate-300">
              <Cpu className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              <span>Enabling Real On-Device Gemini Nano in Chrome Desktop:</span>
            </div>
            <ol className="list-decimal space-y-1 pl-4">
              <li>
                Open <code>chrome://flags/#prompt-api</code> and set to <strong>Enabled Multilingual</strong> (or <strong>Enabled</strong>), then relaunch Chrome.
              </li>
              <li>
                On older Chrome builds, also enable <code>#optimization-guide-on-device-model</code> (<strong>Enabled BypassPerfRequirement</strong>) and <code>#prompt-api-for-gemini-nano</code>.
              </li>
              <li>
                If the header shows <strong>Nano: Downloadable</strong>, stay online, pick <strong>Mode: ONLY_ON_DEVICE</strong>, and submit one report to trigger the local model download (monitor progress at <code>chrome://on-device-internals</code>).
              </li>
            </ol>
          </div>
        </div>

        <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-tactile min-h-[48px] cursor-pointer rounded-lg bg-[#1E40AF] px-5 text-sm font-semibold text-white hover:bg-[#1E3A8A]"
          >
            Return to Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
