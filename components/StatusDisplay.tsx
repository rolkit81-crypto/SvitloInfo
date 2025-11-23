import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PowerStatus, OutageInfo, GroupData } from '../types';

interface StatusDisplayProps {
  data: OutageInfo | null;
  loading: boolean;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ data, loading }) => {
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'TELEGRAM' | 'WEB'>('ALL');
  const [expandedGroup, setExpandedGroup] = useState<GroupData | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const loadingMessages = ["З'єднання...", "Пошук даних...", "Аналіз...", "Оновлення..."];

  useEffect(() => {
    if (loading) {
        const interval = setInterval(() => {
            setLoadingMsgIndex(i => (i + 1) % loadingMessages.length);
        }, 800);
        return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    if (expandedGroup || showSummaryModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [expandedGroup, showSummaryModal]);

  // --- SVG ICONS V2.0 ---
  const IconLightning = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const IconOff = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">
        <path d="M18.36 5.64L5.64 18.36M12 2V4M12 20V22M4 12H2M22 12H20M19.07 19.07L17.66 17.66M4.93 4.93L6.34 6.34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );

  const IconClock = () => (
     <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
     </svg>
  );

  // --- ANIMATED WEATHER ICONS ---
  const WeatherIcon = ({ condition }: { condition: string }) => {
    const c = condition.toLowerCase();
    
    // Rain
    if (c.includes('rain') || c.includes('дощ')) {
        return (
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]">
                 <path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse-slow"/>
                 <path d="M8 19v2M12 20v2M16 19v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-bounce" style={{animationDuration: '1.5s'}}/>
            </svg>
        );
    }
    // Snow
    if (c.includes('snow') || c.includes('сніг')) {
        return (
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-[spin_8s_linear_infinite]">
                 <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                 <circle cx="12" cy="12" r="2" fill="currentColor"/>
            </svg>
        );
    }
    // Clouds
    if (c.includes('cloud') || c.includes('хмар')) {
        return (
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-zinc-400 drop-shadow-lg animate-pulse-slow">
                 <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        );
    }
    // Clear/Sun (Default)
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] animate-[spin_12s_linear_infinite]">
             <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
             <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    );
  };

  // --- LOADING SKELETON (SHIMMER) ---
  if (loading) {
    return (
      <div className="w-full max-w-md flex flex-col gap-4">
        {/* Header Skeleton */}
        <div className="w-full h-48 bg-zinc-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shimmer-wrapper relative flex flex-col items-center justify-center gap-4">
             <div className="w-16 h-16 rounded-full border-4 border-zinc-800 border-t-yellow-500 animate-spin"></div>
             <p className="text-zinc-500 text-xs font-black uppercase tracking-widest animate-pulse">
                {loadingMessages[loadingMsgIndex]}
             </p>
        </div>
        {/* Grid Skeleton */}
        <div className="grid grid-cols-2 gap-3">
             {[1,2,3,4,5,6].map(i => (
                 <div key={i} className="h-32 bg-zinc-900/50 rounded-3xl border border-white/5 shimmer-wrapper"></div>
             ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  // --- FILTER SOURCES ---
  const filteredSources = data.sources.filter(s => {
    if (sourceFilter === 'ALL') return true;
    const isTelegram = s.uri.includes('t.me') || s.title.toLowerCase().includes('telegram');
    return sourceFilter === 'TELEGRAM' ? isTelegram : !isTelegram;
  });

  // --- DYNAMIC STATUS COLORS ---
  let statusColor = "text-yellow-500";
  let statusGlow = "shadow-[0_0_40px_rgba(234,179,8,0.2)]";
  let statusBorder = "border-yellow-500/20";
  
  if (data.status === PowerStatus.ON) {
    statusColor = "text-green-500";
    statusGlow = "shadow-[0_0_40px_rgba(34,197,94,0.3)]";
    statusBorder = "border-green-500/30";
  } else if (data.status === PowerStatus.OFF) {
    statusColor = "text-red-500";
    statusGlow = "shadow-[0_0_40px_rgba(239,68,68,0.3)]";
    statusBorder = "border-red-500/30";
  }

  // --- MODAL COLOR LOGIC ---
  const getModalGradient = (st: PowerStatus) => {
    if (st === PowerStatus.ON) return 'from-green-900 via-black to-black';
    if (st === PowerStatus.OFF) return 'from-red-900 via-black to-black';
    return 'from-yellow-900 via-black to-black';
  };

  const getStatusText = (st: PowerStatus) => {
    if (st === PowerStatus.ON) return 'СВІТЛО Є';
    if (st === PowerStatus.OFF) return 'ВІДКЛЮЧЕННЯ';
    if (st === PowerStatus.UNKNOWN) return 'ПОМИЛКА';
    return 'МОЖЛИВІ ВІДКЛЮЧЕННЯ';
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-6 animate-slide-right">
      
      {/* WEATHER WIDGET */}
      <div className="w-full bg-zinc-900/40 backdrop-blur-md rounded-3xl p-4 border border-white/5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
              <WeatherIcon condition={data.weather.condition} />
              <div>
                  <div className="text-2xl font-black text-white">{data.weather.temp}</div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{data.weather.condition}</div>
              </div>
          </div>
          <div className="flex flex-col items-end gap-1">
              <div className="text-[10px] text-zinc-500 font-bold uppercase">Відчувається</div>
              <div className="text-xs font-bold text-white">{data.weather.feelsLike}</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Вітер</div>
              <div className="text-xs font-bold text-white">{data.weather.windSpeed}</div>
          </div>
      </div>

      {/* MAIN STATUS CARD */}
      <div 
        onClick={() => setShowSummaryModal(true)}
        className={`w-full bg-zinc-900/60 backdrop-blur-xl rounded-[2.5rem] p-8 border ${statusBorder} relative overflow-hidden transition-all duration-500 active:scale-[0.98] cursor-pointer group ${statusGlow}`}
      >
        <div className="absolute top-0 right-0 p-6 opacity-50 group-hover:opacity-100 transition-opacity">
            <svg className="w-6 h-6 text-white/20 group-hover:text-white/50" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke="currentColor" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
        </div>

        <div className="flex flex-col items-start gap-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${data.status === PowerStatus.ON ? 'bg-green-500' : data.status === PowerStatus.OFF ? 'bg-red-500' : 'bg-yellow-500'} animate-ping`}></span>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Загальний стан</span>
          </div>
          
          <h2 className={`text-4xl font-black ${statusColor} tracking-tighter leading-none animate-slide-left`}>
            {getStatusText(data.status)}
          </h2>
          
          <p className="text-zinc-400 text-sm font-medium leading-relaxed line-clamp-2">
            {data.summary}
          </p>

          <button className="mt-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors flex items-center gap-1">
             Читати повністю <span>→</span>
          </button>
        </div>

        {/* Last Updated */}
        <div className="mt-8 pt-4 border-t border-white/5 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
             <p className="text-[10px] font-mono text-zinc-600">
                Оновлено: {new Date(data.lastUpdated).toLocaleTimeString('uk-UA', {hour: '2-digit', minute:'2-digit'})}
             </p>
        </div>
      </div>

      {/* SUMMARY MODAL (Portal) */}
      {showSummaryModal && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-dropdown">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                onClick={() => setShowSummaryModal(false)}
            ></div>
            
            {/* Content */}
            <div className={`relative w-full max-w-lg bg-gradient-to-b ${getModalGradient(data.status)} rounded-[3rem] p-8 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]`}>
                
                <button 
                    onClick={() => setShowSummaryModal(false)}
                    className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all z-20"
                >
                    ✕
                </button>

                <div className="w-20 h-20 mb-6 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 shadow-inner">
                    <div className={`w-10 h-10 ${statusColor}`}>
                        {data.status === PowerStatus.ON ? <IconLightning/> : data.status === PowerStatus.OFF ? <IconOff/> : <IconClock/>}
                    </div>
                </div>

                <h3 className="text-3xl font-black text-white mb-6 leading-tight">
                    Ситуація в місті
                </h3>

                <div className="overflow-y-auto custom-scrollbar pr-2">
                    <p className="text-zinc-300 text-lg leading-relaxed font-medium">
                        {data.summary}
                    </p>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                    <p className="text-center text-xs text-zinc-500 font-bold uppercase tracking-widest">
                        Svitlo.Info Analysis
                    </p>
                </div>
            </div>
        </div>,
        document.body
      )}

      {/* GROUP STATUS GRID */}
      <div className="grid grid-cols-2 gap-3" key={data.lastUpdated}>
        {data.groups.map((group, index) => {
             const isEven = index % 2 === 0;
             let cardBg = "bg-zinc-900/60 border-zinc-800/50";
             let iconColor = "text-yellow-500";
             let statusTxt = "text-yellow-500";
             
             if (group.status === PowerStatus.ON) {
                 cardBg = "bg-green-900/20 border-green-500/20";
                 iconColor = "text-green-400";
                 statusTxt = "text-green-400";
             } else if (group.status === PowerStatus.OFF) {
                 cardBg = "bg-red-900/20 border-red-500/20";
                 iconColor = "text-red-400";
                 statusTxt = "text-red-400";
             }

             return (
                 <div 
                    key={group.id}
                    onClick={() => setExpandedGroup(group)}
                    className={`
                        relative h-36 rounded-3xl p-5 flex flex-col justify-between cursor-pointer 
                        transition-all duration-500 hover:scale-[1.05] active:scale-[0.95] hover:shadow-xl
                        border backdrop-blur-md group overflow-hidden will-change-transform
                        ${cardBg}
                        ${isEven ? 'animate-slide-left' : 'animate-slide-right'}
                    `}
                    style={{ animationDelay: `${index * 100}ms` }}
                 >
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                            Група {group.id}
                        </span>
                        <div className={`w-6 h-6 ${iconColor} transition-transform duration-500 group-hover:rotate-12`}>
                            {group.status === PowerStatus.ON ? <IconLightning/> : group.status === PowerStatus.OFF ? <IconOff/> : <IconClock/>}
                        </div>
                    </div>
                    
                    <div>
                        <div className={`text-lg font-black ${statusTxt} uppercase tracking-tight`}>
                            {getStatusText(group.status)}
                        </div>
                        {group.status === PowerStatus.MAYBE && (
                             <div className="text-[10px] text-zinc-500 truncate mt-1 font-medium">
                                 Натисніть для деталей
                             </div>
                        )}
                    </div>
                 </div>
             );
        })}
      </div>

      {/* GROUP DETAIL MODAL (Portal) */}
      {expandedGroup && createPortal(
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-dropdown">
              <div 
                  className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                  onClick={() => setExpandedGroup(null)}
              ></div>
              
              <div className={`relative w-full max-w-lg bg-gradient-to-b ${getModalGradient(expandedGroup.status)} rounded-[3rem] p-8 border border-white/10 shadow-2xl flex flex-col`}>
                  
                  <button 
                      onClick={() => setExpandedGroup(null)}
                      className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all z-20"
                  >
                      ✕
                  </button>

                  <div className="w-16 h-16 mb-4 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                      <span className="text-2xl font-black text-white">
                          {expandedGroup.id}
                      </span>
                  </div>

                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.4em] mb-2">
                      Статус Групи
                  </h3>
                  
                  <h2 className={`text-4xl font-black ${expandedGroup.status === PowerStatus.ON ? 'text-green-400' : expandedGroup.status === PowerStatus.OFF ? 'text-red-400' : 'text-yellow-400'} mb-6`}>
                      {getStatusText(expandedGroup.status)}
                  </h2>

                  <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                      <p className="text-lg text-white font-medium leading-relaxed">
                          {expandedGroup.description}
                      </p>
                  </div>
              </div>
          </div>,
          document.body
      )}

      {/* SOURCES SECTION */}
      <div className="w-full mt-4">
          <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Джерела Даних</span>
               <div className="flex gap-2">
                   {['ALL', 'TELEGRAM', 'WEB'].map((filter) => (
                       <button
                           key={filter}
                           onClick={() => setSourceFilter(filter as any)}
                           className={`px-3 py-1 rounded-full text-[9px] font-bold transition-all ${sourceFilter === filter ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                       >
                           {filter}
                       </button>
                   ))}
               </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
              {filteredSources.map((source, idx) => (
                  <a 
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-zinc-800 transition-colors max-w-full"
                  >
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                          {source.uri.includes('t.me') ? (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-2.02-1.23-2.02-1.23-.63-.44-.27-1 .26-1.55.13-.13 2.37-2.18 2.42-2.36.01-.02.01-.1-.04-.15-.05-.05-.13-.03-.19-.01-.26.08-4.22 2.72-4.4 2.82-.5.28-1 .42-1.42.41-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.36-.48.98-.74 3.84-1.68 6.4-2.79 7.68-3.33 3.65-1.53 4.41-1.79 4.9-1.8.11 0 .35.03.51.16.13.11.17.26.19.43 0 .02.01.03.01.09z"/></svg>
                          ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                          )}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-bold text-zinc-300 truncate w-full">{source.title}</span>
                          <span className="text-[9px] text-zinc-600 truncate w-full">{new URL(source.uri).hostname}</span>
                      </div>
                  </a>
              ))}
              {filteredSources.length === 0 && (
                  <div className="w-full text-center py-4 text-zinc-600 text-xs italic">
                      Джерела не знайдено для цього фільтру
                  </div>
              )}
          </div>
      </div>

    </div>
  );
};

export default StatusDisplay;
