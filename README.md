# ResQPulse AI

**Unified Field Medical Triage, Disaster Reporting, Evacuation SOS, and Logistics Dispatch powered by Firebase AI Logic Hybrid Inference**

Built for **Google Firebase #BuildHybridAI 2026**.

---

## Problem Statement

During acute disasters such as volcanic eruptions, flash floods, and landslides, cellular networks frequently drop or operate intermittently. First responders, paramedics, and local coordinators still need structured triage, immediate medical guidance, and strict patient privacy protection even when internet connectivity is completely unavailable.

## How Hybrid AI (`firebase/ai`) Solves It

ResQPulse AI divides AI responsibilities between **On-Device Gemini Nano** and **Cloud Gemini Flash** through the official **Firebase AI Logic Web SDK (`firebase/ai`)**:

1. **`InferenceMode.ONLY_ON_DEVICE` (Local Privacy Guard):**
   - Automatically scrubs sensitive PII (16-digit national IDs, phone numbers, and patient names) locally in the browser before storage or cloud transmission.
2. **`InferenceMode.PREFER_ON_DEVICE` (Offline Field Triage + Cloud Fallback):**
   - Classifies chaotic field notes into `MEDICAL`, `INFRASTRUCTURE`, `EVACUATION_SOS`, or `LOGISTICS`, assigns urgency scores (`1-10`), detects road closures, and generates offline first-aid/action checklists.
   - Executes locally on Gemini Nano with zero network latency when supported, and falls back to Cloud Gemini Flash on standard hardware when online.
3. **`InferenceMode.ONLY_IN_CLOUD` (Command Center Multimodal & SitRep):**
   - Analyzes field camera snapshots (collapsed bridges, flooded triage bays) and synthesizes a multi-sector **Priority Dispatch Plan** and **Route Hazard Warnings** using `gemini-2.5-flash`.
4. **Offline-First Persistence (`firebase/firestore`):**
   - Uses `persistentLocalCache` (`IndexedDB`) and an offline sync queue so field reports captured during signal blackouts sync automatically once connectivity returns.

---

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Local Hybrid Simulator Mode:** Works out of the box even before adding Firebase credentials to `.env.local`.
- **Live Firebase Project Mode:** Fill `NEXT_PUBLIC_FIREBASE_*` keys in `.env.local` from your Firebase Console (with Firebase AI Logic & Cloud Firestore enabled) and restart the dev server.

### Verification

```bash
npm run verify
npx tsc --noEmit
npm run build
```

---

## 3-Minute Demo Flow

1. **Offline Blackout Intake (`ON_DEVICE`):** Toggle **Signal: OFFLINE (Blackout)** in the top bar, click the **Medical + PII** preset, and submit. Observe PII redaction (`[NIK_REDACTED]`, `[PHONE_REDACTED]`, `[NAME_REDACTED]`), `ON_DEVICE` inference badge, and `QUEUED_OFFLINE` status.
2. **Multi-Sector Offline Queue:** Submit **Bridge Collapse** and **Rooftop SOS** presets while offline; watch markers appear immediately on the local Tactical Map.
3. **Reconnect & Cloud Escalation (`IN_CLOUD`):** Switch back to **Signal: ONLINE**, click **Sync Queued Reports Now**, trigger **Analyze Photo (Cloud Flash)** on the bridge report, and run **Generate Multi-Sector Operation Plan** to route ambulances around blocked crossings.
