# Test Outline: ConfirmModal Flow

## 1. Upload & Analysis
- **Action:** User drags and drops a PDF file into the upload zone.
- **Expected:** 
  - Upload UI transitions to a loading state ("Analysiere PDF...").
  - A POST request is made to `/api/upload` with the file.
  - Upon success, the `ConfirmModal` opens automatically.

## 2. Modal Display & Validation Warnings
- **Action:** Modal opens with analysis results.
- **Expected:**
  - The modal title is "Einstellungen bestätigen".
  - Three dropdowns (KI-Modell, Detailstufe, Stil) are visible and populated with current state.
  - A thumbnail strip is visible if the API returned thumbnails.
  - If the API returned a non-blocking warning (e.g., "LOW_DPI"):
    - An amber warning badge appears on the corresponding thumbnail.
    - An inline warning message is displayed in the modal body.
    - The primary button says "Speichern & Weiter".
  - If the API returned a blocking error (e.g., "FILE_CORRUPTED"):
    - A red error badge appears on the corresponding thumbnail.
    - An inline error message is displayed.
    - The primary button changes to "Trotzdem bestätigen" and is styled destructively (red).

## 3. Inline Editing
- **Action:** User changes the value of "KI-Modell" or "Detailstufe" via the dropdowns.
- **Expected:**
  - The dropdown value updates immediately.
  - The internal modal state reflects the new configuration.

## 4. Preset Management
- **Action:** User checks "Als Preset speichern" and selects "Gerät (Lokal speichern)".
- **Expected:**
  - The preset scope dropdown appears when the checkbox is checked.
  - Upon confirmation, the preset is saved to `localStorage` under the key `menuMagic.presets`.
  - On subsequent page loads, the UI displays "Preset geladen: [Name]" and auto-applies the saved configuration.

## 5. Confirmation & Gating
- **Action:** User clicks "Speichern & Weiter" (or "Trotzdem bestätigen").
- **Expected:**
  - The modal closes.
  - The main UI transitions to the "PROCESS" step ("Optimierung startet in 5 Sekunden...").
  - A 5-second countdown begins.

## 6. Cancellation Window
- **Action:** User clicks "Abbrechen" during the 5-second countdown.
- **Expected:**
  - The countdown stops.
  - The UI reverts to the "UPLOAD" step.
  - The `ConfirmModal` re-opens, allowing the user to adjust settings again.

## 7. Optimization Execution
- **Action:** User waits for the 5-second countdown to finish.
- **Expected:**
  - A POST request is made to `/api/optimize` containing the `confirmedConfig`, `userAcceptedWarnings: true`, and `overrideCritical` flag.
  - The UI updates to "Optimiere PDF...".
  - Upon success, the actual optimization logic (e.g., Gemini extraction) begins.
  - If the API returns a 400 error (missing confirmation flag), the UI displays the error and reverts to the upload step.
