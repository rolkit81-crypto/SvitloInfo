import React, { useState, useRef, useEffect } from 'react';
import { PowerStatus, OutageInfo, GroupData } from '../types';

interface StatusDisplayProps {
  data: OutageInfo | null;
  loading: boolean;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ data, loading }) => {
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'TELEGRAM' | 'WEB'>('ALL');
  const [viewMode, setViewMode] = useState<'STATUS' | 'SCHEDULE'>('STATUS');
  const [expandedGroup, setExpandedGroup] = useState<GroupData | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  // Loading State Logic
  const [loadingStage, setLoadingStage] = useState(0);
  const loadingMessages = [
    "З'єднання з сервером...",
    "Пошук офіційних джерел...",
    "Аналіз графіків Обленерго...",
    "Формування звіту...",
    "Фіналізація даних..."
  ];

  useEffect(() => {
    if (loading) {
        setLoadingStage(0);
        const interval = setInterval(() => {
            setLoadingStage((prev) => (prev + 1) % loadingMessages.length);
        }, 1500); 
        return () => clearInterval(interval);
    }
  }, [loading]);

  // Swipe Handlers
  const touchStartRef = useRef<number>(0);
  const touchEndRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    
    const distance = touchStartRef.current - touchEndRef.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && viewMode === 'STATUS') {
      setViewMode('SCHEDULE');
    }
    if (isRightSwipe && viewMode === 'SCHEDULE') {
      setViewMode('STATUS');
    }

    // Reset
    touchStartRef.current = 0;
    touchEndRef.current = 0;
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedGroup(null);
        setShowSummaryModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // LOADING STATE
  if (loading) {
    return (
      <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl rounded-[2.5rem] p-12 border border-zinc-800 flex flex-col items-center justify-center text-center min-h-[400px] animate-pulse-slow">
        <div className="relative w-24 h-24 mb-10">
            <div className="absolute inset-0 rounded-full border-4 border-zinc-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-yellow-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-10 h-10 text-yellow-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
            </div>
        </div>
        <h3 className="text-xl font-black text-white mb-3 tracking-tight">
            {loadingMessages[loadingStage]}
        </h3>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            ШІ обробляє дані в реальному часі
        </p>
      </div>
    );
  }

  // EMPTY STATE
  if (!data) {
    return (
      <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl rounded-[2.5rem] p-10 border border-zinc-800 flex flex-col items-center text-center transition-colors">
        <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-6 text-zinc-500">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-zinc-400 font-bold text-xl">Оберіть своє місто</p>
        <p className="text-zinc-600 mt-2 text-sm">Ми покажемо актуальні графіки по групах</p>
      </div>
    );
  }

  // HELPER: Render individual group card
  const renderGroupCard = (group: GroupData, index: number) => {
    // STATUS VIEW STYLES (Default)
    let bgClass = 'bg-zinc-900 border-zinc-800 text-zinc-300';
    let statusIcon = '⚪';
    let statusLabel = 'Невідомо';
    
    if (group.status === PowerStatus.ON) {
        bgClass = 'bg-gradient-to-br from-green-500 to-emerald-700 border-green-400 text-white';
        statusIcon = '⚡';
        statusLabel = 'СВІТЛО Є';
    } else if (group.status === PowerStatus.OFF) {
        bgClass = 'bg-gradient-to-br from-red-900/40 to-zinc-950 border-red-900/50 text-red-100 shadow-[0_0_15px_rgba(127,29,29,0.2)]';
        statusIcon = '🌑';
        statusLabel = 'СВІТЛА НЕМАЄ';
    } else if (group.status === PowerStatus.MAYBE) {
        bgClass = 'bg-zinc-900 text-yellow-500 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]';
        statusIcon = '⚠️'; 
        statusLabel = 'МОЖЛИВІ'; 
    }

    // ANIMATION
    const animationClass = index % 2 === 0 ? 'animate-slide-left' : 'animate-slide-right';
    const style: React.CSSProperties = { 
      animationDelay: `${index * 100}ms`,
      opacity: 0 
    };

    return (
        <div 
            key={`${group.id}-${viewMode}`} 
            style={style}
            onClick={() => setExpandedGroup(group)}
            className={`relative p-5 rounded-3xl border ${bgClass} flex flex-col gap-2 justify-between transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl active:scale-95 shadow-lg cursor-pointer ${animationClass} min-h-[120px]`}
        >
            <div className="flex justify-between items-start">
                <span className={`text-sm font-black uppercase tracking-wider ${group.status === PowerStatus.ON ? 'text-white/80' : 'opacity-70'}`}>
                  Група {group.id}
                </span>
                
                {viewMode === 'SCHEDULE' && (
                   <span className="text-lg">{statusIcon}</span>
                )}
            </div>

            {viewMode === 'STATUS' ? (
                // STATUS VIEW
                <div className="mt-2">
                     <span className="text-4xl block mb-2 filter drop-shadow-md">{statusIcon}</span>
                     <div className="font-black text-lg leading-tight flex items-center gap-2">
                        <span className="break-words uppercase tracking-tight">{statusLabel}</span>
                    </div>
                </div>
            ) : (
                // SCHEDULE VIEW
                <div className="mt-1 flex flex-col justify-end h-full">
                     <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${group.status === PowerStatus.ON ? 'text-white/60' : 'text-zinc-500'}`}>
                        Графік
                     </p>
                     <div className={`text-base font-bold leading-tight whitespace-normal break-words ${group.status === PowerStatus.ON ? 'text-white' : 'text-zinc-300'}`}>
                        {group.description}
                     </div>
                </div>
            )}
        </div>
    );
  };

  // HEADER LOGIC (For Main Card)
  let headerText = 'СИТУАЦІЯ';
  let statusColor = 'bg-yellow-500';
  let glowColor = 'bg-yellow-500/10';
  
  if (data.status === PowerStatus.ON) {
      headerText = 'СВІТЛО Є';
      statusColor = 'bg-green-500';
      glowColor = 'bg-green-500/20';
  } else if (data.status === PowerStatus.OFF) {
      headerText = 'БЛЕКАУТ';
      statusColor = 'bg-red-500';
      glowColor = 'bg-red-500/20';
  } else {
      headerText = 'ГРАФІКИ';
      statusColor = 'bg-yellow-500';
      glowColor = 'bg-yellow-500/10';
  }

  // EXPANDED GROUP MODAL LOGIC
  let expandedGradient = 'from-zinc-800 to-black';
  let expandedIcon = '⚪';
  let expandedLabel = 'Невідомо';
  let expandedTextClass = 'text-white';

  if (expandedGroup) {
    if (expandedGroup.status === PowerStatus.ON) {
        expandedGradient = 'from-green-600 via-emerald-800 to-black';
        expandedIcon = '⚡';
        expandedLabel = 'СВІТЛО Є';
        expandedTextClass = 'text-green-100';
    } else if (expandedGroup.status === PowerStatus.OFF) {
        expandedGradient = 'from-red-700 via-red-950 to-black';
        expandedIcon = '🌑';
        expandedLabel = 'СВІТЛА НЕМАЄ';
        expandedTextClass = 'text-red-100';
    } else if (expandedGroup.status === PowerStatus.MAYBE) {
        expandedGradient = 'from-yellow-600 via-yellow-900 to-black';
        expandedIcon = '⚠️';
        expandedLabel = 'МОЖЛИВІ';
        expandedTextClass = 'text-yellow-100';
    }
  }

  return (
    <div className="w-full max-w-md flex flex-col gap-6 transition-colors pb-6">
      
      {/* Main Status Header Card */}
      <div 
        className="group w-full bg-zinc-900/80 backdrop-blur-md rounded-[2.5rem] p-8 border border-zinc-800 relative overflow-hidden animate-slide-left shadow-2xl cursor-pointer active:scale-[0.98] transition-all" 
        style={{ animationDelay: '0ms' }}
        onClick={() => setShowSummaryModal(true)}
      >
        <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-1000 ${glowColor} group-hover:opacity-100 opacity-50`}></div>
        
        <h2 className="text-zinc-500 text-xs font-black tracking-[0.2em] uppercase mb-4 flex items-center gap-2 relative z-10">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusColor}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${statusColor}`}></span>
            </span>
            Загальний стан
        </h2>
        
        <h1 key={data.status} className="text-4xl font-black text-white mb-4 tracking-tight animate-slide-left relative z-10 drop-shadow-lg">
            {headerText}
        </h1>
        
        <div className="relative z-10">
            <p className="text-zinc-400 text-sm font-bold leading-relaxed mb-2 line-clamp-2">
                {data.summary}
            </p>
            <button 
                className="flex items-center gap-1 text-yellow-500 text-xs font-black uppercase tracking-widest hover:text-yellow-400 transition-colors"
            >
                <span>Читати повністю</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 border-t border-zinc-800 pt-4 mt-4 relative z-10">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Оновлено: {new Date(data.lastUpdated).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* FULL SUMMARY MODAL */}
      {showSummaryModal && (
         <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 animate-cinematic-in">
            <div 
                className="absolute inset-0 bg-black/90 backdrop-blur-xl transition-opacity"
                onClick={() => setShowSummaryModal(false)}
            ></div>

            <div className="relative w-full max-w-sm bg-gradient-to-b from-zinc-800 to-black rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
                 <button 
                    onClick={() => setShowSummaryModal(false)}
                    className="absolute top-6 right-6 z-20 w-10 h-10 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-8 overflow-y-auto custom-scrollbar">
                     <h2 className="text-sm font-black tracking-[0.2em] uppercase text-yellow-500 mb-4">
                        Детальний звіт
                     </h2>
                     <div className="prose prose-invert prose-sm leading-relaxed text-zinc-200 font-medium">
                        {data.summary}
                     </div>
                </div>
            </div>
         </div>
      )}

      {/* EXPANDED GROUP MODAL */}
      {expandedGroup && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 animate-cinematic-in">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/90 backdrop-blur-xl transition-opacity"
                onClick={() => setExpandedGroup(null)}
            ></div>
            
            {/* Modal Content */}
            <div className={`relative w-full max-w-sm bg-gradient-to-b ${expandedGradient} rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col`}>
                
                {/* Close Button */}
                <button 
                    onClick={() => setExpandedGroup(null)}
                    className="absolute top-6 right-6 z-20 w-10 h-10 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-10 flex flex-col items-center text-center relative">
                     {/* Header */}
                     <h2 className="text-sm font-black tracking-[0.3em] uppercase text-white/60 mb-6 border-b border-white/10 pb-2">
                        Група {expandedGroup.id}
                     </h2>

                     {/* Big Icon */}
                     <div className="text-8xl mb-6 filter drop-shadow-2xl animate-pulse-slow">
                        {expandedIcon}
                     </div>

                     {/* Status Text */}
                     <h1 className="text-4xl font-black text-white mb-8 tracking-tight leading-none drop-shadow-lg uppercase">
                        {expandedLabel}
                     </h1>

                     {/* Info Box */}
                     <div className="w-full bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/5">
                         <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                            Деталі / Години
                         </p>
                         <p className={`text-xl font-bold leading-relaxed ${expandedTextClass}`}>
                            {expandedGroup.description}
                         </p>
                     </div>
                </div>
            </div>
        </div>
      )}

      {/* VIEW TOGGLE (SEGMENTED CONTROL) */}
      {data.groups.length > 0 && (
          <div className="flex bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 relative z-20 w-full max-w-[200px] mx-auto shadow-inner">
              <button 
                onClick={() => setViewMode('STATUS')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${viewMode === 'STATUS' ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Статус
              </button>
              <button 
                onClick={() => setViewMode('SCHEDULE')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${viewMode === 'SCHEDULE' ? 'bg-yellow-500 text-black shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Графік
              </button>
          </div>
      )}

      {/* SWIPE HINT */}
      {data.groups.length > 0 && (
          <div className="flex justify-center items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-widest opacity-60">
             <svg className="w-3 h-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
             </svg>
             <span>Свайп для зміни</span>
             <svg className="w-3 h-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
             </svg>
          </div>
      )}

      {/* Groups Grid with Swipe Handlers */}
      {data.groups.length > 0 && (
         <div 
            className="grid grid-cols-2 gap-3 relative min-h-[200px]" 
            key={data.lastUpdated}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
         >
             {data.groups.map((group, index) => renderGroupCard(group, index))}
         </div>
      )}

      {/* Sources Section */}
      {data.sources.length > 0 && (
          <div className="w-full flex flex-col items-center gap-4 mt-4 pt-4 border-t border-zinc-800/50 transition-all">
              <div className="flex items-center justify-between w-full px-4">
                  <div className="flex items-center gap-2 text-zinc-600 opacity-70">
                    <span className="text-[10px] font-black uppercase tracking-widest">Джерела</span>
                  </div>

                  <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                      <button 
                        onClick={() => setSourceFilter('ALL')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${sourceFilter === 'ALL' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        ВСІ
                      </button>
                       <button 
                        onClick={() => setSourceFilter('TELEGRAM')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${sourceFilter === 'TELEGRAM' ? 'bg-[#229ED9] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        TG
                      </button>
                       <button 
                        onClick={() => setSourceFilter('WEB')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${sourceFilter === 'WEB' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        WEB
                      </button>
                  </div>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center px-2 w-full min-h-[40px]">
                {data.sources
                    .filter(s => {
                        const isTg = s.uri.includes('t.me') || s.title.toLowerCase().includes('telegram');
                        if (sourceFilter === 'TELEGRAM') return isTg;
                        if (sourceFilter === 'WEB') return !isTg;
                        return true;
                    })
                    .map((source, idx) => {
                        const isTg = source.uri.includes('t.me') || source.title.toLowerCase().includes('telegram');
                        return (
                          <a 
                            key={idx} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group text-[10px] font-bold bg-black text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 px-3 py-2 rounded-xl transition-all truncate max-w-[140px] flex items-center gap-2 animate-slide-left"
                            style={{ animationDelay: `${idx * 50}ms` }}
                          >
                            {isTg ? (
                                <svg className="w-3 h-3 text-[#229ED9] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.119.098.152.228.166.33.016.117.025.342.016.525z"/>
                                </svg>
                            ) : (
                                <svg className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                                </svg>
                            )}
                            <span className="truncate">{source.title}</span>
                          </a>
                        );
                    })}
              </div>
          </div>
        )}
    </div>
  );
};

export default StatusDisplay;
