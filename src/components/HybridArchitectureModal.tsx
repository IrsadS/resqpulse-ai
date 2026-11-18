'use client';

import { useEffect, useRef } from 'react';
import { Cloud, Cpu, Lock, X } from 'lucide-react';

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
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2
              id="hybrid-modal-title"
              className="text-xl font-bold text-slate-900"
            >
              Firebase AI Logic Hybrid Inference Architecture
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              How ResQPulse AI combines Gemini Nano (On-Device) and Gemini Flash (Cloud) using firebase/ai.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm text-slate-800">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 font-bold text-[#15803D]">
              <Lock className="h-4 w-4" aria-hidden="true" />
              <span>1. ONLY_ON_DEVICE (Strict Privacy &amp; Zero-Signal Guard)</span>
            </div>
            <p className="mt-1 text-slate-700">
              Scrubs Indonesian NIK, phone numbers, and patient names locally before persistence or cloud escalation. Zero personal data leaves the device.
            </p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 font-bold text-[#1D4ED8]">
              <Cpu className="h-4 w-4" aria-hidden="true" />
              <span>2. PREFER_ON_DEVICE (Instant Field Triage + Seamless Cloud Fallback)</span>
            </div>
            <p className="mt-1 text-slate-700">
              Runs structured triage classification (MEDICAL, INFRASTRUCTURE, EVACUATION_SOS, LOGISTICS) locally on Gemini Nano when supported, and falls back to Cloud Gemini Flash on unsupported hardware when online.
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 font-bold text-[#B45309]">
              <Cloud className="h-4 w-4" aria-hidden="true" />
              <span>3. ONLY_IN_CLOUD (Multimodal Image Analysis &amp; Multi-Sector SitRep)</span>
            </div>
            <p className="mt-1 text-slate-700">
              Command Center coordinators escalate redacted reports and disaster field photos to Gemini Flash to evaluate structural bridge collapse and coordinate multi-sector convoy routing.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-900 p-4 text-xs text-slate-100">
            <p className="mb-2 font-semibold text-slate-300">
              Judge 3-Step Demo Checklist:
            </p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>
                Click <strong>Signal: OFFLINE (Blackout)</strong> in the header, select the{' '}
                <strong>Medical + PII</strong> preset, and submit. Observe PII redaction,{' '}
                <code>ON_DEVICE</code> badge, and <code>QUEUED_OFFLINE</code> status.
              </li>
              <li>
                Switch signal back to <strong>ONLINE</strong> and click{' '}
                <strong>Sync Queued Reports Now</strong> to flush offline Firestore queue.
              </li>
              <li>
                Select a report with a photo and click{' '}
                <strong>Analyze Photo (Cloud Flash)</strong>, then click{' '}
                <strong>Generate Multi-Sector Operation Plan</strong> to see unified dispatch routing.
              </li>
            </ol>
          </div>
        </div>

        <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] cursor-pointer rounded-lg bg-[#1E40AF] px-5 text-sm font-semibold text-white hover:bg-blue-900"
          >
            Return to Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
