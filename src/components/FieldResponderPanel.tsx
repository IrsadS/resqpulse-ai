'use client';

import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Lock,
  Mic,
  MicOff,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { InferenceSourceBadge } from '@/components/InferenceSourceBadge';
import { analyzeFieldReportHybrid } from '@/lib/hybrid-ai-engine';
import { redactSensitivePii } from '@/lib/pii-scrubber';
import {
  generateSimulatedFieldPhoto,
  MERAPI_SECTORS,
  RESPONDER_PRESETS,
  type ResponderPresetScenario,
} from '@/lib/preset-scenarios';
import type { IncidentReport, InferenceModeSetting } from '@/types/incident';

interface FieldResponderPanelProps {
  isOnline: boolean;
  inferenceMode: InferenceModeSetting;
  onReportCreated: (report: IncidentReport) => void;
}

type SimulatedScene = ResponderPresetScenario['simulatedPhotoScene'];

export function FieldResponderPanel({
  isOnline,
  inferenceMode,
  onReportCreated,
}: FieldResponderPanelProps) {
  const [selectedSector, setSelectedSector] = useState(MERAPI_SECTORS[1].name);
  const [rawText, setRawText] = useState(RESPONDER_PRESETS[0].rawText);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [activeScene, setActiveScene] = useState<SimulatedScene>('FLOODED_WARD');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasTouchedText, setHasTouchedText] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const [latestReport, setLatestReport] = useState<IncidentReport | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const sectorCoords = useMemo(() => {
    return (
      MERAPI_SECTORS.find((sector) => sector.name === selectedSector) ||
      MERAPI_SECTORS[0]
    );
  }, [selectedSector]);

  const livePiiPreview = useMemo(() => redactSensitivePii(rawText), [rawText]);

  function applyPreset(preset: ResponderPresetScenario) {
    setSelectedSector(preset.sectorName);
    setRawText(preset.rawText);
    setActiveScene(preset.simulatedPhotoScene);
    setFieldError(null);
    setSubmitError(null);
    setPhotoDataUrl(generateSimulatedFieldPhoto(preset.simulatedPhotoScene));
  }

  function handleBlurText() {
    setHasTouchedText(true);
    if (rawText.trim().length < 12) {
      setFieldError(
        'Enter at least 12 characters describing injuries, hazards, or supply needs.'
      );
    }
  }

  function handleChangeText(value: string) {
    setRawText(value);
    if (fieldError && value.trim().length >= 12) {
      setFieldError(null);
    }
    if (submitError) {
      setSubmitError(null);
    }
  }

  function handleVoiceDictation() {
    setVoiceMessage(null);
    const SpeechApi =
      typeof window !== 'undefined'
        ? ((window as unknown as Record<string, unknown>).SpeechRecognition ||
            (window as unknown as Record<string, unknown>).webkitSpeechRecognition)
        : null;

    if (!SpeechApi) {
      setVoiceMessage(
        'Web Speech API unavailable in this browser. Type or select a preset scenario.'
      );
      return;
    }

    type SpeechRecognitionLike = {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
    };

    const recognition = new (SpeechApi as new () => SpeechRecognitionLike)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      if (transcript) {
        setRawText((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript));
        setFieldError(null);
      }
    };
    recognition.onerror = () => {
      setVoiceMessage('Microphone permission denied or speech capture failed.');
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceMessage('Could not start microphone dictation.');
    }
  }

  function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (rawText.trim().length < 12) {
      setHasTouchedText(true);
      setFieldError(
        'Enter at least 12 characters describing injuries, hazards, or supply needs.'
      );
      textareaRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const report = await analyzeFieldReportHybrid({
        rawText,
        sectorName: sectorCoords.name,
        latitude: sectorCoords.latitude,
        longitude: sectorCoords.longitude,
        inferenceMode,
        isOnline,
        photoDataUrl,
      });
      setLatestReport(report);
      onReportCreated(report);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Triage inference failed. Switch to PREFER_ON_DEVICE and retry.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="field-form-heading"
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-900 px-4 py-3 text-white">
        <div>
          <h2 id="field-form-heading" className="text-base font-bold">
            Field Responder Intake
          </h2>
          <p className="text-xs text-slate-300">
            Zero-signal medical &amp; disaster intake with local PII redaction
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded px-2.5 py-1 font-mono text-xs font-bold ${
            isOnline ? 'bg-emerald-900 text-emerald-200' : 'bg-red-900 text-red-200'
          }`}
        >
          {isOnline ? 'Online sync' : 'Offline queue'}
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-700">
            One-click crisis presets
          </p>
          <div className="grid grid-cols-2 gap-2">
            {RESPONDER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className="btn-tactile min-h-[44px] cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:border-[#1E40AF] hover:bg-[#EFF6FF]"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="sector-select"
              className="mb-1.5 block text-sm font-semibold text-slate-800"
            >
              Sector Location
            </label>
            <select
              id="sector-select"
              name="sectorName"
              value={selectedSector}
              onChange={(event) => setSelectedSector(event.target.value)}
              className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900"
            >
              {MERAPI_SECTORS.map((sector) => (
                <option key={sector.name} value={sector.name}>
                  {sector.name} ({sector.latitude.toFixed(4)}, {sector.longitude.toFixed(4)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label
                htmlFor="field-raw-note"
                className="text-sm font-semibold text-slate-800"
              >
                Raw Field Report <span aria-hidden="true" className="text-[#B91C1C]">*</span>
              </label>
              <button
                type="button"
                onClick={handleVoiceDictation}
                className={`btn-tactile inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold ${
                  isListening
                    ? 'border-red-300 bg-red-50 text-[#B91C1C]'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isListening ? (
                  <MicOff className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{isListening ? 'Listening...' : 'Voice Dictate'}</span>
              </button>
            </div>

            <textarea
              ref={textareaRef}
              id="field-raw-note"
              name="rawText"
              rows={4}
              required
              minLength={12}
              value={rawText}
              onBlur={handleBlurText}
              onChange={(event) => handleChangeText(event.target.value)}
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? 'field-note-error' : 'field-note-help'}
              placeholder="Example: 3 casualties at Kaliurang, patient: Budi NIK 337401..., bridge blocked"
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900 placeholder:text-slate-500"
            />

            {fieldError && hasTouchedText ? (
              <p
                id="field-note-error"
                role="alert"
                className="mt-1 text-xs font-semibold text-[#B91C1C]"
              >
                {fieldError}
              </p>
            ) : (
              <p id="field-note-help" className="mt-1 text-xs text-slate-600">
                Include casualties, blocked roads, trapped citizens, or supply shortages.
              </p>
            )}

            {voiceMessage && (
              <p role="status" className="mt-1 text-xs font-medium text-[#B45309]">
                {voiceMessage}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-emerald-200 bg-[#F0FDF4] p-3">
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#15803D]">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                On-Device Privacy Guard (ONLY_ON_DEVICE)
              </span>
              <span className="font-mono tabular-nums">
                {livePiiPreview.piiRedactedCount} PII scrubbed
              </span>
            </div>
            <p className="mt-1.5 font-mono text-xs leading-relaxed text-[#14532D]">
              {livePiiPreview.redactedText || 'Waiting for field text...'}
            </p>
          </div>

          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800">
                Field Photo (Escalated to Cloud when online)
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoDataUrl(generateSimulatedFieldPhoto(activeScene))}
                  className="btn-tactile inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                >
                  <Camera className="h-3.5 w-3.5 text-[#1E40AF]" aria-hidden="true" />
                  Capture Snapshot
                </button>
                <label
                  htmlFor="field-photo-upload"
                  className="btn-tactile inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                >
                  Upload Image
                </label>
                <input
                  id="field-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </div>
            </div>

            {photoDataUrl && (
              <div className="relative overflow-hidden rounded-md border border-slate-300 bg-slate-900">
                <img
                  src={photoDataUrl}
                  alt="Field damage or triage scene attachment"
                  width={640}
                  height={360}
                  className="h-32 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoDataUrl(null)}
                  aria-label="Remove attached photo"
                  className="btn-tactile absolute right-2 top-2 inline-flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-md bg-slate-900/85 text-white hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-xs font-semibold text-[#B91C1C]"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-tactile inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1E40AF] px-4 text-sm font-bold text-white hover:bg-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>
              {isSubmitting
                ? 'Running Hybrid AI Triage...'
                : 'Classify & Queue Field Report'}
            </span>
          </button>
        </form>

        {latestReport && (
          <div
            aria-live="polite"
            className="surface-enter rounded-lg border border-slate-300 bg-slate-50 p-3.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#1E40AF]" aria-hidden="true" />
                <span className="text-xs font-bold text-slate-900">
                  Latest Triage Output ({latestReport.id})
                </span>
              </div>
              <InferenceSourceBadge
                source={latestReport.inferenceSource}
                latencyMs={latestReport.latencyMs}
              />
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2 font-mono text-xs">
              <span className="rounded bg-slate-900 px-2 py-0.5 font-bold text-white">
                {latestReport.category}
              </span>
              <span className="rounded bg-red-100 px-2 py-0.5 font-bold text-[#B91C1C]">
                {latestReport.severity} ({latestReport.urgencyScore}/10)
              </span>
              <span className="rounded bg-amber-100 px-2 py-0.5 font-bold text-[#B45309]">
                {latestReport.syncStatus}
              </span>
            </div>

            <p className="mt-2 text-xs font-medium text-slate-800">
              {latestReport.structuredSummary}
            </p>

            {latestReport.inferenceSource === 'SIMULATED' && (
              <p className="mt-1.5 text-xs text-[#B45309]">
                Executed via local deterministic fallback (configure Firebase keys or Chrome Gemini Nano flags for live model telemetry).
              </p>
            )}

            {latestReport.immediateActionChecklist.length > 0 && (
              <div className="mt-2.5 border-t border-slate-200 pt-2">
                <p className="text-xs font-bold text-slate-700">
                  Offline Responder Checklist
                </p>
                <ul className="mt-1 space-y-1">
                  {latestReport.immediateActionChecklist.map((step) => (
                    <li
                      key={step}
                      className="flex items-start gap-1.5 text-xs text-slate-700"
                    >
                      <CheckCircle2
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#15803D]"
                        aria-hidden="true"
                      />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
