import { GoogleGenAI } from "@google/genai";
import { OutageInfo, PowerStatus, GroupData } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Map of city names (Ukrainian) to specific Telegram channels or Official Websites
const CITY_CHANNELS: Record<string, string> = {
  'Київ': 'https://t.me/+M2qHRqGp_zUyNzky',
  'Львів': 'https://t.me/+akG3S8R8YBllMTVi',
  'Одеса': 'https://t.me/+bZCrqo_GW8ozZjdi',
  'Вінниця': 'https://t.me/+8NJAStP3quk4ODdi',
  'Івано-Франківськ': 'https://t.me/+rd1r6L1tuUM3NDYy',
  'Чернігів': 'https://t.me/+nTDucuPdNqJhYTli',
  'Хмельницький': 'https://t.me/+ZTPWfeRsiao2YmMy',
  'Луцьк': 'https://t.me/+Zd173YiU4wU3ODEy',
  'Тернопіль': 'https://t.me/+qQFsqM8R-sw2MTAy',
  'Чернівці': 'https://t.me/+1voA6rAr0K0zZGJi',
  'Рівне': 'https://t.me/+v3FaC0QuoAc5MjRi',
  'Ужгород': 'https://t.me/+MEgwuHgiYBljNGEy',
  'Житомир': 'https://t.me/+O3m7t3wd_II5MWRi',
  'Запоріжжя': 'https://t.me/+pYa_4-kqM_EyN2Iy',
  'Кривий Ріг': 'https://t.me/+jqRoidaFMFVkMWNi',
  'Миколаїв': 'https://off.energy.mk.ua/',
  'Херсон': 'https://t.me/+X1mem_gK1pVjYTEy',
  'Черкаси': 'https://t.me/+eO8HSjUee_kzYjEy',
  'Кременчук': 'https://t.me/+e4aB-x8raQ9iNDYy',
  'Дніпро': 'https://t.me/+N8Bw8yUGrAA5MGJi',
  'Харків': 'https://t.me/+8Yem4pA4qN42Mjcy',
  'Полтава': 'https://t.me/+bYY_pd1WhAIwMDli',
  'Суми': 'https://t.me/+jBJvg4K-q_s2YWQ6',
  'Кропивницький': 'https://t.me/+ATxaydyVd_hlYjMy',
};

