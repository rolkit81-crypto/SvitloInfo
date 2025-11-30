import { GoogleGenAI } from "@google/genai";
import { OutageInfo, PowerStatus, GroupData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Map of city names (Ukrainian) to specific Telegram channels or Official Websites
const CITY_CHANNELS: Record<string, string> = {
  'Київ': 'site:dtek-kem.com.ua OR site:t.me/kyivnetworks OR site:yasno.com.ua',
  'Львів': 'site:loe.lviv.ua OR site:t.me/lvivoblenergo_news',
  'Одеса': 'site:dtek-oem.com.ua OR site:t.me/dtek_odesa',
  'Вінниця': 'site:voe.com.ua',
  'Івано-Франківськ': 'site:oe.if.ua OR site:t.me/prykarpattyaoblenergo_official',
  'Чернігів': 'site:chernihivoblenergo.com.ua',
  'Хмельницький': 'site:hoe.com.ua',
  'Луцьк': 'site:energy.volyn.ua',
  'Тернопіль': 'site:toe.com.ua',
  'Чернівці': 'site:oblenergo.cv.ua',
  'Рівне': 'site:roe.v.com.ua',
  'Ужгород': 'site:zakarpat.energy',
  'Житомир': 'site:ztoe.com.ua',
  'Запоріжжя': 'site:zoe.com.ua',
  'Кривий Ріг': 'site:dtek-dnem.com.ua',
  'Миколаїв': 'site:energy.mk.ua',
  'Херсон': 'site:ksoe.com.ua',
  'Черкаси': 'site:cherkasyoblenergo.com',
  'Кременчук': 'site:poe.pl.ua',
  'Дніпро': 'site:dtek-dnem.com.ua OR site:t.me/dtek_dnipro',
  'Харків': 'site:oblenergo.kharkov.ua',
  'Полтава': 'site:poe.pl.ua',
  'Суми': 'site:soe.com.ua',
  'Кропивницький': 'site:kiroe.com.ua',
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
  const maxRetries = 1;

  while (attempt <= maxRetries) {
    try {
      const modelId = 'gemini-2.5-flash';
      const now = new Date();
      // Use Kyiv time explicitly
      const options: Intl.DateTimeFormatOptions = { timeZone: 'Europe/Kyiv', hour: '2-digit', minute: '2-digit', hour12: false };
      const timeStr = now.toLocaleTimeString('uk-UA', options);
      const dateStr = now.toLocaleDateString('uk-UA', { 
        weekday: 'long', day: 'numeric', month: 'numeric', timeZone: 'Europe/Kyiv'
      });
      
      const currentHour = parseInt(timeStr.split(':')[0], 10);

      // Construct a highly specific search query
      const specificSource = CITY_CHANNELS[cityName] ? `(${CITY_CHANNELS[cityName]})` : 'official oblenergo website telegram';
      
      const prompt = `
      CONTEXT: You are a bot checking electricity status in ${cityName}, Ukraine.
      CURRENT TIME: ${dateStr}, ${timeStr} (Kyiv Time).
      SOURCE HINT: Look specifically at ${specificSource} for "Графік погодинних відключень" (GPV).

      GOAL: Find if specific groups are ON (light) or OFF (no light) RIGHT NOW.
      
      INSTRUCTIONS:
      1. Search for today's outage schedule or "поточні відключення".
      2. If news says "no limits" (без обмежень), "cancelled" (скасовано), "green" (зелений), then all groups are ON.
      3. If specific queues/groups are mentioned for ${currentHour}:00, extract their status.
      4. DO NOT say "Check website". Make a best guess based on the latest news (last 24h).

      OUTPUT FORMAT (Strict Pipe Separated):
      WEATHER|Temp|Condition|FeelsLike|Wind
      SUMMARY|Short Ukrainian summary of the situation (e.g. "Діють графіки", "Світло є").
      GROUP|ID|STATUS|NEXT_CHANGE|DESC

      STATUS MUST BE: ON, OFF, or MAYBE.
      `;

      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.0, // Zero temperature for maximum determinism and speed
        },
      });

      const fullText = response.text || '';
      const lines = fullText.split('\n');
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      let weather = { temp: '--', condition: 'Невідомо', feelsLike: '--', windSpeed: '--' };
      let summary = 'Дані оновлюються...';
      let groups: GroupData[] = [];
      const seenGroupIds = new Set<string>();

      for (const line of lines) {
          const clean = line.trim();
          if (!clean) continue;
          
          if (clean.startsWith('WEATHER|')) {
              const p = clean.split('|');
              weather = { temp: p[1] || '--', condition: p[2] || '', feelsLike: p[3] || '--', windSpeed: p[4] || '--' };
          } else if (clean.startsWith('SUMMARY|')) {
              summary = clean.substring(8).trim();
          } else if (clean.startsWith('GROUP|')) {
              const p = clean.split('|');
              if (p.length >= 5) {
                  let rawId = p[1].trim();
                  // Clean ID: "1." -> "1"
                  const idMatch = rawId.match(/(\d+(\.\d+)?)/);
                  let normalizedId = idMatch ? idMatch[0] : rawId.replace(/[^0-9.]/g, ''); 
                  if (normalizedId.endsWith('.')) normalizedId = normalizedId.slice(0, -1);
                  const finalId = normalizedId || rawId;

                  if (seenGroupIds.has(finalId)) continue;
                  seenGroupIds.add(finalId);

                  const statusStr = p[2].trim();
                  const nextTime = p[3].trim();
                  const desc = p[4].trim();
                  
                  let status = PowerStatus.UNKNOWN;
                  if (statusStr === 'ON') status = PowerStatus.ON;
                  else if (statusStr === 'OFF') status = PowerStatus.OFF;
                  else status = PowerStatus.MAYBE;

                  let validTime = undefined;
                  if (nextTime.match(/(\d{1,2}:\d{2})/)) validTime = nextTime;

                  groups.push({ id: finalId, status, description: desc, nextSwitchTime: validTime });
              }
          }
      }

      const defaultIds = getDefaultGroupsForCity(cityName);

      // Logic: If no specific groups found, try to infer global state from summary
      if (groups.length === 0) {
         const lowerSum = summary.toLowerCase();
         let fallbackStatus = PowerStatus.MAYBE;
         let fallbackDesc = 'Див. офіційні джерела';

         if (lowerSum.includes('скасовано') || lowerSum.includes('не діють') || lowerSum.includes('світло є') || lowerSum.includes('без обмежень')) {
             fallbackStatus = PowerStatus.ON;
             fallbackDesc = 'Графіки скасовано';
         } else if (lowerSum.includes('діють графіки') || lowerSum.includes('черга') || lowerSum.includes('черги')) {
             // If schedules are active but we couldn't parse specific groups, show MAYBE
             fallbackStatus = PowerStatus.MAYBE;
             fallbackDesc = 'Діють графіки (деталі уточнюються)';
         } else if (lowerSum.includes('аварійні') || lowerSum.includes('екстрені')) {
             fallbackStatus = PowerStatus.OFF;
             fallbackDesc = 'Екстрені відключення';
         }

         groups = defaultIds.map(id => ({ id, status: fallbackStatus, description: fallbackDesc }));
      } else {
        // Fill missing groups
        const existingIds = new Set(groups.map(g => g.id));
        defaultIds.forEach(id => {
            if (!existingIds.has(id)) {
                // Heuristic: inherit from general city state or sibling
                groups.push({ id, status: PowerStatus.MAYBE, description: 'Уточнюється' });
            }
        });

        // Lviv Sync Logic (1.1 should match 1.2 usually)
        if (cityName.toLowerCase().includes('львів') || cityName.toLowerCase().includes('lviv')) {
             ['1', '2', '3', '4', '5', '6'].forEach(main => {
                 const s1 = groups.find(g => g.id === `${main}.1`);
                 const s2 = groups.find(g => g.id === `${main}.2`);
                 
                 // If one is known and other is unknown/maybe, copy
                 if (s1 && (s1.status === PowerStatus.ON || s1.status === PowerStatus.OFF) && s2 && s2.status === PowerStatus.MAYBE) {
                     s2.status = s1.status; s2.description = s1.description;
                 }
                 if (s2 && (s2.status === PowerStatus.ON || s2.status === PowerStatus.OFF) && s1 && s1.status === PowerStatus.MAYBE) {
                     s1.status = s2.status; s1.description = s2.description;
                 }
             });
        }
      }

      // Determine Global Status for the header
      let globalStatus = PowerStatus.MAYBE;
      const lowerSum = summary.toLowerCase();
      const allOn = groups.every(g => g.status === PowerStatus.ON);
      const anyOff = groups.some(g => g.status === PowerStatus.OFF);

      if (lowerSum.includes('скасовано') || allOn) globalStatus = PowerStatus.ON;
      else if (anyOff) globalStatus = PowerStatus.OFF;
      else globalStatus = PowerStatus.ON; // Optimistic default if no negatives found

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
      if (error?.status === 429 || error?.toString().includes('429')) {
          attempt++;
          if (attempt <= maxRetries) {
              await sleep(1000);
              continue;
          }
      }
      return {
        status: PowerStatus.UNKNOWN,
        summary: "Сервіс тимчасово недоступний.",
        weather: { temp: '--', condition: '', feelsLike: '--', windSpeed: '--' },
        groups: [],
        lastUpdated: Date.now(),
        sources: []
      };
    }
  }

  return {
    status: PowerStatus.UNKNOWN,
    summary: "Невідома помилка.",
    weather: { temp: '--', condition: '', feelsLike: '--', windSpeed: '--' },
    groups: [],
    lastUpdated: Date.now(),
    sources: []
  };
};
