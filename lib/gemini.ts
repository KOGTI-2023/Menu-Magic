import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { withRetry } from "./retry";
import { logger } from "./logger";

export interface MenuPrice {
  label?: string;
  value: string;
}

export interface MenuItem {
  number?: string;
  name: string;
  description?: string;
  prices: MenuPrice[];
  ingredients?: string[];
  additives?: string[];
  allergens?: string[];
  dietary?: string[];
  priority?: 'Hoch' | 'Mittel' | 'Niedrig';
  boundingBox?: { x: number, y: number, width: number, height: number };
  repairMetadata?: {
    wasRepaired: boolean;
    confidence: number;
    originalText?: string;
  };
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
}

export interface MenuFooter {
  additives?: string;
  allergens?: string;
}

export interface MenuStyle {
  fontFamily: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

export interface MenuData {
  restaurantName?: string;
  subtitle?: string;
  categories: MenuCategory[];
  footer?: MenuFooter;
  originalStyle?: MenuStyle;
  suggestedPalettes?: MenuStyle[];
  processingDecision?: 'Repair' | 'Recreate';
}

export async function extractMenuData(
  base64Images: string[],
  modelName: string,
  apiKey: string,
  detailLevel: string = "standard",
  thinkingLevel: "FAST" | "BALANCED" | "MAX" = "BALANCED"
): Promise<{ data: MenuData, usage: any }> {
  const ai = new GoogleGenAI({ apiKey });
  
  const parts = base64Images.map(base64 => ({
    inlineData: {
      data: base64,
      mimeType: "image/jpeg",
    }
  }));

  let detailInstruction = "";
  let reasoningInstruction = "";

  if (thinkingLevel === "FAST") {
    reasoningInstruction = "Führe eine schnelle, oberflächliche Analyse durch. Vermeide tiefgehende strukturelle Rekonstruktion. Optimiere auf Geschwindigkeit und geringen Token-Verbrauch.";
  } else if (thinkingLevel === "MAX") {
    reasoningInstruction = "Führe eine extrem detaillierte, mehrstufige strukturelle Validierung durch. Löse Mehrdeutigkeiten im Layout auf. Führe semantisches Merging über mehrere Seiten hinweg durch. Normalisiere inkonsistente Formatierungen und Interpunktionen. Rekonstruiere logische Menüabschnitte präzise.";
  } else {
    reasoningInstruction = "Führe eine strukturierte, ausgewogene Analyse durch. Achte auf korrekte Zuordnung von Preisen und Beschreibungen.";
  }

  if (detailLevel === "high") {
    detailInstruction = "Achte auf eine professionelle, hochklassige und ansprechende Präsentation. Formuliere die Beschreibungen leicht um, sodass sie appetitanregender und hochwertiger klingen, ohne die Fakten zu verfälschen.";
  } else if (detailLevel === "premium") {
    detailInstruction = "Optimiere die Beschreibungen für ein absolutes Premium-Erlebnis. Verwende eine elegante, hochprofessionelle, photorealistisch anmutende und detailreiche Sprache. Ergänze passende, subtile kulinarische Adjektive, falls die Originalbeschreibung zu simpel ist.";
  } else {
    detailInstruction = "Übernehme die Beschreibungen möglichst originalgetreu, achte aber auf korrekte Rechtschreibung und Grammatik.";
  }

  const prompt = {
    text: `Du bist ein professioneller KI-Assistent für die Datenextraktion und visuelle Restauration. Analysiere diese Bilder einer Restaurant-Speisekarte.
    Deine Aufgabe ist es, strukturierte Daten zu extrahieren UND das visuelle Erscheinungsbild zu analysieren.
    
    WICHTIGES ZIEL ("Original-First" Optimization):
    Dein primäres Ziel ist eine 1:1 "Perfect Restoration" der hochgeladenen Speisekarte. 
    Analysiere das Bild und entscheide, ob eine einfache Reparatur (Repair) möglich ist oder ob das Material zu schlecht ist und eine "High-Fidelity Digital Recreation" (Recreate) nötig ist.
    Extrahiere die originalen Stil-Informationen (Schriftart, Primärfarbe, Akzentfarbe, Hintergrundfarbe, Textfarbe), damit wir das Original-Layout exakt nachbauen können.
    Generiere zusätzlich 3 passende, alternative Farbpaletten ('suggestedPalettes'), die zum Stil des Restaurants passen könnten.
    
    Regeln für die Extraktion:
    1. Erfasse für jeden Artikel: Nummer, Name, Beschreibung, Zutaten (ingredients).
    2. Erfasse ALLE Preise eines Artikels mit Label und Wert.
    3. Trenne hochgestellte Zeichen in 'additives' (Zahlen) und 'allergens' (Buchstaben).
    4. Versuche für jeden Artikel eine grobe 'boundingBox' (x, y, width, height in Prozent 0-100) zu schätzen, um die relative Position zu erhalten.
    5. Erfasse am Ende der Speisekarte die Legende für Zusatzstoffe und Allergene im 'footer'.
    6. Korrigiere OCR-Fehler (z.B. entferne überflüssige Satzzeichen, doppelte Punkte). Formatiere Preise einheitlich.
    7. Fülle für jeden Artikel das 'repairMetadata' Objekt aus, um zu dokumentieren, ob und wie stark der Text korrigiert wurde.
    8. ${detailInstruction}
    9. ${reasoningInstruction}
    10. Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt, das exakt dem geforderten Schema entspricht. Keine Markdown-Formatierung (\`\`\`json) um das JSON herum.
    11. Antworte komplett auf Deutsch.`
  };

  const isPro = modelName.includes('pro');
  
  const config: any = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        restaurantName: { type: Type.STRING, description: "Name des Restaurants" },
        subtitle: { type: Type.STRING, description: "Untertitel, Adresse oder Öffnungszeiten" },
        processingDecision: { type: Type.STRING, description: "Entscheidung: 'Repair' oder 'Recreate'" },
        originalStyle: {
          type: Type.OBJECT,
          properties: {
            fontFamily: { type: Type.STRING, description: "Geschätzte CSS font-family (z.B. 'serif', 'sans-serif', 'monospace')" },
            primaryColor: { type: Type.STRING, description: "Hauptfarbe als Hex-Code (z.B. '#000000')" },
            accentColor: { type: Type.STRING, description: "Akzentfarbe als Hex-Code" },
            backgroundColor: { type: Type.STRING, description: "Hintergrundfarbe als Hex-Code" },
            textColor: { type: Type.STRING, description: "Textfarbe als Hex-Code" }
          },
          required: ["fontFamily", "primaryColor", "backgroundColor", "textColor"]
        },
        suggestedPalettes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              fontFamily: { type: Type.STRING },
              primaryColor: { type: Type.STRING },
              accentColor: { type: Type.STRING },
              backgroundColor: { type: Type.STRING },
              textColor: { type: Type.STRING }
            },
            required: ["fontFamily", "primaryColor", "backgroundColor", "textColor"]
          },
          description: "3 alternative Farbpaletten, die zum Restaurant passen"
        },
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
                    ingredients: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Liste der Hauptzutaten"
                    },
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
                    },
                    priority: {
                      type: Type.STRING,
                      description: "Priorität des Gerichts: 'Hoch', 'Mittel' oder 'Niedrig'"
                    },
                    boundingBox: {
                      type: Type.OBJECT,
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER },
                        width: { type: Type.NUMBER },
                        height: { type: Type.NUMBER }
                      }
                    },
                    repairMetadata: {
                      type: Type.OBJECT,
                      properties: {
                        wasRepaired: { type: Type.BOOLEAN, description: "Wurde dieser Eintrag durch die KI repariert/korrigiert?" },
                        confidence: { type: Type.NUMBER, description: "Konfidenz der Erkennung (0.0 bis 1.0)" },
                        originalText: { type: Type.STRING, description: "Ursprünglicher OCR-Text vor der Reparatur" }
                      }
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
      required: ["categories", "processingDecision", "originalStyle"]
    }
  };

  if (isPro && thinkingLevel === "MAX") {
    config.thinkingConfig = { thinkingLevel: "HIGH" };
  }

  const executeExtraction = async () => {
    const startTime = Date.now();
    const requestId = `req_${Math.random().toString(36).substring(7)}`;
    
    try {
      logger.info(`[${requestId}] Starting Gemini API request. Model: ${modelName}, Detail: ${detailLevel}`);
      logger.info(`[${requestId}] Payload size: ${parts.length} images.`);
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
        contents: { parts: [...parts, prompt] },
        config
      });

      const executionTime = Date.now() - startTime;
      logger.info(`[${requestId}] Received response in ${executionTime}ms.`);
      
      let text = response.text;
      if (!text) {
        logger.error(`[${requestId}] Empty response text. Full response:`, JSON.stringify(response, null, 2));
        throw new Error("Leere Antwort von der API erhalten.");
      }

      text = text.replace(/^```json\n?/g, '').replace(/```\n?$/g, '').trim();

      try {
        const parsedData = JSON.parse(text) as MenuData;
        logger.info(`[${requestId}] Successfully parsed JSON.`);
        return { data: parsedData, usage: response.usageMetadata };
      } catch (parseError) {
        logger.error(`[${requestId}] JSON Parse Error:`, parseError);
        throw new Error("Ungültiges JSON-Format in der API-Antwort.");
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      logger.error(`[${requestId}] Error after ${executionTime}ms:`, error.message);
      throw error;
    }
  };

  try {
    return await withRetry(
      executeExtraction,
      3,
      1000,
      (attempt, err) => logger.warn(`Retry attempt ${attempt} due to: ${err.message}`)
    );
  } catch (error: any) {
    logger.error("Final extraction failure:", error);
    throw error;
  }
}