const getDefaultGroupsForCity = (cityName: string): string[] => {
  const lower = cityName.toLowerCase();
  if (lower.includes('львів') || lower.includes('lviv')) {
    return ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'];
  }
  return ['1', '2', '3', '4', '5', '6'];
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchOutageInfo = async (cityName: string): Promise<OutageInfo> => {
  let attempt = 0;
  const maxRetries = 3;

  while (attempt <= maxRetries) {
    try {
      const modelId = 'gemini-2.5-flash';
      const now = new Date();
      const dateStr = now.toLocaleDateString('uk-UA', { 
        weekday: 'long', day: 'numeric', month: 'numeric', timeZone: 'Europe/Kyiv'
      });
      const timeStr = now.toLocaleTimeString('uk-UA', { timeZone: 'Europe/Kyiv', hour: '2-digit', minute: '2-digit' });

      const specificChannel = CITY_CHANNELS[cityName] || '';

      const prompt = `
      SYSTEM_ROLE: Energy Grid Analyzer.
      TARGET_CITY: ${cityName}, Ukraine.
      CURRENT_TIME: ${timeStr} (${dateStr}).
      MODE: STRICT_DATA_EXTRACTION.
      LANGUAGE: UKRAINIAN.
      SEARCH_STRATEGY: Prioritize the PRIMARY SOURCE (${specificChannel}) if available, otherwise search for official local Oblenergo channels.

      INSTRUCTIONS:
      1. SEARCH "Графік відключень ${cityName} сьогодні" OR "Світло ${cityName} зараз" OR "${specificChannel}".
      2. LOOK FOR recent updates in official sources (especially ${specificChannel}) regarding:
         - Emergency shutdowns (Екстрені).
         - Stabilization schedules (Стабілізаційні).
         - Cancellation of schedules (Скасування).
      3. EXTRACT 3 data points: Weather, Global Summary, Group Schedule.
      4. FOR EACH GROUP:
         - Status: ON/OFF/MAYBE.
         - Schedule: EXTRACT THE FULL TIME RANGE if available (e.g. "12:00-16:00"). 
           If only the switch time is known, use that.
      
      CRITICAL RULES:
      - Status codes: ON (Green), OFF (Red), MAYBE (Grey/Yellow).
      - If status is ON but a schedule says "16:00-20:00", provide "16:00-20:00" in the time field so the user knows when it goes off.
      - Lviv has 12 subgroups (1.1-6.2). Others usually 1-6.
      - DO NOT REPEAT GROUPS.
      
      OUTPUT_FORMAT (Pipe separated, NO Markdown):
      WEATHER|Temp|Condition|FeelsLike|Wind
      SUMMARY|Short 1-sentence summary based on the latest info.
      GROUP|ID|STATUS_CODE|SCHEDULE_RANGE_OR_TIME|Description
      GROUP|ID|STATUS_CODE|SCHEDULE_RANGE_OR_TIME|Description
      ...
      
      Example Group Lines:
      GROUP|1.1|ON|18:00-22:00|Світло є, відключення за графіком 18-22.
      GROUP|2.1|OFF|15:00|Включення орієнтовно о 15:00.
      GROUP|3.1|MAYBE|16:00-20:00|Можливі відключення 16-20.
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
              // Expecting: GROUP | ID | STATUS | TIME | DESC
              if (parts.length >= 5) {
                  let rawId = parts[1].trim();
                  // More robust ID extraction: looks for patterns like "1", "1.1", "1A" -> "1"
                  const idMatch = rawId.match(/(\d+(\.\d+)?)/);
                  const normalizedId = idMatch ? idMatch[0] : rawId.replace(/[^0-9.]/g, ''); 
                  const finalId = normalizedId || rawId;

                  if (seenGroupIds.has(finalId)) continue;
                  seenGroupIds.add(finalId);

                  const statusStr = parts[2].trim();
                  const nextTime = parts[3].trim();
                  const desc = parts[4].trim();
                  
                  let status = PowerStatus.UNKNOWN;
                  if (statusStr === 'ON') status = PowerStatus.ON;
                  else if (statusStr === 'OFF') status = PowerStatus.OFF;
                  else status = PowerStatus.MAYBE;

                  // Clean up time: ensure it looks like HH:MM or HH:MM-HH:MM
                  let validTime = undefined;
                  // Regex to match HH:MM or HH:MM-HH:MM (ranges) or similar patterns
                  if (nextTime.match(/(\d{1,2}:\d{2})/)) {
                      validTime = nextTime;
                  }

                  groups.push({ id: finalId, status, description: desc, nextSwitchTime: validTime });
              }
          }
      }

      const defaultIds = getDefaultGroupsForCity(cityName);

      if (groups.length === 0) {
         const lowerSum = summary.toLowerCase();
         // If summary mentions emergency/accident/shutdown, fallback to OFF/MAYBE. 
         // Otherwise assume light is ON if no schedule found.
         const isNegative = lowerSum.includes('екстрені') || lowerSum.includes('аварійні') || lowerSum.includes('відключення за графіком');
         
         const fallbackStatus = isNegative ? PowerStatus.OFF : PowerStatus.ON;
         const fallbackDesc = isNegative ? 'Див. офіційні джерела' : 'Світло є, графік відсутній';

         groups = defaultIds.map(id => ({
             id,
             status: fallbackStatus,
             description: fallbackDesc
         }));
      } else {
        // Backfill missing groups
        const existingIds = new Set(groups.map(g => g.id));
        defaultIds.forEach(id => {
            if (!existingIds.has(id)) {
                // Fix: Check if sub-groups exist for this ID (e.g., "1.1" exists for "1")
                // This prevents showing "Group 1: Unknown" when "Group 1.1" has data.
                const hasSubgroups = groups.some(g => g.id.startsWith(`${id}.`));
                
                if (!hasSubgroups) {
                    // Fix: Check if parent group exists (e.g. "1" exists for "1.1")
                    // This handles cases where source reports "Group 1" but we need "1.1" and "1.2".
                    const parentId = id.includes('.') ? id.split('.')[0] : null;
                    const parentGroup = parentId ? groups.find(g => g.id === parentId) : null;
                    
                    // Fix: Check for sibling (Lviv specific inheritance: 1.2 inherits from 1.1 if 1 is missing)
                    let siblingGroup = null;
                    if (!parentGroup && id.includes('.')) {
                        const [main, sub] = id.split('.');
                        if (sub === '1') siblingGroup = groups.find(g => g.id === `${main}.2`);
                        else if (sub === '2') siblingGroup = groups.find(g => g.id === `${main}.1`);
                    }

                    if (parentGroup) {
                        groups.push({
                            ...parentGroup,
                            id: id,
                            // Inherit description and status
                        });
                    } else if (siblingGroup) {
                         groups.push({
                            ...siblingGroup,
                            id: id,
                        });
                    } else {
                        groups.push({
                            id,
                            status: PowerStatus.ON, // Assume ON if not listed (usually lists contain outages)
                            description: 'Світло є, графік відсутній', // User requested text
                        });
                    }
                }
            }
        });
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
      console.error(`Gemini Error (Attempt ${attempt + 1}):`, error);
      
      // Retry Logic for Rate Limit
      if (error?.status === 429 || error?.toString().includes('429')) {
          attempt++;
          if (attempt <= maxRetries) {
              const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s...
              console.log(`Rate limit hit. Retrying in ${delay}ms...`);
              await sleep(delay);
              continue; // Retry loop
          } else {
              // Retries exhausted
              return {
                  status: PowerStatus.UNKNOWN,
                  summary: "Сервер перевантажений. Спробуйте пізніше.",
                  weather: { temp: '--', condition: '', feelsLike: '--', windSpeed: '--' },
                  groups: [],
                  lastUpdated: Date.now(),
                  sources: []
              };
          }
      }

      // Other errors
      return {
        status: PowerStatus.UNKNOWN,
        summary: "Не вдалося отримати дані.",
        weather: { temp: '--', condition: '', feelsLike: '--', windSpeed: '--' },
        groups: [],
        lastUpdated: Date.now(),
        sources: []
      };
    }
  }

  // Should not be reached due to loop logic, but typescript needs return
  return {
    status: PowerStatus.UNKNOWN,
    summary: "Невідома помилка.",
    weather: { temp: '--', condition: '', feelsLike: '--', windSpeed: '--' },
    groups: [],
    lastUpdated: Date.now(),
    sources: []
  };
};
