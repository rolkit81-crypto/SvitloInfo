import { GoogleGenAI } from "@google/genai";
import { OutageInfo, PowerStatus, GroupData } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const getDefaultGroupsForCity = (cityName: string): string[] => {
  const lower = cityName.toLowerCase();
  if (lower.includes('львів') || lower.includes('lviv')) {
    return ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'];
  }
  return ['1', '2', '3', '4', '5', '6'];
};

export const fetchOutageInfo = async (cityName: string): Promise<OutageInfo> => {
  try {
    const modelId = 'gemini-2.5-flash';
    const now = new Date();
    const dateStr = now.toLocaleDateString('uk-UA', { 
      weekday: 'long', day: 'numeric', month: 'numeric', timeZone: 'Europe/Kyiv'
    });

    const prompt = `
    SYSTEM_ROLE: Energy Grid Analyzer.
    TARGET_CITY: ${cityName}, Ukraine.
    DATE: ${dateStr}.
    MODE: STRICT_DATA_EXTRACTION.
    LANGUAGE: UKRAINIAN.

    INSTRUCTIONS:
    1. SEARCH "Графік відключень ${cityName} сьогодні" on official Oblenergo/DTEK sites/Telegram.
    2. EXTRACT 3 data points: Weather, Global Summary, Group Schedule.
    
    CRITICAL RULES:
    - Use official sources (DTEK, Oblenergo) via Google Search.
    - If specific schedule table not found, default groups to "MAYBE" (Possible Outages).
    - Status codes: ON (Green), OFF (Red), MAYBE (Grey/Yellow).
    - Lviv has 12 subgroups (1.1-6.2). Others usually 1-6.
    - DO NOT REPEAT GROUPS. List each unique group ID exactly once.
    
    OUTPUT_FORMAT (Pipe separated, NO Markdown):
    WEATHER|Temp|Condition|FeelsLike|Wind
    SUMMARY|Short 1-sentence summary of the situation.
    GROUP|ID|STATUS_CODE|TimeRange_or_Description
    GROUP|ID|STATUS_CODE|TimeRange_or_Description
    ...
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0,
      },
    });

    const fullText = response.text || '';
    const lines = fullText.split('\n');
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    let weather = { temp: '--', condition: 'Unknown', feelsLike: '--', windSpeed: '--' };
    let summary = 'Очікування даних...';
    let groups: GroupData[] = [];
    const seenGroupIds = new Set<string>();

    for (const line of lines) {
        const clean = line.trim();
        if (clean.startsWith('WEATHER|')) {
            const parts = clean.split('|');
            weather = { 
                temp: parts[1] || '--', 
                condition: parts[2] || '', 
                feelsLike: parts[3] || '--', 
                windSpeed: parts[4] || '--' 
            };
        } else if (clean.startsWith('SUMMARY|')) {
            summary = clean.substring(8).trim();
        } else if (clean.startsWith('GROUP|')) {
            const parts = clean.split('|');
            if (parts.length >= 4) {
                // Normalize ID: remove "Group", "Група", spaces, keep only numbers and dots
                let rawId = parts[1].trim();
                const normalizedId = rawId.replace(/[^0-9.]/g, ''); 
                
                const finalId = normalizedId || rawId; // Fallback to raw if normalization fails

                if (seenGroupIds.has(finalId)) continue;
                seenGroupIds.add(finalId);

                const statusStr = parts[2].trim();
                const desc = parts[3].trim();
                
                let status = PowerStatus.UNKNOWN;
                if (statusStr === 'ON') status = PowerStatus.ON;
                else if (statusStr === 'OFF') status = PowerStatus.OFF;
                else status = PowerStatus.MAYBE;

                groups.push({ id: finalId, status, description: desc });
            }
        }
    }

    if (groups.length === 0) {
       const defaultIds = getDefaultGroupsForCity(cityName);
       const fallbackStatus = summary.toLowerCase().includes('скасовано') ? PowerStatus.ON : PowerStatus.MAYBE;
       groups = defaultIds.map(id => ({
           id,
           status: fallbackStatus,
           description: fallbackStatus === PowerStatus.ON ? 'Світло є' : 'Див. офіційні джерела'
       }));
    }

    let globalStatus = PowerStatus.MAYBE;
    const lowerSum = summary.toLowerCase();
    if (lowerSum.includes('скасовано') || lowerSum.includes('світло є у всіх')) globalStatus = PowerStatus.ON;
    else if (lowerSum.includes('блекаут')) globalStatus = PowerStatus.OFF;
    else if (groups.every(g => g.status === PowerStatus.ON)) globalStatus = PowerStatus.ON;

    const uniqueSources = new Map();
    groundingChunks.forEach(c => {
        if (c.web?.uri && c.web?.title) uniqueSources.set(c.web.uri, { title: c.web.title, uri: c.web.uri });
    });

    return {
      status: globalStatus,
      summary,
      weather,
      groups: groups.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })),
      lastUpdated: Date.now(),
      sources: Array.from(uniqueSources.values()).slice(0, 4)
    };

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return {
      status: PowerStatus.UNKNOWN,
      summary: error?.status === 429 ? "Сервіс перевантажений. Спробуйте пізніше." : "Не вдалося отримати дані.",
      weather: { temp: '--', condition: '', feelsLike: '--', windSpeed: '--' },
      groups: [],
      lastUpdated: Date.now(),
      sources: []
    };
  }
};
