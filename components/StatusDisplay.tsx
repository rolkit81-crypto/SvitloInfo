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
    if (st === PowerStatus.ON) return 'СВІТЛО Є';
    if (st === PowerStatus.OFF) return 'ВІДКЛЮЧЕННЯ';
    if (st === PowerStatus.UNKNOWN) return 'НЕВІДОМО';
    return 'МОЖЛИВІ ВІДКЛЮЧЕННЯ';
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
    if (officialDomains.some(d => normalizedUri.includes(d))) return true;
    return false;
  };

  const getWeatherIcon = (condition: string, large = false) => {
    const c = condition.toLowerCase();
    const sizeClass = large ? "w-32 h-32" : "w-full h-full"; 

    // Storm
    if (c.includes('гроз') || c.includes('storm')) {
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClass} text-purple-400 overflow-visible`}>
           <path d="M48 24C48 15.163 40.837 8 32 8C24.545 8 18.28 13.178 16.49 20.084C16.16 20.026 15.82 20 15.5 20C9.149 20 4 25.149 4 31.5C4 37.851 9.149 43 15.5 43H48.5C54.851 43 60 37.851 60 31.5C60 25.149 54.851 20 48.5 20H48V24Z" fill="#9CA3AF" fillOpacity="0.9"/>
           <path d="M34 32L26 44H34L30 56L42 40H32L34 32Z" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1" strokeLinejoin="round">
             <animate attributeName="opacity" values="0;1;0;0;1;0" dur="2s" repeatCount="indefinite" />
           </path>
        </svg>
      );
    }
    // Sun/Clear
    if (c.includes('ясн') || c.includes('сон') || c.includes('sun')) {
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClass} text-yellow-100 overflow-visible`}>
           <circle cx="32" cy="32" r="14" fill="currentColor" />
           <g stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M32 6V12M32 52V58M58 32H52M12 32H6M50.38 13.62L46.14 17.86M17.86 46.14L13.62 50.38M50.38 50.38L46.14 46.14M17.86 17.86L13.62 13.62"><animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="20s" repeatCount="indefinite" /></path></g>
        </svg>
      );
    }
    // Rain
    if (c.includes('дощ') || c.includes('злив') || c.includes('rain')) {
      return (
        <svg viewBox="0 0 64 64" fill="none" className={`${sizeClass} text-blue-400 overflow-visible`}>
          <path d="M48 24C48 15.163 40.837 8 32 8C24.545 8 18.28 13.178 16.49 20.084C16.16 20.026 15.82 20 15.5 20C9.149 20 4 25.149 4 31.5C4 37.851 9.149 43 15.5 43H48.5C54.851 43 60 37.851 60 31.5C60 25.149 54.851 20 48.5 20H48V24Z" fill="#9CA3AF" fillOpacity="0.8"/>
          <g transform="translate(0, 5)">{[20, 32, 44].map((x, i) => (<rect key={i} x={x} y="42" width="2" height="5" rx="1" fill="currentColor" opacity="0.6"><animate attributeName="y" values="42; 60" dur="0.9s" begin={`${i * 0.25}s`} repeatCount="indefinite" /><animate attributeName="opacity" values="0.8;0" dur="0.9s" begin={`${i * 0.25}s`} repeatCount="indefinite" /></rect>))}</g>
        </svg>
      );
    }
    // Default Cloud
    return (
      <svg viewBox="0 0 64 64" fill="none" className={`${sizeClass} text-blue-200 overflow-visible`}>
         <path d="M48 28C48 19.163 40.837 12 32 12C24.545 12 18.28 17.178 16.49 24.084C16.16 24.026 15.82 24 15.5 24C9.149 24 4 29.149 4 35.5C4 41.851 9.149 47 15.5 47H48.5C54.851 47 60 41.851 60 35.5C60 29.149 54.851 24 48.5 24H48V28Z" fill="currentColor" fillOpacity="0.8"/>
      </svg>
    );
  }

  const getSmartScheduleText = (group: GroupData) => {
    if (!group.nextSwitchTime) return null;
    return group.nextSwitchTime.replace(/[–—]/g, '-');
  };

  const IconLightning = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full overflow-visible text-yellow-400">
      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1">
        <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />
      </path>
    </svg>
  );

  const IconOff = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-red-500">
      <path d="M18.36 5.64L5.64 18.36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    </svg>
  );

  const IconClock = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-blue-200">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
      <line x1="12" y1="12" x2="12" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="12" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  if (loading) {
    return (
      <div className="w-full max-w-md flex flex-col gap-3 animate-fade-in">
        <div className="w-full h-48 bg-blue-900/10 rounded-[2rem] shimmer-wrapper border border-blue-500/20"></div>
        <div className="grid grid-cols-2 gap-3">
             {[1,2,3,4].map(i => <div key={i} className="h-32 bg-blue-900/10 rounded-[2rem] shimmer-wrapper border border-blue-500/20"></div>)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Blue theme base colors
  let statusColor = "text-white"; 
  let mainCardBg = "bg-blue-950/40"; // Blue tint base
  let ringColor = "ring-blue-500/20";
  let borderColor = "border-blue-500/30";
  
  // Specific overrides
  if (data.status === PowerStatus.ON) {
    statusColor = "text-blue-400";
    mainCardBg = "bg-gradient-to-br from-blue-900/40 to-black/60";
    ringColor = "ring-blue-400/30";
  } 
  else if (data.status === PowerStatus.OFF) {
    statusColor = "text-red-500";
    mainCardBg = "bg-gradient-to-br from-red-950/40 to-black/60";
    ringColor = "ring-red-500/30";
    borderColor = "border-red-500/30";
  }

  const filteredSources = data.sources.filter(s => sourceFilter === 'ALL' || (sourceFilter === 'TELEGRAM' ? s.uri.includes('t.me') : !s.uri.includes('t.me')));

  return (
    <div className="w-full max-w-md flex flex-col gap-4 animate-slide-up">
      
      {/* Main Large Status Card */}
      <div 
        onClick={() => setShowSummaryModal(true)}
        className={`w-full relative overflow-hidden rounded-[2.5rem] p-8 border backdrop-blur-xl transition-all active:scale-[0.99] cursor-pointer ${mainCardBg} ${borderColor} ring-1 ${ringColor} shadow-2xl`}
      >
         <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

         <div className="flex flex-col h-full justify-between relative z-10 gap-6 text-center">
             <div className="flex flex-col items-center gap-2">
                 <div className={`w-4 h-4 rounded-full ${data.status === PowerStatus.ON ? 'bg-blue-500 shadow-[0_0_15px_#3b82f6]' : data.status === PowerStatus.OFF ? 'bg-red-500 shadow-[0_0_15px_#ef4444]' : 'bg-blue-300'} animate-pulse`}></div>
                 <span className="text-[10px] font-black text-blue-200/50 uppercase tracking-[0.2em]">Поточний статус</span>
             </div>
             
             <div>
                 <h2 className={`text-5xl sm:text-6xl font-black leading-none tracking-tight ${statusColor} mb-4 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]`}>
                     {getStatusText(data.status)}
                 </h2>
                 <p className="text-sm text-blue-100/80 font-medium leading-relaxed max-w-xs mx-auto line-clamp-3">
                     {data.summary}
                 </p>
             </div>
         </div>
      </div>

      {/* Weather & Info Strip */}
      <div className="flex gap-3 h-24">
          <div 
            onClick={() => setShowWeatherModal(true)}
            className="flex-1 bg-gradient-to-r from-blue-900/20 to-blue-950/20 backdrop-blur-xl rounded-[2rem] border border-blue-500/20 p-4 flex items-center justify-between cursor-pointer active:scale-95 transition-all hover:bg-blue-900/30"
          >
             <div className="flex flex-col justify-center">
                 <span className="text-4xl font-black text-white leading-none tracking-tight">{data.weather.temp}</span>
                 <span className="text-[10px] text-blue-300 font-bold uppercase mt-1 truncate max-w-[80px]">{data.weather.condition}</span>
             </div>
             <div className="w-14 h-14">
                 {getWeatherIcon(data.weather.condition)}
             </div>
          </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
         {data.groups.map((group) => {
             let groupBg = "bg-blue-950/20";
             let groupIconColor = "text-white";
             let groupBorder = "border-blue-500/10";
             
             if (group.status === PowerStatus.ON) { 
                 groupBg = "bg-blue-900/30"; 
                 groupIconColor = "text-blue-400";
                 groupBorder = "border-blue-500/30"; 
             }
             else if (group.status === PowerStatus.OFF) { 
                 groupBg = "bg-red-950/30"; 
                 groupIconColor = "text-red-500"; 
                 groupBorder = "border-red-500/30";
             }
             
             const smartTimeText = getSmartScheduleText(group);

             return (
                 <button
                    key={group.id}
                    onClick={() => setExpandedGroup(group)}
                    className={`${groupBg} border ${groupBorder} rounded-[2rem] p-5 flex flex-col items-start min-h-[10rem] transition-all active:scale-95 hover:bg-blue-900/40 text-left relative overflow-hidden group`}
                 >
                    <div className="w-full flex justify-between items-start mb-3 relative z-10">
                        <span className="text-xs font-black text-blue-200/40 uppercase tracking-wider">Група {group.id}</span>
                        <div className={`w-8 h-8 ${groupIconColor} transition-transform group-hover:scale-110`}>
                            {group.status === PowerStatus.ON ? <IconLightning/> : group.status === PowerStatus.OFF ? <IconOff/> : <IconClock/>}
                        </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col w-full relative z-10">
                        <div className={`text-2xl font-black ${groupIconColor} mb-2 leading-none`}>{group.status === PowerStatus.ON ? 'СВІТЛО Є' : group.status === PowerStatus.OFF ? 'НЕМАЄ' : 'УТОЧНЮЄТЬСЯ'}</div>
                        
                        {smartTimeText ? (
                            <div className="inline-flex self-start items-center px-2 py-1 rounded-md bg-black/30 border border-white/5 backdrop-blur-sm">
                                <span className="text-xs text-white font-mono font-bold tracking-tight">{smartTimeText}</span>
                            </div>
                        ) : null}
                    </div>
                    
                    {/* Hover Glow */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-tr ${group.status === PowerStatus.OFF ? 'from-red-600 to-transparent' : 'from-blue-600 to-transparent'}`}></div>
                 </button>
             )
         })}
      </div>

      <div className="bg-blue-950/20 rounded-[2rem] border border-blue-500/10 p-5 mt-2 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-blue-200/40 uppercase tracking-widest">Джерела</span>
              <div className="flex gap-2">
                  {['ALL', 'TELEGRAM'].map(f => (
                      <button key={f} onClick={() => setSourceFilter(f as any)} className={`text-[9px] font-bold px-2 py-1 rounded-md transition-colors ${sourceFilter === f ? 'bg-blue-500/20 text-blue-200' : 'text-blue-200/30'}`}>{f}</button>
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
                            <span className="shrink-0 flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-2 py-0.5 ml-1" title="Офіційне джерело">
                                <svg className="w-2.5 h-2.5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-wider">ОФІЦІЙНО</span>
                            </span>
                        )}
                    </a>
                  );
              })}
              {filteredSources.length === 0 && <span className="text-[10px] text-blue-200/20 italic">Джерела відсутні</span>}
          </div>
      </div>

      {(expandedGroup || showSummaryModal || showWeatherModal) && createPortal(
          <div className={`fixed inset-0 z-[150] flex items-center justify-center p-4`}>
              <div 
                  className={`absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`} 
                  onClick={handleClose}
              ></div>
              
              <div className={`relative w-full max-w-sm bg-[#0a0a0a] border border-blue-500/20 rounded-[2.5rem] p-6 shadow-2xl shadow-blue-900/20 ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}`}>
                  
                  {expandedGroup ? (
                      <>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-white">Група {expandedGroup.id}</h2>
                            <button onClick={handleClose} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:text-white border border-white/5 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <p className={`text-3xl font-black mb-6 ${expandedGroup.status === PowerStatus.ON ? 'text-blue-400' : expandedGroup.status === PowerStatus.OFF ? 'text-red-500' : 'text-white'}`}>{getStatusText(expandedGroup.status)}</p>
                        
                        {expandedGroup.nextSwitchTime && (
                             <div className={`mb-4 p-5 rounded-3xl border ${expandedGroup.status === PowerStatus.OFF ? 'bg-red-950/20 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                                 <span className={`block text-xs font-bold uppercase mb-1 tracking-wider ${expandedGroup.status === PowerStatus.OFF ? 'text-red-400' : 'text-blue-400'}`}>
                                     {expandedGroup.status === PowerStatus.ON ? "Наступне відключення" : "Увімкнення світла"}
                                 </span>
                                 <span className="text-3xl font-mono text-white tracking-tight">{expandedGroup.nextSwitchTime}</span>
                             </div>
                        )}

                        <div className="bg-blue-900/10 p-5 rounded-3xl border border-blue-500/10 mb-4">
                            <span className="block text-[10px] text-blue-200/40 font-bold uppercase mb-2 tracking-widest">Інформація</span>
                            <p className="text-blue-100/80 leading-relaxed font-medium text-sm whitespace-pre-line">{expandedGroup.description}</p>
                        </div>
                      </>
                  
                  ) : showSummaryModal && data ? (
                      <>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Звіт по місту</h2>
                             <button onClick={handleClose} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:text-white border border-white/5 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="bg-blue-900/10 p-5 rounded-3xl border border-blue-500/10">
                            <p className="text-lg leading-relaxed text-blue-100/90 font-medium">{data.summary}</p>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleClose} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-2xl text-sm active:scale-95 transition-transform shadow-lg shadow-blue-600/20">OK</button>
                        </div>
                      </>

                  ) : showWeatherModal && data ? (
                      <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Погода</h2>
                             <button onClick={handleClose} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:text-white border border-white/5 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex flex-col items-center mb-8">
                            <div className="w-32 h-32 mb-4 animate-fade-in">
                                {getWeatherIcon(data.weather.condition, true)}
                            </div>
                            <span className="text-6xl font-black text-white mb-2 tracking-tight">{data.weather.temp}</span>
                            <span className="text-lg text-blue-200/60 capitalize font-medium">{data.weather.condition}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-900/10 p-4 rounded-2xl border border-blue-500/10 flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] text-blue-200/40 uppercase font-bold tracking-widest mb-1">Відчувається</span>
                                <span className="text-xl font-bold text-white">{data.weather.feelsLike}</span>
                            </div>
                            <div className="bg-blue-900/10 p-4 rounded-2xl border border-blue-500/10 flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] text-blue-200/40 uppercase font-bold tracking-widest mb-1">Вітер</span>
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
