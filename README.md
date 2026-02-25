# Menu Magic 🪄

Menu Magic ist eine smarte Web-App, die schlecht gescannte PDF-Speisekarten in hochwertige, responsive HTML-Ansichten und druckfertige PDFs verwandelt.

## 🚀 Features

*   **📄 PDF-Upload & Analyse:** Einfaches Drag-and-Drop von PDF-Speisekarten. Die Analyse startet sofort automatisch.
*   **🛠️ Bildoptimierung:** Integrierte Werkzeuge zur Verbesserung der Scanqualität (Deskew, Graustufen, Rotation, Kontrast/Helligkeit).
*   **👁️ Live-Vorschau:** Eine interaktive, scrollbare Vorschau zeigt die optimierten Seiten in Echtzeit.
*   **🧠 KI-Textextraktion:** Nutzt Google Gemini (Image Understanding), um strukturierte Daten (Kategorien, Gerichte, Preise) aus den Bildern zu extrahieren.
*   **✨ Auto-Cleanup:** Intelligente Bereinigung von doppelten Satzzeichen und Formatierungsfehlern.
*   **🌐 HTML-Export:** Generiert eine moderne, responsive HTML-Speisekarte (gestylt mit Tailwind CSS).
*   **🖨️ PDF-Export:** Erstellt ein neu gestaltetes, druckfertiges PDF-Dokument.

## 🛠️ Tech Stack

*   **Frontend:** Next.js 15 (App Router), React, Tailwind CSS, Framer Motion
*   **PDF-Verarbeitung:** pdfjs-dist, jsPDF
*   **KI-Integration:** @google/genai (Gemini 3.1 Pro)
*   **Icons:** Lucide React

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
    Erstelle eine `.env.local` Datei im Hauptverzeichnis und füge deinen Gemini API-Schlüssel hinzu:
    ```env
    NEXT_PUBLIC_GEMINI_API_KEY=dein_api_schluessel_hier
    ```

4.  **Entwicklungsserver starten:**
    ```bash
    npm run dev
    ```
    Die App ist nun unter `http://localhost:3000` erreichbar.

## 🚀 Deployment

Die App ist für das Deployment auf Plattformen wie Vercel optimiert. Stelle sicher, dass die Umgebungsvariable `NEXT_PUBLIC_GEMINI_API_KEY` in den Deployment-Einstellungen konfiguriert ist.
