
import { GoogleGenAI } from "@google/genai";
import { OutageInfo, PowerStatus, GroupData, NewsResult } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to get the correct group structure for a specific city if AI fails
const getDefaultGroupsForCity = (cityName: string): string[] => {
  const lower = cityName.toLowerCase();
  
  // Lviv uses subgroups: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 6.1, 6.2
  if (lower.includes('львів') || lower.includes('lviv')) {
    return [
      '1.1', '1.2', 
      '2.1', '2.2', 
      '3.1', '3.2', 
      '4.1', '4.2', 
      '5.1', '5.2', 
      '6.1', '6.2'
    ];
  }
  
  // Most other major cities (Kyiv, Odesa, Dnipro) use 6 groups
  return ['1', '2', '3', '4', '5', '6'];
};

export const fetchOutageInfo = async (cityName: string): Promise<OutageInfo> => {
  try {
    const modelId = 'gemini-2.5-flash';
    
    // Get current date in Ukrainian format to force relevant search results
    const now = new Date();
    const dateOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'Europe/Kyiv'
    };
    const currentDateStr = now.toLocaleDateString('uk-UA', dateOptions);

    let specificInstructions = '';
    // Add specific data sources for known cities
    if (cityName.toLowerCase().includes('львів') || cityName.toLowerCase().includes('lviv')) {
      specificInstructions = `
      LVIV INSTRUCTIONS:
      1. PRIORITY SOURCE: https://poweron.loe.lviv.ua/.
      2. If chart is blank/green -> ALL GROUPS ON.
      3. LIST 12 GROUPS: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 6.1, 6.2.
      `;
    } else if (cityName.toLowerCase().includes('київ') || cityName.toLowerCase().includes('kyiv')) {
      specificInstructions = `
      KYIV INSTRUCTIONS:
      1. Check DTEK Kyiv Grids.
      2. Groups 1-6.
      `;
    }

    const prompt = `
      Date: ${currentDateStr}. City: ${cityName}, Ukraine.
      Task: Find electricity outage schedule (GPV) for TODAY.

      ${specificInstructions}
      
      Sources: Official Oblenergo Telegram/Site for ${cityName}.

      OUTPUT FORMAT:
      Summary text (max 3 sentences about current situation).
      ---GROUPS_DATA---
      GroupId|Status|TimeRange

      RULES:
      1. Status: ON (Power is present/No schedule), MAYBE (Scheduled outage), OFF (Total Blackout).
      2. TimeRange: Only hours (e.g. "18:00-21:00") or "Графік відсутній".
      3. List ALL groups strictly.
      4. Ignore lines that look like headers (e.g. GroupId|Status...).
      
      Example Output:
      Stabilization schedules are active today.
      ---GROUPS_DATA---
      1|ON|Графік відсутній
      2|MAYBE|18:00-21:00
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0, // Deterministic
      },
    });

    const fullText = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Split summary and structured data
    const parts = fullText.split('---GROUPS_DATA---');
    const summary = parts[0].trim();
    const rawGroupsData = parts[1] ? parts[1].trim() : '';

    // Parse Groups
    let groups: GroupData[] = [];
    if (rawGroupsData) {
      const lines = rawGroupsData.split('\n');
      groups = lines.map(line => {
        // Normalize: remove start/end pipes if in markdown table format
        const cleanLine = line.trim().replace(/^\|/, '').replace(/\|$/, '');
        
        // SKIP HEADERS or junk lines
        if (cleanLine.toLowerCase().includes('groupid') || cleanLine.includes('---') || cleanLine.toLowerCase().includes('status')) {
            return null;
        }

        const [id, statusStr, description] = cleanLine.split('|').map(s => s?.trim());
        
        // Skip empty lines
        if (!id || !statusStr) return null;

        let status = PowerStatus.UNKNOWN;
        if (statusStr === 'ON') status = PowerStatus.ON;
        else if (statusStr === 'OFF') status = PowerStatus.OFF;
        else if (statusStr === 'MAYBE') status = PowerStatus.MAYBE;
        
        return {
            id,
            status,
            description: description || ''
        };
      }).filter((g): g is GroupData => g !== null);
    }

    // Determine global status
    let globalStatus = PowerStatus.MAYBE;
    const lowerText = summary.toLowerCase();
    
    const isTotalOn = lowerText.includes('скасовано') || 
                      lowerText.includes('світло є у всіх') || 
                      lowerText.includes('графіки не застосовуються') || 
                      lowerText.includes('не діють') ||
                      lowerText.includes('відключень не передбачається');

    const isTotalOff = (lowerText.includes('блекаут') || lowerText.includes('знеструмлено все місто')) && 
                       !lowerText.includes('частково') && 
                       !lowerText.includes('екстрені');

    if (isTotalOff) {
      globalStatus = PowerStatus.OFF;
    } else if (isTotalOn) {
      globalStatus = PowerStatus.ON;
    } else {
      globalStatus = PowerStatus.MAYBE;
    }

    // Fallback logic
    if (groups.length === 0) {
       const defaultGroupIds = getDefaultGroupsForCity(cityName);

       for (const id of defaultGroupIds) {
         let groupStatus = PowerStatus.UNKNOWN;
         let groupDesc = 'Невідомо';

         if (globalStatus === PowerStatus.ON) {
             groupStatus = PowerStatus.ON;
             groupDesc = 'Світло є';
         } else if (globalStatus === PowerStatus.OFF) {
             groupStatus = PowerStatus.OFF;
             groupDesc = 'Аварійне відключення';
         } else {
             groupStatus = PowerStatus.MAYBE;
             groupDesc = 'Див. джерело';
         }

         groups.push({
           id: id,
           status: groupStatus,
           description: groupDesc
         });
       }
    }

    // Extract sources
    const sources = groundingChunks
      .map(chunk => ({
        title: chunk.web?.title || 'Джерело',
        uri: chunk.web?.uri || '#'
      }))
      .filter(s => s.uri !== '#');

    // Deduplicate sources
    const sourcesMap = new Map<string, { title: string; uri: string }>();
    for (const s of sources) {
      if (!sourcesMap.has(s.uri)) {
        sourcesMap.set(s.uri, s);
      }
    }
    const uniqueSources = Array.from(sourcesMap.values()).slice(0, 4);

    return {
      status: globalStatus,
      summary: summary,
      groups: groups,
      lastUpdated: Date.now(),
      sources: uniqueSources
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    let errorSummary = "Не вдалося отримати дані. Спробуйте пізніше або перевірте з'єднання.";
    
    // Check for Rate Limit (429) or Quota Exceeded
    if (error?.status === 429 || error?.message?.includes('429') || error?.toString().includes('429') || error?.message?.includes('quota')) {
        errorSummary = "Сервіс перевантажений (Ліміт запитів). Будь ласка, зачекайте хвилину перед наступною спробою.";
    }

    return {
      status: PowerStatus.UNKNOWN,
      summary: errorSummary,
      groups: [],
      lastUpdated: Date.now(),
      sources: []
    };
  }
};

export const fetchDailyNews = async (cityName: string): Promise<NewsResult> => {
  try {
    const modelId = 'gemini-2.5-flash';
    const now = new Date();
    const currentDateStr = now.toLocaleDateString('uk-UA', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Kyiv' 
    });

    const prompt = `
      Date: ${currentDateStr}.
      Task: Provide a brief summary of key news for today in Ukraine and specifically in ${cityName}.
      
      Sections required:
      1. WAR/GENERAL: Major events in Ukraine (max 3 bullet points).
      2. LOCAL: Major events in ${cityName} (energy, incidents, important news) (max 3 bullet points).
      
      OUTPUT FORMAT:
      Summary: [One sentence general summary]
      ---WAR---
      - Point 1
      - Point 2
      ---LOCAL---
      - Point 1
      - Point 2
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3,
      },
    });

    const text = response.text || '';
    const [summaryPart, rest] = text.split('---WAR---');
    const [warPart, localPart] = (rest || '').split('---LOCAL---');

    const cleanPoints = (str: string) => 
        str ? str.trim().split('\n').map(l => l.replace(/^- /, '').trim()).filter(l => l.length > 0) : [];

    return {
      summary: summaryPart.replace('Summary:', '').trim(),
      war: cleanPoints(warPart),
      local: cleanPoints(localPart),
      lastUpdated: Date.now()
    };

  } catch (error: any) {
    console.error("News API Error:", error);
    
    let errorSummary = "Не вдалося завантажити новини.";
    // Check for Rate Limit (429)
    if (error?.status === 429 || error?.message?.includes('429') || error?.toString().includes('429')) {
        errorSummary = "Ліміт запитів вичерпано. Спробуйте пізніше.";
    }

    return {
        summary: errorSummary,
        war: [],
        local: [],
        lastUpdated: Date.now()
    };
  }
};
