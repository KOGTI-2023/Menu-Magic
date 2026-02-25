import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

export interface MenuPrice {
  label?: string;
  value: string;
}

export interface MenuItem {
  number?: string;
  name: string;
  description?: string;
  prices: MenuPrice[];
  additives?: string[];
  allergens?: string[];
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
}

export interface MenuFooter {
  additives?: string;
  allergens?: string;
}

export interface MenuData {
  restaurantName?: string;
  subtitle?: string;
  categories: MenuCategory[];
  footer?: MenuFooter;
}

export async function extractMenuData(
  base64Images: string[],
  modelName: string,
  apiKey: string,
  detailLevel: string = "standard"
): Promise<MenuData> {
  const ai = new GoogleGenAI({ apiKey });
  
  const parts = base64Images.map(base64 => ({
    inlineData: {
      data: base64,
      mimeType: "image/jpeg",
    }
  }));

  let detailInstruction = "";
  if (detailLevel === "high") {
    detailInstruction = "Achte auf eine professionelle, hochklassige und ansprechende Präsentation. Formuliere die Beschreibungen leicht um, sodass sie appetitanregender und hochwertiger klingen, ohne die Fakten zu verfälschen.";
  } else if (detailLevel === "premium") {
    detailInstruction = "Optimiere die Beschreibungen für ein absolutes Premium-Erlebnis. Verwende eine elegante, hochprofessionelle, photorealistisch anmutende und detailreiche Sprache. Ergänze passende, subtile kulinarische Adjektive, falls die Originalbeschreibung zu simpel ist.";
  } else {
    detailInstruction = "Übernehme die Beschreibungen möglichst originalgetreu, achte aber auf korrekte Rechtschreibung und Grammatik.";
  }

  const prompt = {
    text: `Du bist ein professioneller KI-Assistent für die Datenextraktion. Analysiere diese Bilder einer Restaurant-Speisekarte.
    Deine Aufgabe ist es, strukturierte Daten zu extrahieren: Restaurantname, Untertitel/Infos, Kategorien, Gerichte/Getränke und Fußnoten.
    
    Regeln für die Extraktion:
    1. Erfasse für jeden Artikel: Nummer (falls vorhanden, z.B. "1.", "89."), Name, Beschreibung.
    2. Erfasse ALLE Preise eines Artikels. Wenn es mehrere gibt (z.B. "kleine Portion", "0,3 l", "1 Stück"), trage das Label und den Wert ("5,80 €") in das 'prices' Array ein. Gibt es nur einen Preis, lass das Label leer.
    3. Achte auf hochgestellte oder eingeklammerte Zeichen hinter den Namen (z.B. "(15,16,a,c,d,f)"). Trenne diese in 'additives' (Zahlen, z.B. "15", "16") und 'allergens' (Buchstaben, z.B. "a", "c").
    4. Erfasse am Ende der Speisekarte die Legende für Zusatzstoffe und Allergene im 'footer'.
    5. Korrigiere OCR-Fehler (z.B. entferne überflüssige Sonderzeichen). Formatiere Preise einheitlich.
    6. ${detailInstruction}
    7. WICHTIG: Die Speisekarte ist für ein familienfreundliches Restaurant (z.B. mit thailändischer und gutbürgerlicher Küche). Vermeide jegliche futuristische, übertrieben moderne oder kühle Sprache. Der Ton soll warm, einladend, professionell und appetitanregend sein.
    8. Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt, das exakt dem geforderten Schema entspricht. Keine Markdown-Formatierung (\`\`\`json) um das JSON herum.
    9. Antworte komplett auf Deutsch.`
  };

  const isPro = modelName.includes('pro');
  
  const config: any = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        restaurantName: { type: Type.STRING, description: "Name des Restaurants" },
        subtitle: { type: Type.STRING, description: "Untertitel, Adresse oder Öffnungszeiten" },
        categories: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "Kategoriename, z. B. Vorspeisen, Hauptgerichte, Getränke" },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    number: { type: Type.STRING, description: "Nummer des Gerichts, z.B. '1.' oder '89'" },
                    name: { type: Type.STRING, description: "Name des Gerichts oder Getränks" },
                    description: { type: Type.STRING, description: "Beschreibung des Gerichts" },
                    prices: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING, description: "Bezeichnung für den Preis, z.B. 'kleine Portion', '0,3 l', '1 Stück'" },
                          value: { type: Type.STRING, description: "Preis, z.B. '5,80 €'" }
                        },
                        required: ["value"]
                      },
                      description: "Liste aller Preise für diesen Artikel"
                    },
                    additives: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Zusatzstoffe (meist Zahlen, z.B. '1', '15')"
                    },
                    allergens: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Allergene (meist Buchstaben, z.B. 'a', 'f')"
                    }
                  },
                  required: ["name", "prices"]
                }
              }
            },
            required: ["category", "items"]
          }
        },
        footer: {
          type: Type.OBJECT,
          properties: {
            additives: { type: Type.STRING, description: "Legende der Zusatzstoffe" },
            allergens: { type: Type.STRING, description: "Legende der Allergene" }
          }
        }
      },
      required: ["categories"]
    }
  };

  if (isPro) {
    config.thinkingConfig = { thinkingLevel: "HIGH" };
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [...parts, prompt] },
      config
    });

    let text = response.text;
    if (!text) {
      throw new Error("Leere Antwort von der API erhalten.");
    }

    // Clean markdown JSON blocks if the model ignored the instruction
    text = text.replace(/^```json\n?/g, '').replace(/```\n?$/g, '').trim();

    try {
      return JSON.parse(text) as MenuData;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw Text:", text);
      throw new Error("Fehler beim Verarbeiten der API-Antwort (ungültiges JSON). Das Modell hat unerwartete Daten zurückgegeben.");
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const msg = error.message || String(error);
    
    if (msg.includes("429") || msg.includes("quota") || msg.includes("rate limit")) {
      throw new Error("Rate-Limit erreicht. Zu viele Anfragen in kurzer Zeit. Bitte warte einen Moment und versuche es erneut.");
    } else if (msg.includes("API key not valid") || msg.includes("403") || msg.includes("permission denied")) {
      throw new Error("Ungültiger API-Schlüssel oder fehlende Berechtigungen. Bitte überprüfe deine Konfiguration.");
    } else if (msg.includes("400") || msg.includes("bad request") || msg.includes("payload too large")) {
      throw new Error("Ungültige Anfrage an die API. Möglicherweise ist das PDF zu groß (zu viele Seiten). Versuche eine Datei mit weniger Seiten.");
    } else {
      throw new Error(`Gemini API Fehler: ${msg}`);
    }
  }
}
