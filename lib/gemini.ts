import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { withRetry } from "./error-handler";

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
  boundingBox?: { x: number, y: number, width: number, height: number };
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
    7. ${detailInstruction}
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
                    boundingBox: {
                      type: Type.OBJECT,
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER },
                        width: { type: Type.NUMBER },
                        height: { type: Type.NUMBER }
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

  if (isPro) {
    config.thinkingConfig = { thinkingLevel: "HIGH" };
  }

  const executeExtraction = async () => {
    const startTime = Date.now();
    const requestId = `req_${Math.random().toString(36).substring(7)}`;
    
    try {
      console.log(`[${requestId}] Starting Gemini API request. Model: ${modelName}, Detail: ${detailLevel}`);
      console.log(`[${requestId}] Payload size: ${parts.length} images.`);
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
        contents: { parts: [...parts, prompt] },
        config
      });

      const executionTime = Date.now() - startTime;
      console.log(`[${requestId}] Received response in ${executionTime}ms.`);
      
      let text = response.text;
      if (!text) {
        console.error(`[${requestId}] Empty response text. Full response:`, JSON.stringify(response, null, 2));
        throw new Error("Leere Antwort von der API erhalten.");
      }

      text = text.replace(/^```json\n?/g, '').replace(/```\n?$/g, '').trim();

      try {
        const parsedData = JSON.parse(text) as MenuData;
        console.log(`[${requestId}] Successfully parsed JSON.`);
        return parsedData;
      } catch (parseError) {
        console.error(`[${requestId}] JSON Parse Error:`, parseError);
        throw new Error("Ungültiges JSON-Format in der API-Antwort.");
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      console.error(`[${requestId}] Error after ${executionTime}ms:`, error.message);
      throw error;
    }
  };

  try {
    return await withRetry(
      executeExtraction,
      3,
      1000,
      (attempt, err) => console.warn(`Retry attempt ${attempt} due to: ${err.message}`)
    );
  } catch (error: any) {
    console.error("Final extraction failure:", error);
    
    // Fallback: Basic data structure if everything fails
    return {
      restaurantName: "Speisekarte (Wiederhergestellt)",
      processingDecision: 'Recreate',
      originalStyle: {
        fontFamily: 'sans-serif',
        primaryColor: '#000000',
        backgroundColor: '#ffffff',
        textColor: '#333333',
        accentColor: '#666666'
      },
      categories: [
        {
          category: "Fehler bei der Analyse",
          items: [
            {
              name: "Analyse fehlgeschlagen",
              description: "Die KI konnte die Daten nicht extrahieren. Bitte versuche es mit einem schärferen Bild erneut.",
              prices: [{ value: "0,00 €" }]
            }
          ]
        }
      ]
    };
  }
}

export async function updateMenuData(
  currentData: MenuData,
  promptText: string,
  apiKey: string
): Promise<MenuData> {
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = {
    text: `Du bist ein professioneller KI-Assistent für Speisekarten-Design. 
    Hier ist die aktuelle Speisekarte als JSON:
    ${JSON.stringify(currentData)}
    
    Der Benutzer möchte folgende Änderung vornehmen:
    "${promptText}"
    
    Wende die Änderung auf das JSON an und gib das aktualisierte JSON zurück.
    Behalte alle anderen Daten bei, die nicht von der Änderung betroffen sind.
    Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt, das exakt dem Schema entspricht. Keine Markdown-Formatierung (\`\`\`json) um das JSON herum.`
  };

  const config: any = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        restaurantName: { type: Type.STRING },
        subtitle: { type: Type.STRING },
        processingDecision: { type: Type.STRING },
        originalStyle: {
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
        categories: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    number: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    ingredients: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    prices: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          value: { type: Type.STRING }
                        },
                        required: ["value"]
                      }
                    },
                    additives: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    allergens: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    boundingBox: {
                      type: Type.OBJECT,
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER },
                        width: { type: Type.NUMBER },
                        height: { type: Type.NUMBER }
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
            additives: { type: Type.STRING },
            allergens: { type: Type.STRING }
          }
        }
      },
      required: ["categories"]
    }
  };

  const executeUpdate = async () => {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: { parts: [prompt] },
      config
    });

    let text = response.text;
    if (!text) {
      throw new Error("Leere Antwort von der API erhalten.");
    }

    text = text.replace(/^```json\n?/g, '').replace(/```\n?$/g, '').trim();

    try {
      const parsedData = JSON.parse(text) as MenuData;
      return parsedData;
    } catch (parseError) {
      throw new Error("Fehler beim Verarbeiten der API-Antwort (ungültiges JSON).");
    }
  };

  try {
    return await withRetry(executeUpdate);
  } catch (error: any) {
    throw new Error(`Gemini API Fehler: ${error.message || String(error)}`);
  }
}
