
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

  // --- EMPTY STATE ---
  if (!data) {
    return (
      <div className="w-full max-w-md bg-zinc-900/30 backdrop-blur-md rounded-[2.5rem] p-10 border border-white/5 flex flex-col items-center text-center">
        <p className="text-zinc-400 font-bold text-xl">Оберіть місто</p>
      </div>
    );
  }

  // --- FILTER SOURCES ---
  const filteredSources = data.sources.filter(s => {
      if (sourceFilter === 'ALL') return true;
      if (sourceFilter === 'TELEGRAM') return s.uri.includes('t.me');
      if (sourceFilter === 'WEB') return !s.uri.includes('t.me');
      return true;
  });

  // --- RENDER GROUP ---
  const renderGroupCard = (group: GroupData, index: number) => {
    let bgClass = '';
    let iconComponent = <IconClock />;
    let statusLabel = 'НЕВІДОМО';
    
    if (group.status === PowerStatus.ON) {
        bgClass = 'bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20';
        iconComponent = <IconLightning />;
        statusLabel = 'СВІТЛО Є';
    } else if (group.status === PowerStatus.OFF) {
        bgClass = 'bg-red-600/10 border-red-600/30 text-red-500 hover:bg-red-600/20';
        iconComponent = <IconOff />;
        statusLabel = 'НЕМАЄ';
    } else {
        bgClass = 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20';
        iconComponent = <IconClock />;
        statusLabel = 'МОЖЛИВІ'; 
    }

    return (
        <div 
            key={`${group.id}`} 
            onClick={() => setExpandedGroup(group)}
            className={`relative p-5 rounded-3xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 active:scale-95 cursor-pointer animate-slide-left will-change-transform ${bgClass}`}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <span className="text-[10px] font-black uppercase opacity-60 relative z-10">Група {group.id}</span>
            <div className="w-10 h-10 relative z-10">{iconComponent}</div>
            <span className="font-black text-xs uppercase tracking-tight relative z-10">{statusLabel}</span>
            
            {group.status === PowerStatus.MAYBE && (
               <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-yellow-500 animate-pulse z-10"></div>
            )}
        </div>
    );
  };

  // --- HEADER LOGIC ---
  let headerText = 'ГРАФІКИ';
  let statusGradient = 'from-yellow-500/20 to-yellow-900/20';
  let statusText = 'text-yellow-500';
  let mainShadow = 'shadow-[0_20px_60px_-15px_rgba(234,179,8,0.3)]';
  
  if (data.status === PowerStatus.ON) {
      headerText = 'СВІТЛО Є';
      statusGradient = 'from-green-600/30 to-green-900/30';
      statusText = 'text-green-500';
      mainShadow = 'shadow-[0_20px_60px_-15px_rgba(34,197,94,0.3)]';
  } else if (data.status === PowerStatus.OFF) {
      headerText = 'БЛЕКАУТ';
      statusGradient = 'from-red-600/30 to-red-900/30';
      statusText = 'text-red-500';
      mainShadow = 'shadow-[0_20px_60px_-15px_rgba(239,68,68,0.3)]';
  } else if (data.status === PowerStatus.UNKNOWN) {
      headerText = 'ПОМИЛКА';
      statusGradient = 'from-zinc-500/20 to-zinc-900/20';
      statusText = 'text-zinc-500';
      mainShadow = 'shadow-2xl';
  }

  return (
    <div className="w-full max-w-md flex flex-col gap-6 pb-6">
      
      {/* Main Card */}
      <div 
        className={`w-full bg-gradient-to-br ${statusGradient} backdrop-blur-2xl backdrop-saturate-150 rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden ${mainShadow} animate-slide-left cursor-pointer active:scale-[0.98] transition-all`}
        onClick={() => setShowSummaryModal(true)}
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-[2.5rem] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
            <div className={`mb-4 px-3 py-1 rounded-full border border-white/10 bg-black/20 backdrop-blur-md ${statusText} text-[10px] font-black uppercase tracking-[0.2em]`}>
                ЗАГАЛЬНИЙ СТАН
            </div>
            <h1 className="text-5xl font-black text-white mb-4 tracking-tighter drop-shadow-2xl">{headerText}</h1>
            <p className="text-zinc-200 text-sm font-medium line-clamp-2 leading-relaxed max-w-[90%] drop-shadow-md">
                {data.summary}
            </p>
            <div className="mt-4 text-xs font-bold text-white/40 uppercase tracking-widest">
                Натисніть для деталей
            </div>
        </div>
      </div>

      {/* Weather Compact Widget */}
      {data.groups.length > 0 && (
         <div className="w-full bg-black/40 backdrop-blur-xl backdrop-saturate-150 border border-white/5 rounded-3xl p-4 flex items-center justify-between animate-dropdown shadow-lg">
            <div className="flex items-center gap-3">
                <WeatherIcon condition={data.weather.condition} />
                <div>
                    <div className="text-2xl font-black text-white leading-none">{data.weather.temp}</div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase">{data.weather.condition}</div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-xs text-zinc-400 font-bold">Відчувається: <span className="text-white">{data.weather.feelsLike}</span></div>
                <div className="text-xs text-zinc-400 font-bold">Вітер: <span className="text-white">{data.weather.windSpeed}</span></div>
            </div>
         </div>
      )}

      {/* Groups Grid */}
      {data.groups.length > 0 && (
         <div className="grid grid-cols-2 gap-3 relative" key={data.lastUpdated}>
             {data.groups.map((group, index) => renderGroupCard(group, index))}
         </div>
      )}

      {/* Sources Buttons & List */}
      {data.sources.length > 0 && (
          <div className="flex flex-col items-center gap-3 mt-4 w-full">
               {/* Filter Tabs */}
               <div className="flex justify-center gap-2 w-full">
                   {['ALL', 'TELEGRAM', 'WEB'].map((filter) => (
                       <button 
                         key={filter}
                         onClick={() => setSourceFilter(filter as any)}
                         className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border ${sourceFilter === filter ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-black/40 text-zinc-500 border-white/5 hover:bg-white/10'}`}
                       >
                         {filter === 'ALL' ? 'ВСІ' : filter}
                       </button>
                   ))}
               </div>
               
               {/* Source Links List - Improved Wrapping */}
               <div className="flex flex-wrap justify-center gap-2 w-full px-2">
                    {filteredSources.map((source, i) => (
                        <a 
                            key={i} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-zinc-400 hover:text-white transition-all truncate max-w-[150px] text-center"
                        >
                            {source.title.replace(/(https?:\/\/)?(www\.)?/, '').split('/')[0]}
                        </a>
                    ))}
                    {filteredSources.length === 0 && (
                        <span className="text-[10px] text-zinc-600">Немає джерел у цій категорії</span>
                    )}
               </div>
          </div>
      )}

      {/* --- MODALS (Using Portal for z-index fix) --- */}
      {showSummaryModal && createPortal(
         <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 animate-cinematic-in">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setShowSummaryModal(false)}></div>
            <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[3rem] p-8 shadow-2xl flex flex-col max-h-[70vh]">
                 <button onClick={() => setShowSummaryModal(false)} className="absolute top-5 right-5 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white">✕</button>
                 <h2 className="text-xs font-black text-yellow-500 uppercase tracking-widest mb-4">Детальний Звіт</h2>
                 <div className="overflow-y-auto custom-scrollbar prose prose-invert prose-sm text-zinc-300 font-medium">
                    {data.summary}
                 </div>
            </div>
         </div>,
         document.body
      )}

      {expandedGroup && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 animate-cinematic-in">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setExpandedGroup(null)}></div>
            <div className={`relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl flex flex-col items-center text-center`}>
                <button onClick={() => setExpandedGroup(null)} className="absolute top-5 right-5 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white">✕</button>
                <div className="mb-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Група {expandedGroup.id}</div>
                <div className="w-24 h-24 mb-6">
                    {expandedGroup.status === PowerStatus.ON ? <IconLightning/> : expandedGroup.status === PowerStatus.OFF ? <IconOff/> : <IconClock/>}
                </div>
                <div className="text-3xl font-black text-white mb-6 uppercase">
                    {expandedGroup.status === PowerStatus.ON ? 'Світло Є' : expandedGroup.status === PowerStatus.OFF ? 'Світла Немає' : 'Можливі Відключення'}
                </div>
                <div className="w-full bg-white/5 rounded-2xl p-6 border border-white/5">
                    <p className="text-lg font-bold text-white">{expandedGroup.description}</p>
                </div>
            </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default StatusDisplay;
