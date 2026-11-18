# ResQPulse AI

**Unified Field Medical Triage, Disaster Reporting, Evacuation SOS, and Logistics Dispatch powered by Firebase AI Logic Hybrid Inference**

Built for **Google Firebase #BuildHybridAI 2026**.

---

## Problem Statement

During acute disasters such as volcanic eruptions, flash floods, and landslides, cellular networks frequently drop or operate intermittently. First responders, paramedics, and local coordinators still need structured triage, immediate medical guidance, and strict patient privacy protection even when internet connectivity is completely unavailable.

## Honest Hybrid Telemetry (`ON_DEVICE` vs `IN_CLOUD` vs `SIMULATED`)

ResQPulse AI divides responsibilities across three transparent execution paths through the official **Firebase AI Logic Web SDK (`firebase/ai`)**:

1. **`ON_DEVICE` (`InferenceMode.ONLY_ON_DEVICE` / `PREFER_ON_DEVICE`):**
   - Locally scrubs sensitive victim PII (16-digit National ID / NIK, phone numbers, and patient names) before persistence or cloud transmission.
   - Runs structured field triage locally via Chrome Built-in AI (**Gemini Nano**) when browser flags are enabled, returning `result.response.inferenceSource === 'on_device'`.
2. **`IN_CLOUD` (`InferenceMode.PREFER_ON_DEVICE` fallback / `ONLY_IN_CLOUD`):**
   - Automatically falls back to cloud Gemini models (`gemini-3.5-flash-lite` by default, configurable via `NEXT_PUBLIC_FIREBASE_CLOUD_MODEL`) on unsupported hardware when online.
   - Escalates redacted disaster photos and multi-sector field feeds for structural damage assessment and dispatch planning.
3. **`SIMULATED` (Transparent Local Fallback):**
   - When `.env.local` has no live Firebase credentials or an offline browser lacks Chrome Gemini Nano flags, ResQPulse AI executes its deterministic local classifier and explicitly badges the output **`SIMULATED`** with real elapsed latency rather than masking simulated output as live Gemini inference.

> **Demo Dataset Note:** Pre-loaded Mount Merapi crisis exercise reports (`INC-2026-101` to `INC-2026-103`) are synthetic demonstration data. Use the **Reset Demo Data** button in the top notice bar anytime to restore the initial exercise state.

---

## Local Setup & Live Firebase Activation

### 1. Run Locally (Zero-Config Simulator Mode)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 2. Connect Your Firebase Project (Live Hybrid AI + Firestore)

1. Create a project in [Firebase Console](https://console.firebase.google.com/) and register a **Web App**.
2. Enable **Firebase AI Logic** (Gemini Developer API backend), **Authentication -> Sign-in method -> Anonymous**, and **Cloud Firestore**.
3. Copy your Web App keys into `.env.local`.
4. To test real **On-Device Gemini Nano** inference in Chrome Desktop:
   - Open `chrome://flags/#optimization-guide-on-device-model` and set it to **Enabled BypassPerfRequirement**.
   - Open `chrome://flags/#prompt-api-for-gemini-nano` and set it to **Enabled**.
   - Relaunch Chrome.

### 3. Build & Deploy to Firebase Hosting

```bash
npx tsc --noEmit
npm run verify
npm run build
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only hosting,firestore:rules
```

---

## 3-Minute Demo Flow

1. **Offline Blackout Intake:** Toggle **Signal: Offline (Blackout)** in the top bar, pick the **Medical + PII** preset, and submit. Verify local PII scrubbing (`[NIK_REDACTED]`, `[PHONE_REDACTED]`, `[NAME_REDACTED]`) and `QUEUED_OFFLINE` persistence.
2. **Multi-Sector Offline Queue:** Submit **Bridge Collapse** and **Rooftop SOS** presets while offline; markers appear immediately on the Leaflet Tactical Map.
3. **Reconnect & Cloud Escalation:** Switch back to **Signal: Online (4G/Sat)**, click **Sync Queued Reports Now**, trigger **Analyze Photo** on a bridge report, and run **Generate Multi-Sector Operation Plan** to route ambulances around blocked crossings.
