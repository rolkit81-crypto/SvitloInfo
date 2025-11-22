import { GoogleGenAI } from "@google/genai";
import { OutageInfo, PowerStatus, GroupData } from '../types';

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
        const [id, statusStr, description] = cleanLine.split('|').map(s => s?.trim());
        
        // Skip empty lines or header junk
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

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      status: PowerStatus.UNKNOWN,
      summary: "Не вдалося отримати дані. Спробуйте пізніше або перевірте з'єднання.",
      groups: [],
      lastUpdated: Date.now(),
      sources: []
    };
  }
};
