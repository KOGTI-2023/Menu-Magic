# Menu Magic 🪄

Menu Magic ist eine smarte Web-App, die schlecht gescannte PDF-Speisekarten in hochwertige, responsive HTML-Ansichten und druckfertige PDFs verwandelt.

## 🚀 Features

- **📄 PDF-Upload & Analyse:** Einfaches Drag-and-Drop von PDF-Speisekarten. Die Analyse startet sofort automatisch.
- **✅ Bestätigungs-Modal (Confirm Flow):** Nach der Analyse öffnet sich ein Modal, das Warnungen (z.B. niedrige DPI) anzeigt und die Bestätigung der Einstellungen (Modell, Detailstufe, Stil) erfordert.
- **💾 Preset-Verwaltung:** Speichere bevorzugte Einstellungen als Presets (Session, Gerät oder Account) für zukünftige Uploads.
- **🛠️ Bildoptimierung:** Integrierte Werkzeuge zur Verbesserung der Scanqualität (Deskew, Graustufen, Rotation, Kontrast/Helligkeit).
- **🧠 KI-Restauration (Gemini 3.1 Pro Preview):** Nutzt "Original-First" Logik. Die KI entscheidet zwischen einer direkten Reparatur (Repair) oder einer digitalen Neukonstruktion (Recreate), um maximale Qualität zu garantieren.
- **🎨 KI-Design-Assistent (Gemini 3 Flash Preview):** Ein interaktiver Begleiter, der auf Text- und Sprachbefehle (Voice-to-Text) reagiert, um das Design anzupassen oder Inhalte zu ändern.
- **🖌️ Direkt-Editor:** Bearbeite Texte, Preise und Kategorien direkt in der Vorschau. Verschiebe Elemente per Klick für das perfekte Layout.
- **⭐ Prioritäten-System:** Markiere Menüpunkte mit Prioritäten (Hoch, Mittel, Niedrig), um sie visuell hervorzuheben.
- **📱 Responsives Design:** Kompakte und für alle Bildschirmgrößen optimierte Benutzeroberfläche, die ohne unnötiges Scrollen auskommt.
- **🌈 Farbpaletten-Generator:** Automatische Generierung von 3 passenden Farbpaletten basierend auf dem Stil des Restaurants.
- **🛡️ Ganzheitliches Fehlermanagement:** Zentralisierte Fehlerbehandlung mit `AppErrorFactory`, strukturierten API-Antworten und einer globalen React Error Boundary für maximale Stabilität.
- **👁️ Vorher/Nachher-Vergleich:** Ein interaktiver Slider ermöglicht den direkten Vergleich zwischen dem Original-Scan und dem optimierten Ergebnis.
- **🌐 Multi-Export:** Generiert moderne, responsive HTML-Speisekarten und druckfertige PDF-Dokumente.

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS, motion (Framer Motion)
- **Backend:** Next.js API Routes (`/api/analyze`, `/api/assistant`)
- **PDF-Verarbeitung:** pdfjs-dist, html2pdf.js
- **KI-Integration:** @google/genai (Gemini 3.1 Pro Preview für Extraktion, Gemini 3 Flash Preview für Assistenz)
- **Observability:** Strukturiertes Logging mit anpassbaren Logleveln (`lib/logger.ts`).

## 📋 Voraussetzungen

Bevor du mit dem Setup beginnst, stelle sicher, dass folgende Tools auf deinem System installiert sind:

- **Git:** Zum Klonen des Repositories.
- **Python 3.x:** Für die virtuelle Umgebung (`venv`).
- **Node.js (v18+) & npm:** Für die Ausführung der Next.js App.

## ⚙️ Setup & Installation

1.  **Repository klonen:**

    ```bash
    git clone https://github.com/KOGTI-2023/Menu-Magic.git
    cd Menu-Magic
    ```

