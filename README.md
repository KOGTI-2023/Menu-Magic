# Menu Magic 🪄

Menu Magic ist eine smarte Web-App, die schlecht gescannte PDF-Speisekarten in hochwertige, responsive HTML-Ansichten und druckfertige PDFs verwandelt.

## 🚀 Features

- **📄 PDF-Upload & Analyse:** Einfaches Drag-and-Drop von PDF-Speisekarten. Die Analyse startet sofort automatisch.
- **🛠️ Bildoptimierung:** Integrierte Werkzeuge zur Verbesserung der Scanqualität (Deskew, Graustufen, Rotation, Kontrast/Helligkeit).
- **🧠 KI-Restauration (Gemini 3.1 Pro Preview):** Nutzt "Original-First" Logik. Die KI entscheidet zwischen einer direkten Reparatur (Repair) oder einer digitalen Neukonstruktion (Recreate), um maximale Qualität zu garantieren.
- **🎨 KI-Design-Assistent (Gemini 3 Flash Preview):** Ein interaktiver Begleiter, der auf Text- und Sprachbefehle (Voice-to-Text) reagiert, um das Design anzupassen oder Inhalte zu ändern.
- **🖌️ Direkt-Editor:** Bearbeite Texte, Preise und Kategorien direkt in der Vorschau. Verschiebe Elemente per Klick für das perfekte Layout.
- **⭐ Prioritäten-System:** Markiere Menüpunkte mit Prioritäten (Hoch, Mittel, Niedrig), um sie visuell hervorzuheben.
- **📱 Responsives Design:** Kompakte und für alle Bildschirmgrößen optimierte Benutzeroberfläche, die ohne unnötiges Scrollen auskommt.
- **🌈 Farbpaletten-Generator:** Automatische Generierung von 3 passenden Farbpaletten basierend auf dem Stil des Restaurants.
- **👁️ Vorher/Nachher-Vergleich:** Ein interaktiver Slider ermöglicht den direkten Vergleich zwischen dem Original-Scan und dem optimierten Ergebnis.
- **🌐 Multi-Export:** Generiert moderne, responsive HTML-Speisekarten und druckfertige PDF-Dokumente.

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS, motion (Framer Motion)
- **Backend:** Next.js API Routes (`/api/analyze`, `/api/assistant`)
- **PDF-Verarbeitung:** pdfjs-dist, html2pdf.js
- **KI-Integration:** @google/genai (Gemini 3.1 Pro Preview für Extraktion, Gemini 3 Flash Preview für Assistenz)
- **Observability:** Strukturiertes Logging mit anpassbaren Logleveln (`lib/logger.ts`).

## ⚙️ Setup & Installation

1.  **Repository klonen:**

    ```bash
    git clone <repository-url>
    cd menu-magic
    ```

2.  **Abhängigkeiten installieren:**

    ```bash
    npm install
    ```

3.  **Umgebungsvariablen konfigurieren:**
    Erstelle eine `.env.local` Datei im Hauptverzeichnis:

    ```env
    GEMINI_API_KEY=dein_api_schluessel_hier
    NEXT_PUBLIC_LOG_LEVEL=debug # Optional: debug, info, warn, error, none
    ```

4.  **Entwicklungsserver starten:**
    ```bash
    npm run dev
    ```

## 🔍 Troubleshooting & Fehlercodes

Sollte ein Fehler auftreten, achte auf die folgenden Codes in der Konsole oder der UI:

- **API_ERROR:** Problem bei der Kommunikation mit Google Gemini. Prüfe deinen API-Key.
- **TIMEOUT:** Die KI-Analyse hat zu lange gedauert. Versuche es mit weniger Seiten oder geringerer Detailtiefe.
- **FRONTEND_CRASH:** Ein unerwarteter Fehler im Browser. Die App bietet einen automatischen Recovery-Modus.
- **RATE_LIMIT:** Zu viele Anfragen in kurzer Zeit. Die App implementiert einen automatischen "Exponential Backoff" (Wiederholungsversuche).

## 🚀 Deployment

Die App ist für das Deployment auf Plattformen wie Vercel optimiert. Stelle sicher, dass die Umgebungsvariable `GEMINI_API_KEY` in den Deployment-Einstellungen konfiguriert ist. Setze in der Produktion `NEXT_PUBLIC_LOG_LEVEL=warn`, um Ressourcen zu schonen.
