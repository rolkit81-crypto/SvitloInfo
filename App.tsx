import React, { Component, useState, useEffect, useCallback, memo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CITIES, AUTO_REFRESH_INTERVAL } from './constants';
import { OutageInfo, PowerStatus } from './types';
import { fetchOutageInfo } from './services/geminiService';
import CitySelector from './components/CitySelector';
import StatusDisplay from './components/StatusDisplay';
import AdBanner from './components/AdBanner';

interface ErrorBoundaryProps { children?: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState { 
    return { hasError: true }; 
  }

  handleRetry = () => { 
    this.setState({ hasError: false }); 
    window.location.reload(); 
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-md bg-black/60 backdrop-blur-2xl border border-red-500/20 rounded-[2rem] p-8 text-center flex flex-col items-center animate-slide-up shadow-2xl">
          <div className="w-16 h-16 mb-4 text-red-500 bg-red-500/10 rounded-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8"><path d="M12 9V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="18" r="1" fill="currentColor"/><path d="M12 3L2 21H22L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Щось пішло не так</h2>
          <button onClick={this.handleRetry} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 text-sm">Перезавантажити</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MemoizedCitySelector = memo(CitySelector);
const MemoizedStatusDisplay = memo(StatusDisplay);
const MemoizedAdBanner = memo(AdBanner);

const AutoRefreshIndicator: React.FC<{ onRefreshTrigger: () => void; isActive: boolean; }> = ({ onRefreshTrigger, isActive }) => {
  const totalTime = AUTO_REFRESH_INTERVAL / 1000;
  const [timeLeft, setTimeLeft] = useState(totalTime);
  
  useEffect(() => { if (isActive) setTimeLeft(totalTime); }, [isActive, totalTime]);
  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => {
      setTimeLeft(p => { if (p <= 1) { onRefreshTrigger(); return totalTime; } return p - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive, onRefreshTrigger, totalTime]);

  if (!isActive) return null;

  const radius = 6;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / totalTime;
  const dashoffset = circumference * (1 - progress);

  return (
      <div className="flex items-center gap-2 bg-black/80 rounded-full px-2 py-1 border border-zinc-800">
          <div className="relative w-4 h-4 -rotate-90 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r={radius} fill="none" stroke="#27272a" strokeWidth="2" />
                  <circle cx="10" cy="10" r={radius} fill="none" stroke="#3b82f6" strokeWidth="2" className="transition-all duration-1000 ease-linear" strokeDasharray={circumference} strokeDashoffset={dashoffset} strokeLinecap="round" />
              </svg>
          </div>
          <span className="text-[10px] font-mono font-bold text-zinc-500 tabular-nums w-8 text-center">
            {Math.floor(timeLeft / 60)}:{String(Math.floor(timeLeft % 60)).padStart(2, '0')}
          </span>
      </div>
  );
};

const Snowfall = memo(() => {
  const flakes = Array.from({ length: 40 });
  return (
    <div className="fixed inset-0 z-[2] pointer-events-none overflow-hidden" aria-hidden="true">
      {flakes.map((_, i) => {
        const left = `${(i * 100 / 40) + (Math.random() * 5)}%`;
        const duration = `${10 + (i % 10) + Math.random() * 5}s`;
        const delay = `-${Math.random() * 15}s`;
        const size = `${Math.random() * 3 + 2}px`;
        const opacity = Math.random() * 0.4 + 0.3;
        return (
          <div
            key={i}
            className="absolute top-[-15px] bg-white rounded-full animate-snowfall blur-[0.5px]"
            style={{ left, width: size, height: size, opacity, animationDuration: duration, animationDelay: delay }}
          />
        );
      })}
    </div>
  );
});

const FestiveGarland = memo(() => {
  return (
    <div className="fixed top-0 left-0 z-50 pointer-events-none w-64 h-24 mix-blend-screen">
       <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
          {/* Wire */}
          <path d="M-10,0 Q150,50 310,0" fill="none" stroke="#334155" strokeWidth="2" />
          
          {/* Bulbs */}
          {/* 1. Red */}
          <g transform="translate(40, 23)">
             <path d="M0,0 L0,5" stroke="#334155" strokeWidth="2" />
             <circle cx="0" cy="8" r="5" className="fill-red-500 animate-flash-1" />
          </g>
          {/* 2. Blue */}
          <g transform="translate(100, 38)">
             <path d="M0,0 L0,5" stroke="#334155" strokeWidth="2" />
             <circle cx="0" cy="8" r="5" className="fill-blue-500 animate-flash-2" />
          </g>
           {/* 3. Yellow */}
          <g transform="translate(160, 42)">
             <path d="M0,0 L0,5" stroke="#334155" strokeWidth="2" />
             <circle cx="0" cy="8" r="5" className="fill-yellow-500 animate-flash-3" />
          </g>
          {/* 4. Green */}
          <g transform="translate(220, 35)">
             <path d="M0,0 L0,5" stroke="#334155" strokeWidth="2" />
             <circle cx="0" cy="8" r="5" className="fill-green-500 animate-flash-4" />
          </g>
          {/* 5. Red */}
           <g transform="translate(280, 15)">
             <path d="M0,0 L0,5" stroke="#334155" strokeWidth="2" />
             <circle cx="0" cy="8" r="5" className="fill-red-500 animate-flash-1" />
          </g>
       </svg>
    </div>
  );
});

const HawkinsSilhouette = memo(() => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1] pointer-events-none opacity-90 mix-blend-overlay">
       <svg className="w-full h-auto min-h-[150px]" preserveAspectRatio="none" viewBox="0 0 1440 320">
          <defs>
             <linearGradient id="silhouetteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                 <stop offset="0%" stopColor="#020617" stopOpacity="0.8" />
                 <stop offset="100%" stopColor="#000000" stopOpacity="1" />
             </linearGradient>
          </defs>
          <path 
            fill="url(#silhouetteGrad)" 
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            d="M0,320L0,220L40,240L80,180L120,250L160,200L200,260L240,190L280,240L320,160L360,230L400,180L440,250L480,210L520,270L560,190L600,240L640,170L680,230L720,180L760,250L800,200L840,260L880,190L920,240L960,160L1000,230L1040,180L1080,250L1120,200L1160,260L1200,190L1240,240L1280,170L1320,230L1360,180L1400,250L1440,200L1440,320Z"
            className="drop-shadow-[0_-5px_15px_rgba(255,255,255,0.05)]"
          />
       </svg>
    </div>
  );
});

const IntroAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Significantly shortened intro for speed
    const exitTimer = setTimeout(() => {
        setExiting(true);
        setTimeout(onComplete, 500);
    }, 800);

    return () => clearTimeout(exitTimer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-500 ease-in-out ${exiting ? 'opacity-0' : 'opacity-100'}`}>
      <div className="flex flex-col items-center justify-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              Svitlo<span className="text-blue-500">.</span>Info
          </h1>
          <p className="mt-2 text-xs text-blue-500 font-bold uppercase tracking-[0.3em]">Енергетика України</p>
      </div>
    </div>
  );
};

const HomeSkeleton = () => (
    <div className="w-full max-w-md flex flex-col gap-6 animate-pulse">
        {/* City Selector Skeleton */}
        <div className="w-full h-[88px] bg-blue-900/10 rounded-[2rem] border border-blue-500/20 shimmer-wrapper relative overflow-hidden"></div>
        
        {/* Status Display Skeleton */}
        <div className="flex flex-col gap-4 w-full">
            {/* Main Card Skeleton */}
            <div className="w-full h-56 bg-blue-900/10 rounded-[2.5rem] border border-blue-500/20 shimmer-wrapper relative overflow-hidden"></div>
            
            {/* Weather Strip Skeleton */}
            <div className="w-full h-24 bg-blue-900/10 rounded-[2rem] border border-blue-500/20 shimmer-wrapper relative overflow-hidden"></div>

            {/* Groups Grid */}
            <div className="grid grid-cols-2 gap-3 w-full">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-48 bg-blue-900/10 rounded-[2rem] border border-blue-500/20 shimmer-wrapper relative overflow-hidden"></div>
                ))}
            </div>
        </div>
        
        {/* Refresh Button Skeleton */}
        <div className="w-full h-16 bg-blue-900/10 rounded-[1.5rem] border border-blue-500/20 shimmer-wrapper relative overflow-hidden mt-2"></div>
    </div>
);

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'about'>('home');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [outageData, setOutageData] = useState<OutageInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor('#000000'); tg.setBackgroundColor('#000000'); }
    const saved = localStorage.getItem('svitlo_city_id');
    if (saved && CITIES.some(c => c.id === saved)) setSelectedCityId(saved);

    const preloadImage = new Image();
    preloadImage.src = 'https://ad.admitad.com/b/81ij5uqbfl4c128fa66ba76d99edd2/';
  }, []);

  const loadData = useCallback(async (cityId: string) => {
    if (!cityId) return;
    setLoading(true);
    const city = CITIES.find(c => c.id === cityId);
    if (city) setOutageData(await fetchOutageInfo(city.nameUk));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedCityId) {
      localStorage.setItem('svitlo_city_id', selectedCityId);
      loadData(selectedCityId);
    }
  }, [selectedCityId, loadData]);

  const handleCitySelect = useCallback((cityId: string) => {
    setLoading(true); // Instant loading feedback
    setOutageData(null); // Clear data to trigger skeleton
    setSelectedCityId(cityId);
  }, []);

  // Deep Blue / Black / White theme with Red accents for OFF status
  let bgClass = 'from-[#020617] via-black to-black'; // Default Deep Blue to Black
  if (outageData?.status === PowerStatus.ON) bgClass = 'from-blue-950/20 via-black to-black';
  if (outageData?.status === PowerStatus.OFF) bgClass = 'from-red-950/20 via-black to-black'; // Red accent for outage
  if (outageData?.status === PowerStatus.MAYBE) bgClass = 'from-slate-900 via-black to-black';

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col relative font-sans overflow-hidden">
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}
      
      {/* Dynamic Background */}
      <div className={`fixed inset-0 bg-gradient-to-b ${bgClass} transition-colors duration-1000 z-0`}></div>
      
      {/* Festive Elements */}
      <Snowfall />
      <FestiveGarland />
      <HawkinsSilhouette />

      <div className="fixed top-0 left-0 w-full z-40 px-6 py-4 flex justify-end items-center backdrop-blur-md bg-transparent">
          <div className="flex items-center gap-3">
             <a href="https://donatello.to/OneFrameStudio" target="_blank" className="bg-blue-900/10 hover:bg-blue-900/30 border border-blue-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all group backdrop-blur-sm">
                <span className="text-[10px] font-bold text-blue-400 uppercase group-hover:text-blue-300">Підтримати</span>
            </a>
            <a href="https://t.me/SvitloInfo_news" target="_blank" className="bg-zinc-800/40 hover:bg-zinc-700/40 border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold text-zinc-400 hover:text-white transition-all backdrop-blur-sm">Telegram</a>
          </div>
      </div>

      <main className="relative z-10 w-full flex-1 flex flex-col items-center px-4 pt-24 pb-32 max-w-lg mx-auto">
        
        <header className="mb-10 text-center animate-slide-up relative flex flex-col items-center">
            {/* Header */}
            <div className="relative">
                <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-100 to-blue-500 drop-shadow-[0_0_25px_rgba(59,130,246,0.5)] mb-4 relative z-10">
                    Svitlo<span className="text-blue-500">.</span>Info
                </h1>
            </div>
            
            <div className="relative w-full max-w-[320px] flex flex-col items-center gap-2">
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80 shadow-[0_0_10px_#3b82f6]"></div>
                
                <p className="text-[10px] font-bold text-blue-100/90 uppercase tracking-[0.3em] drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] px-2 whitespace-nowrap flex items-center gap-2">
                   <span>❄️</span> Стан енергосистеми <span>❄️</span>
                </p>

                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80 shadow-[0_0_10px_#3b82f6]"></div>
            </div>
        </header>

        {activeTab === 'home' && (
            <div className="w-full flex flex-col items-center gap-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
                <ErrorBoundary>
                    {loading && !outageData ? (
                        <HomeSkeleton />
                    ) : (
                        <>
                            <MemoizedCitySelector selectedCityId={selectedCityId} onSelect={handleCitySelect} disabled={loading} />
                            
                            {!selectedCityId ? (
                                <div className="w-full mt-4 p-8 bg-[#020617]/80 rounded-[2.5rem] border border-blue-500/20 flex flex-col items-center text-center gap-4 backdrop-blur-xl shadow-2xl animate-fade-in relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiAvPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMWU0MGFmIiAvPjwvc3ZnPg==')] opacity-20 pointer-events-none"></div>

                                    <div className="w-20 h-20 bg-gradient-to-br from-black to-blue-950 rounded-full flex items-center justify-center border border-blue-900/40 shadow-[0_0_15px_rgba(59,130,246,0.2)] mb-2 relative overflow-visible">
                                        <div className="absolute inset-0 bg-blue-600/10 blur-xl rounded-full animate-pulse-slow"></div>
                                        <svg className="w-10 h-10 text-blue-500 relative z-10 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
                                        </svg>
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Оберіть ваше місто</h3>
                                        <p className="text-blue-200/60 text-sm font-medium leading-relaxed max-w-[200px] mx-auto">
                                            Щоб отримати актуальний графік відключень, вкажіть вашу локацію.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                <MemoizedStatusDisplay data={outageData} loading={loading && !outageData} cityName={CITIES.find(c=>c.id===selectedCityId)?.nameUk} />
                                
                                <div className="w-full mt-2 animate-slide-up" style={{animationDelay: '0.2s'}}>
                                    <button 
                                        onClick={() => loadData(selectedCityId)} 
                                        disabled={loading}
                                        className="w-full group relative overflow-hidden bg-blue-950/20 border border-blue-500/20 text-white font-bold h-16 rounded-[1.5rem] shadow-lg active:scale-[0.98] transition-all flex items-center justify-between px-6 hover:bg-blue-900/30 hover:border-blue-500/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                    >
                                        <div className="flex flex-col items-start z-10">
                                            <span className="text-base font-extrabold uppercase tracking-wider text-white group-hover:text-blue-400 transition-colors">Оновити дані</span>
                                            <span className="text-[10px] text-blue-200/50 font-medium group-hover:text-blue-200/70">Синхронізація з мережею</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 z-10">
                                            {loading ? (
                                                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                                            ) : (
                                                <AutoRefreshIndicator onRefreshTrigger={() => loadData(selectedCityId)} isActive={true} />
                                            )}
                                        </div>
                                    </button>
                                    <p className="text-center text-[9px] text-blue-200/40 mt-3 font-mono">
                                        Останнє оновлення: {outageData ? new Date(outageData.lastUpdated).toLocaleTimeString() : '--:--'}
                                    </p>
                                </div>
                                </>
                            )}
                        </>
                    )}
                    
                    <div className="w-full">
                       <MemoizedAdBanner />
                    </div>

                </ErrorBoundary>
            </div>
        )}

        {activeTab === 'about' && (
            <div className="w-full animate-slide-up">
                <div className="bg-[#020617]/80 backdrop-blur-2xl border border-blue-500/20 rounded-[2.5rem] p-8 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent pointer-events-none"></div>
                    <div className="mb-6 flex justify-center relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-950 to-black rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20 text-blue-500 border border-blue-500/20">
                            <svg className="w-8 h-8 drop-shadow-[0_0_5px_blue]" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z"/></svg>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Svitlo Info</h2>
                    <p className="text-blue-500/60 text-xs font-bold uppercase tracking-widest mb-6 relative z-10">VERSION 1.4 GLOBAL</p>
                    
                    <div className="space-y-6 text-blue-100/60 text-sm leading-relaxed font-medium relative z-10">
                        <p>Моніторинг енергосистеми України в реальному часі на базі AI.</p>
                        <p>Зимовий моніторинг стабільності мережі.</p>
                        <div className="p-4 bg-blue-900/10 rounded-xl border border-blue-500/10">
                             <p className="text-xs text-blue-200/50">Дані носять інформаційний характер. Завжди перевіряйте першоджерела.</p>
                        </div>
                        
                        <div className="pt-8 border-t border-blue-500/10 mt-8 flex flex-col items-center gap-4">
                             <span className="text-[10px] text-blue-200/40 uppercase tracking-[0.3em] font-bold">Розробка</span>
                             <div className="group relative flex items-center justify-center gap-4 px-8 py-5 bg-black rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden transition-all hover:border-blue-900/50">
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-transparent to-purple-900/20 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                                
                                <div className="relative z-10 w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 border border-white/20 group-hover:scale-110 transition-all duration-500 overflow-hidden">
                                    <div className="absolute inset-0 bg-black/10"></div>
                                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-black/20 flex justify-between px-1">
                                        {[...Array(4)].map((_,i) => <div key={`t${i}`} className="w-1 h-full bg-white/20 rounded-full"></div>)}
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20 flex justify-between px-1">
                                         {[...Array(4)].map((_,i) => <div key={`b${i}`} className="w-1 h-full bg-white/20 rounded-full"></div>)}
                                    </div>
                                    <span className="font-serif text-2xl font-black text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)] italic relative z-10">1F</span>
                                </div>
                                <div className="flex flex-col items-start relative z-10">
                                     <span className="text-base font-extrabold text-zinc-200 tracking-tight group-hover:text-white transition-colors">OneFrame Studio</span>
                                     <span className="text-[9px] text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400 font-bold uppercase tracking-widest">Цифрові Рішення</span>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-auto">
        <div className="relative bg-[#020617]/90 backdrop-blur-xl border border-blue-500/20 rounded-full p-2 flex shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            <div 
                className="absolute top-2 bottom-2 bg-blue-900/40 rounded-full transition-all duration-500 cubic-bezier(0.25, 0.8, 0.25, 1) border border-blue-500/20"
                style={{ 
                    left: activeTab === 'home' ? '8px' : 'calc(50% + 4px)',
                    width: 'calc(50% - 12px)',
                    boxShadow: activeTab === 'home' ? '0 0 10px rgba(59, 130, 246, 0.2)' : 'none'
                }}
            ></div>

            <button onClick={() => setActiveTab('home')} className={`relative z-10 w-28 py-3 rounded-full transition-colors duration-300 ${activeTab === 'home' ? 'text-white' : 'text-blue-200/50 hover:text-blue-100'}`}>
                <span className="text-xs font-bold uppercase tracking-wider">Головна</span>
            </button>
            <button onClick={() => setActiveTab('about')} className={`relative z-10 w-28 py-3 rounded-full transition-colors duration-300 ${activeTab === 'about' ? 'text-white' : 'text-blue-200/50 hover:text-blue-100'}`}>
                <span className="text-xs font-bold uppercase tracking-wider">Інфо</span>
            </button>
        </div>
      </div>
      
      {loading && outageData && createPortal(
          <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
              <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(59,130,246,0.4)]"></div>
              <p className="text-blue-500 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Оновлення...</p>
          </div>,
          document.body
      )}
    </div>
  );
};
export default App;
