import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PowerStatus, OutageInfo, GroupData } from '../types';

interface StatusDisplayProps {
  data: OutageInfo | null;
  loading: boolean;
  cityName?: string;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ data, loading, cityName }) => {
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'TELEGRAM' | 'WEB'>('ALL');
  const [expandedGroup, setExpandedGroup] = useState<GroupData | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = expandedGroup || showSummaryModal || showWeatherModal ? 'hidden' : 'unset';
  }, [expandedGroup, showSummaryModal, showWeatherModal]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setExpandedGroup(null);
      setShowSummaryModal(false);
      setShowWeatherModal(false);
      setIsClosing(false);
    }, 200);
  };

  const getStatusText = (st: PowerStatus) => {
    if (st === PowerStatus.ON) return 'Світло є';
    if (st === PowerStatus.OFF) return 'Відключення';
    if (st === PowerStatus.UNKNOWN) return 'Невідомо';
    return 'Можливі відключення';
  };

  const isOfficialSource = (uri: string, title: string) => {
    const normalizedUri = uri.toLowerCase();
    const normalizedTitle = title.toLowerCase();
    
    const officialDomains = [
        'gov.ua', 'dtek', 'yasno', 'oblenergo', 'ukrenergo',
        'hoe.com.ua', 'soe.com.ua', 'poe.pl.ua', 'zoe.com.ua', 'loe.lviv.ua', 
        'toe.com.ua', 'zakarpat.energy', 'kroe.com.ua', 'cek.dp.ua', 
        'volynoblenergo', 'chernigivoblenergo', 'kharkivoblenergo', 
        'mykolaivoblenergo', 'khersonoblenergo', 'lek.com.ua', 'kremenchuk', 'ok.energy',
        'mev.gov.ua', 'nerc.gov.ua', 'energy.gov.ua', 'voe.com.ua', 'oe.if.ua',
        'chernivtsioblenergo', 'ztoe.com.ua', 'koblenergo', 'cherkasyoblenergo',
        'energy.mk.ua', 'off.energy.mk.ua'
    ];

    const officialKeywords = ['дтек', 'обленерго', 'укренерго', 'yasno', 'міськрада', 'ова', 'dtek', 'світло', 'енерго'];

    if (officialDomains.some(d => normalizedUri.includes(d))) return true;

    if (normalizedUri.includes('t.me') || normalizedUri.includes('facebook') || normalizedUri.includes('instagram')) {
        if (officialKeywords.some(k => normalizedTitle.includes(k))) return true;
    }

    return false;
  };

  const getWeatherIcon = (condition: string, large = false) => {
    const c = condition.toLowerCase();
    const sizeClass = large ? "w-32 h-32" : "w-full h-full"; 

    if (c.includes('гроз') || c.includes('storm') || c.includes('thunder')) {
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClass} text-purple-400 overflow-visible`}>
           <path d="M48 24C48 15.163 40.837 8 32 8C24.545 8 18.28 13.178 16.49 20.084C16.16 20.026 15.82 20 15.5 20C9.149 20 4 25.149 4 31.5C4 37.851 9.149 43 15.5 43H48.5C54.851 43 60 37.851 60 31.5C60 25.149 54.851 20 48.5 20H48V24Z" fill="#9CA3AF" fillOpacity="0.9">
             <animate attributeName="transform" type="translate" values="0 0; 0 -2; 0 0" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1; 0.45 0 0.55 1" />
           </path>
           <path d="M34 32L26 44H34L30 56L42 40H32L34 32Z" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1" strokeLinejoin="round">
             <animate attributeName="opacity" values="0;1;0;0;1;0" dur="2s" repeatCount="indefinite" />
             <animate attributeName="fill" values="#FBBF24;#FFFFFF;#FBBF24" dur="0.5s" repeatCount="indefinite" />
           </path>
        </svg>
      );
    }

    if (c.includes('ясн') || c.includes('сон') || c.includes('sun') || c.includes('clear')) {
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClass} text-yellow-500 overflow-visible`}>
           <g>
             <path d="M32 6V12M32 52V58M58 32H52M12 32H6M50.38 13.62L46.14 17.86M17.86 46.14L13.62 50.38M50.38 50.38L46.14 46.14M17.86 17.86L13.62 13.62" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="20s" repeatCount="indefinite" />
             </path>
           </g>
           <circle cx="32" cy="32" r="17" fill="currentColor" opacity="0.15">
              <animate attributeName="r" values="17;21;17" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.15;0.05;0.15" dur="4s" repeatCount="indefinite" />
           </circle>
           <circle cx="32" cy="32" r="14" fill="currentColor">
              <animate attributeName="r" values="14;15;14" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
           </circle>
        </svg>
      );
    }

    if (c.includes('дощ') || c.includes('злив') || c.includes('rain') || c.includes('drizzle')) {
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClass} text-blue-400 overflow-visible`}>
          <path d="M48 24C48 15.163 40.837 8 32 8C24.545 8 18.28 13.178 16.49 20.084C16.16 20.026 15.82 20 15.5 20C9.149 20 4 25.149 4 31.5C4 37.851 9.149 43 15.5 43H48.5C54.851 43 60 37.851 60 31.5C60 25.149 54.851 20 48.5 20H48V24Z" fill="#9CA3AF" fillOpacity="0.8">
             <animate attributeName="transform" type="translate" values="0 0; 0 -2; 0 0" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1; 0.45 0 0.55 1" />
          </path>
          <g transform="translate(0, 5)">
            {[20, 32, 44].map((x, i) => (
                <rect key={i} x={x} y="42" width="2" height="5" rx="1" fill="currentColor" opacity="0.6">
                   <animate attributeName="y" values="42; 60" dur="0.9s" begin={`${i * 0.25}s`} repeatCount="indefinite" />
                   <animate attributeName="opacity" values="0.8;0" dur="0.9s" begin={`${i * 0.25}s`} repeatCount="indefinite" />
                   <animate attributeName="height" values="5; 8" dur="0.9s" begin={`${i * 0.25}s`} repeatCount="indefinite" />
                </rect>
            ))}
          </g>
        </svg>
      );
    }

    if (c.includes('сніг') || c.includes('snow') || c.includes('flurr')) {
       return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClass} text-white overflow-visible`}>
           <path d="M48 24C48 15.163 40.837 8 32 8C24.545 8 18.28 13.178 16.49 20.084C16.16 20.026 15.82 20 15.5 20C9.149 20 4 25.149 4 31.5C4 37.851 9.149 43 15.5 43H48.5C54.851 43 60 37.851 60 31.5C60 25.149 54.851 20 48.5 20H48V24Z" fill="#9CA3AF" fillOpacity="0.5"/>
           <g transform="translate(0, 5)">
               <circle cx="20" cy="45" r="1.5" fill="white"><animateTransform attributeName="transform" type="translate" values="0 -5; 2 10; 0 25" dur="2.5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite" /></circle>
               <circle cx="32" cy="48" r="2" fill="white"><animateTransform attributeName="transform" type="translate" values="0 -5; -2 10; 0 25" dur="3s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" /></circle>
               <circle cx="44" cy="45" r="1.5" fill="white"><animateTransform attributeName="transform" type="translate" values="0 -5; 2 10; 0 25" dur="2.8s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;1;0" dur="2.8s" repeatCount="indefinite" /></circle>
           </g>
        </svg>
       );
    }

    return (
      <svg viewBox="0 0 64 64" fill="none" className={`${sizeClass} text-zinc-400 overflow-visible`}>
         <path d="M44 32C44 26 39 22 34 22C30 22 27 24 25 27C24 27 23 27 22 27C18 27 15 30 15 34C15 38 18 41 22 41H44C47.8 41 51 38 51 34C51 30 47.8 27 44 27V32Z" fill="currentColor" fillOpacity="0.3">
            <animate attributeName="transform" type="translate" values="-3 0; 3 0; -3 0" dur="12s" repeatCount="indefinite" />
         </path>

         <circle cx="20" cy="18" r="5" fill="#FBBF24">
             <animate attributeName="transform" type="translate" values="0 0; 0 -2; 0 0" dur="6s" repeatCount="indefinite" />
         </circle>

         <path d="M48 28C48 19.163 40.837 12 32 12C24.545 12 18.28 17.178 16.49 24.084C16.16 24.026 15.82 24 15.5 24C9.149 24 4 29.149 4 35.5C4 41.851 9.149 47 15.5 47H48.5C54.851 47 60 41.851 60 35.5C60 29.149 54.851 24 48.5 24H48V28Z" fill="currentColor" fillOpacity="0.8">
             <animate attributeName="transform" type="translate" values="0 0; 4 0; 0 0" dur="8s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1; 0.45 0 0.55 1" />
         </path>
      </svg>
    );
  }

  const getSmartScheduleText = (group: GroupData) => {
    if (!group.nextSwitchTime) return null;
    
    const timeStr = group.nextSwitchTime.replace(/[–—]/g, '-');

    const rangeMatch = timeStr.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    const singleMatch = timeStr.match(/(\d{1,2}:\d{2})/);

    let durationText = '';

    if (rangeMatch) {
      const [_, start, end] = rangeMatch;
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);
      
      let diffMins = (endH * 60 + endM) - (startH * 60 + startM);
      if (diffMins < 0) diffMins += 24 * 60; 
      
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      
      if (hours > 0) {
        durationText = `${hours} год`;
        if (mins > 0) durationText += ` ${mins} хв`;
      } else {
        durationText = `${mins} хв`;
      }
    }

    if (group.status === PowerStatus.ON) {
        if (rangeMatch) {
            return `До ${rangeMatch[1]} (далі вимк. на ${durationText})`;
        } else if (singleMatch) {
            return `До ${singleMatch[1]}`;
        }
    } else if (group.status === PowerStatus.OFF) {
         if (rangeMatch) {
             return `Відключення на ${durationText} (до ${rangeMatch[2]})`;
         } else if (singleMatch) {
             return `Включення о ${singleMatch[1]}`;
         }
    }
    
    return group.nextSwitchTime;
  };

  const IconLightning = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full overflow-visible">
      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <animate attributeName="stroke-width" values="1.5;2.5;1.5" dur="3s" repeatCount="indefinite" />
        <animate attributeName="filter" values="drop-shadow(0 0 0px currentColor); drop-shadow(0 0 4px currentColor); drop-shadow(0 0 0px currentColor)" dur="3s" repeatCount="indefinite" />
      </path>
    </svg>
  );

  const IconOff = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <path d="M18.36 5.64L5.64 18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <g opacity="0.6">
        <path d="M12 2V4M12 20V22M4 12H2M22 12H20M19.07 19.07L17.66 17.66M4.93 4.93L6.34 6.34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
      </g>
    </svg>
  );

  const IconClock = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
      <line x1="12" y1="12" x2="12" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="6s" repeatCount="indefinite" />
      </line>
      <line x1="12" y1="12" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="60s" repeatCount="indefinite" />
      </line>
    </svg>
  );

  const IconBulb = () => <svg viewBox="0 0 24 24" fill="none" className="w-full h-full"><path d="M9 21h6v-1a1 1 0 00-1-1h-4a1 1 0 00-1 1v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" fill="currentColor"/></svg>;

  if (loading) {
    return (
      <div className="w-full max-w-md flex flex-col gap-3 animate-fade-in">
        <div className="w-full h-40 bg-zinc-900/40 rounded-[2rem] shimmer-wrapper border border-white/5"></div>
        <div className="grid grid-cols-2 gap-3">
             {[1,2,3,4].map(i => <div key={i} className="h-32 bg-zinc-900/40 rounded-[2rem] shimmer-wrapper border border-white/5"></div>)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  let statusColor = "text-yellow-500";
  let mainCardBg = "bg-zinc-900/60";
  let ringColor = "ring-yellow-500/20";
  
  if (data.status === PowerStatus.ON) {
    statusColor = "text-emerald-400";
    mainCardBg = "bg-emerald-900/10";
    ringColor = "ring-emerald-500/20";
  } else if (data.status === PowerStatus.OFF) {
    statusColor = "text-red-500";
    mainCardBg = "bg-red-900/10";
    ringColor = "ring-red-500/20";
  }

  const filteredSources = data.sources.filter(s => sourceFilter === 'ALL' || (sourceFilter === 'TELEGRAM' ? s.uri.includes('t.me') : !s.uri.includes('t.me')));

  return (
    <div className="w-full max-w-md flex flex-col gap-3 animate-slide-up">
      
      <div className="grid grid-cols-3 gap-3">
          <div 
            onClick={() => setShowSummaryModal(true)}
            className={`col-span-2 relative overflow-hidden rounded-[2rem] p-5 border border-white/5 backdrop-blur-xl transition-all active:scale-[0.98] cursor-pointer ${mainCardBg} ring-1 ${ringColor}`}
          >
             <div className="flex flex-col h-full justify-between relative z-10">
                 <div className="flex items-center gap-2 mb-2">
                     <span className={`w-2 h-2 rounded-full ${data.status === PowerStatus.ON ? 'bg-emerald-500' : data.status === PowerStatus.OFF ? 'bg-red-500' : 'bg-yellow-500'} animate-pulse`}></span>
                     <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Стан мережі</span>
                 </div>
                 <div>
                     <h2 className={`text-2xl font-bold leading-tight ${statusColor} mb-1`}>{getStatusText(data.status)}</h2>
                     <p className="text-[11px] text-white/60 line-clamp-2 font-medium leading-relaxed">{data.summary}</p>
                 </div>
             </div>
             <div className="absolute bottom-3 right-3 opacity-20">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
          </div>

          <div 
            onClick={() => setShowWeatherModal(true)}
            className="col-span-1 bg-zinc-900/40 backdrop-blur-xl rounded-[2rem] border border-white/5 p-4 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-all hover:bg-white/5 relative"
          >
             <span className="text-2xl font-bold text-white mb-1">{data.weather.temp}</span>
             <div className="flex items-center justify-center w-8 h-8 my-1">
                 {getWeatherIcon(data.weather.condition)}
             </div>
             <div className="text-[9px] text-white/40 font-bold uppercase truncate max-w-full">
               {data.weather.condition}
             </div>
             <div className="absolute top-2 right-2 opacity-20">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
             </div>
          </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
         {data.groups.map((group, idx) => {
             let groupBg = "bg-zinc-900/40";
             let groupIconColor = "text-yellow-500";
             if (group.status === PowerStatus.ON) { groupBg = "bg-emerald-500/10"; groupIconColor = "text-emerald-400"; }
             else if (group.status === PowerStatus.OFF) { groupBg = "bg-red-500/10"; groupIconColor = "text-red-400"; }
             
             const smartTimeText = getSmartScheduleText(group);

             return (
                 <button
                    key={group.id}
                    onClick={() => setExpandedGroup(group)}
                    className={`${groupBg} border border-white/5 rounded-[2rem] p-5 flex flex-col items-start min-h-[11rem] transition-all active:scale-95 hover:bg-white/5 text-left relative group-card`}
                 >
                    <div className="w-full flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black text-white/30 uppercase">Група {group.id}</span>
                        <div className={`w-5 h-5 ${groupIconColor}`}>
                            {group.status === PowerStatus.ON ? <IconLightning/> : group.status === PowerStatus.OFF ? <IconOff/> : <IconClock/>}
                        </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col w-full">
                        <div className={`text-lg font-bold ${groupIconColor} mb-2 leading-tight`}>{getStatusText(group.status)}</div>
                        
                        {smartTimeText ? (
                            <div className="inline-flex self-start items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-xs text-white font-mono font-bold tracking-tight">{smartTimeText}</span>
                            </div>
                        ) : group.nextSwitchTime ? (
                            <div className="inline-flex self-start items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-xs text-white font-mono">{group.nextSwitchTime}</span>
                            </div>
                        ) : null}
                    </div>

                    <div className="mt-auto pt-4 w-full flex items-center justify-between opacity-30">
                         <div className="flex items-center gap-2">
                             <div className="w-3 h-3"><IconBulb /></div>
                             <span className="text-[9px] font-bold uppercase tracking-wider">Деталі</span>
                         </div>
                    </div>
                 </button>
             )
         })}
      </div>

      <div className="bg-zinc-900/30 rounded-[2rem] border border-white/5 p-5 mt-2">
          <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Джерела</span>
              <div className="flex gap-2">
                  {['ALL', 'TELEGRAM'].map(f => (
                      <button key={f} onClick={() => setSourceFilter(f as any)} className={`text-[9px] font-bold px-2 py-1 rounded-md transition-colors ${sourceFilter === f ? 'bg-white/10 text-white' : 'text-white/30'}`}>{f}</button>
                  ))}
              </div>
          </div>
          <div className="space-y-2">
              {filteredSources.slice(0, 3).map((s, i) => {
                  const official = isOfficialSource(s.uri, s.title);
                  return (
                    <a key={i} href={s.uri} target="_blank" rel="noopener" className="flex items-center justify-between gap-2 group w-full mb-2 last:mb-0">
                        <span className="text-[11px] text-blue-400 group-hover:text-blue-300 truncate font-medium flex-1 transition-all">
                            {s.title}
                        </span>
                        {official && (
                            <span className="shrink-0 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 ml-1" title="Офіційне джерело">
                                <svg className="w-2.5 h-2.5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider">ОФІЦІЙНО</span>
                            </span>
                        )}
                    </a>
                  );
              })}
              {filteredSources.length === 0 && <span className="text-[10px] text-white/20 italic">Джерела відсутні</span>}
          </div>
      </div>

      {(expandedGroup || showSummaryModal || showWeatherModal) && createPortal(
          <div className={`fixed inset-0 z-[150] flex items-center justify-center p-4`}>
              <div 
                  className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`} 
                  onClick={handleClose}
              ></div>
              
              <div className={`relative w-full max-w-sm bg-[#111] border border-white/10 rounded-[2rem] p-6 shadow-2xl ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}`}>
                  
                  {expandedGroup ? (
                      <>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-white">Група {expandedGroup.id}</h2>
                            <button onClick={handleClose} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <p className={`text-xl font-bold mb-4 ${expandedGroup.status === PowerStatus.ON ? 'text-emerald-400' : expandedGroup.status === PowerStatus.OFF ? 'text-red-400' : 'text-yellow-500'}`}>{getStatusText(expandedGroup.status)}</p>
                        
                        {expandedGroup.nextSwitchTime && (
                             <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                                 <span className="block text-xs text-blue-400 font-bold uppercase mb-1">Орієнтовний графік</span>
                                 <span className="text-2xl font-mono text-white tracking-tight">{expandedGroup.nextSwitchTime}</span>
                             </div>
                        )}

                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mb-4">
                            <span className="block text-xs text-white/30 font-bold uppercase mb-2">Деталі</span>
                            <p className="text-white/80 leading-relaxed font-medium text-sm">{expandedGroup.description}</p>
                        </div>
                      </>
                  
                  ) : showSummaryModal && data ? (
                      <>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Звіт по місту</h2>
                             <button onClick={handleClose} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-base leading-relaxed text-zinc-300">{data.summary}</p>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={handleClose} className="bg-white text-black font-bold py-2.5 px-6 rounded-xl text-sm active:scale-95 transition-transform">OK</button>
                        </div>
                      </>

                  ) : showWeatherModal && data ? (
                      <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Погода</h2>
                             <button onClick={handleClose} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex flex-col items-center mb-8">
                            <div className="w-32 h-32 mb-4 animate-fade-in">
                                {getWeatherIcon(data.weather.condition, true)}
                            </div>
                            <span className="text-5xl font-black text-white mb-2">{data.weather.temp}</span>
                            <span className="text-lg text-white/60 capitalize font-medium">{data.weather.condition}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Відчувається</span>
                                <span className="text-xl font-bold text-white">{data.weather.feelsLike}</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Вітер</span>
                                <span className="text-xl font-bold text-white">{data.weather.windSpeed}</span>
                            </div>
                        </div>
                      </>
                  ) : null}
              </div>
          </div>,
          document.body
      )}
    </div>
  );
};

export default StatusDisplay;