2.  **Virtuelle Umgebung einrichten:**

    Um eine saubere Installation zu gewährleisten, nutzen wir eine virtuelle Umgebung:

    ```bash
    # Virtuelle Umgebung erstellen
    python -m venv venv

    # Aktivieren (Windows)
    # venv\Scripts\activate

    # Aktivieren (macOS/Linux)
    source venv/bin/activate

    # Anforderungen installieren
    pip install -r requirements.txt
    ```

3.  **Abhängigkeiten installieren:**

    ```bash
    npm install
    ```

4.  **Umgebungsvariablen konfigurieren:**

    Kopiere die Beispiel-Datei und trage deinen Gemini API-Key ein:

    ```bash
    cp .env.example .env.local
    ```

    Öffne danach die `.env.local` und ergänze deine Keys:
    ```env
    NEXT_PUBLIC_GEMINI_API_KEY=dein_api_schluessel_hier
    ```

5.  **Entwicklungsserver starten:**
    ```bash
    npm run dev
    ```

## 🔄 Workflow & Persistenz

1. **Upload:** Der Nutzer lädt ein PDF hoch.
2. **Analyse (`/api/upload`):** Das Backend prüft das PDF auf Probleme (DPI, Passwortschutz, Beschädigungen) und gibt strukturierte Warnungen zurück.
3. **Bestätigung (`ConfirmModal`):** Der Nutzer sieht die Warnungen, passt ggf. Modell/Stil an und kann die Konfiguration als Preset speichern. Blockierende Fehler erfordern einen Klick auf "Trotzdem bestätigen".
4. **Optimierung (`/api/optimize`):** Nach der Bestätigung startet die eigentliche KI-Verarbeitung. Der Nutzer hat ein 5-Sekunden-Fenster, um den Vorgang abzubrechen.
5. **Persistenz:** Presets werden standardmäßig lokal im Browser (`localStorage` unter `menuMagic.presets`) gespeichert. Bei authentifizierten Nutzern können diese über `/api/presets` in der Cloud gesichert werden.

## 🔍 Troubleshooting & Fehlercodes

Die App nutzt ein zentralisiertes, robustes Fehlersystem (`lib/error-handler.ts`). Sollte ein Fehler auftreten, wird dieser mit einem spezifischen Code und einer hilfreichen Nachricht angezeigt. Alle API-Routen verwenden strukturierte JSON-Antworten über `createErrorResponse`.

- **API_ERROR / GEMINI_ERROR:** Problem bei der Kommunikation mit der KI. Prüfe deinen API-Key und das Kontingent.
- **TIMEOUT:** Die Verarbeitung hat das Zeitlimit überschritten. Für die KI-Analyse (`/api/analyze`) ist ein großzügiges Timeout von 5 Minuten konfiguriert, um auch komplexe PDFs verarbeiten zu können. Sollte dieses Limit dennoch überschritten werden, kann der Nutzer den Vorgang einfach neu starten.
- **UNAUTHORIZED:** Der Zugriff wurde verweigert (z.B. fehlender API-Key oder abgelaufene Sitzung).
- **VALIDATION_ERROR:** Die bereitgestellten Daten (z.B. PDF-Format) sind ungültig.
- **FRONTEND_CRASH:** Ein kritischer Fehler im Browser. Die globale `ErrorBoundary` fängt diesen ab, schützt die Nutzerdaten und bietet einen Recovery-Button.
- **RATE_LIMIT:** Zu viele Anfragen. Die App nutzt automatischen "Exponential Backoff" für Wiederholungsversuche.
- **INVALID_CONTENT_TYPE:** Die API-Route hat unerwartete Daten erhalten (z.B. HTML statt JSON). Dies wird nun sicher abgefangen.

## 🚀 Deployment

Die App ist für das Deployment auf Plattformen wie Vercel optimiert. Stelle sicher, dass die Umgebungsvariable `GEMINI_API_KEY` in den Deployment-Einstellungen konfiguriert ist. Setze in der Produktion `NEXT_PUBLIC_LOG_LEVEL=warn`, um Ressourcen zu schonen.
