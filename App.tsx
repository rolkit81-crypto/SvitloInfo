
import React, { useState, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { CITIES, AUTO_REFRESH_INTERVAL } from './constants';
import { OutageInfo, PowerStatus } from './types';
import { fetchOutageInfo } from './services/geminiService';
import CitySelector from './components/CitySelector';
import StatusDisplay from './components/StatusDisplay';

// --- ERROR BOUNDARY COMPONENT ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-red-500/20 rounded-[2.5rem] p-10 text-center flex flex-col items-center animate-slide-left shadow-2xl">
          <div className="w-20 h-20 mb-6 text-red-500 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
              <path d="M12 9V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="18" r="1" fill="currentColor"/>
              <path d="M12 3L2 21H22L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Щось пішло не так</h2>
          <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
            Виникла неочікувана помилка при відображенні інтерфейсу. Ми вже працюємо над цим.
          </p>
          <button
            onClick={this.handleRetry}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-900/20 active:scale-95 transition-all uppercase tracking-widest text-xs"
          >
            Перезавантажити
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const MemoizedCitySelector = memo(CitySelector);
const MemoizedStatusDisplay = memo(StatusDisplay);

const AutoRefreshTimer: React.FC<{ onRefreshTrigger: () => void; isActive: boolean; }> = ({ onRefreshTrigger, isActive }) => {
  const [timeLeft, setTimeLeft] = useState(AUTO_REFRESH_INTERVAL / 1000);
  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { onRefreshTrigger(); return AUTO_REFRESH_INTERVAL / 1000; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive, onRefreshTrigger]);
  if (!isActive) return null;
  return <div className="text-[10px] text-zinc-600 font-bold mt-2">Оновлення через {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>;
};

const IntroAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [stage, setStage] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setStage('hold'), 800);
    const t2 = setTimeout(() => setStage('out'), 1800);
    const t3 = setTimeout(onComplete, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center cursor-pointer transition-opacity duration-500 ${stage === 'out' ? 'opacity-0' : 'opacity-100'}`}
      onClick={onComplete}
    >
      <div className={`flex flex-col items-center ${stage === 'in' ? 'animate-cinematic-in' : stage === 'out' ? 'animate-cinematic-out' : ''}`}>
        <div className="w-20 h-20 mb-6 relative">
             <div className="absolute inset-0 bg-yellow-500 rounded-full blur-[40px] opacity-40 animate-pulse"></div>
             <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-yellow-500 relative z-10">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" />
             </svg>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter">
          Svitlo<span className="text-yellow-500">.</span>Info
        </h1>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em] mt-2">
            Loading System
        </p>
      </div>
    </div>
  );
};

// --- ICONS FOR NAV BAR ---
const IconHome = ({ active, colorClass }: { active: boolean, colorClass: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={`w-6 h-6 transition-all duration-500 ${active ? `${colorClass} scale-110 drop-shadow-md` : 'text-zinc-500 scale-100'}`}>
    <path d="M3 9.5L12 3L21 9.5V20.5C21 21.0523 20.5523 21.5 20 21.5H4C3.44772 21.5 3 21.0523 3 20.5V9.5Z" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"/>
    {active && <path d="M12 14L12 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>}
  </svg>
);

const IconAbout = ({ active, colorClass }: { active: boolean, colorClass: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={`w-6 h-6 transition-all duration-500 ${active ? `${colorClass} scale-110 drop-shadow-md` : 'text-zinc-500 scale-100'}`}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={active ? 2.5 : 2}/>
    <path d="M12 16V12" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round"/>
    <path d="M12 8H12.01" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round"/>
  </svg>
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

  let bgGradient1 = 'bg-blue-900/20';
  let bgGradient2 = 'bg-yellow-900/10';
  
  // Navigation Bar Colors based on status
  let navPillColor = 'bg-zinc-800/80 border-white/10';
  let navIconColor = 'text-yellow-500';

  if (outageData?.status === PowerStatus.ON) {
      bgGradient1 = 'bg-emerald-900/30';
      bgGradient2 = 'bg-green-600/10';
      navPillColor = 'bg-green-900/80 border-green-500/30';
      navIconColor = 'text-green-400';
  } else if (outageData?.status === PowerStatus.OFF) {
      bgGradient1 = 'bg-red-900/30';
      bgGradient2 = 'bg-orange-900/10';
      navPillColor = 'bg-red-900/80 border-red-500/30';
      navIconColor = 'text-red-400';
  } else if (outageData?.status === PowerStatus.MAYBE) {
      // Keep default yellow for maybe/unknown
      navPillColor = 'bg-yellow-900/80 border-yellow-500/30';
      navIconColor = 'text-yellow-400';
  }

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col relative overflow-x-hidden selection:bg-yellow-500 selection:text-black font-sans">
      
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}

      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-colors duration-1000">
          <div className={`absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] animate-aurora mix-blend-screen transition-colors duration-1000 ${bgGradient1}`}></div>
          <div className={`absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[80px] animate-aurora mix-blend-screen transition-colors duration-1000 ${bgGradient2}`} style={{animationDelay: '-5s'}}></div>
      </div>

      {/* TOP HEADER (Support Buttons) */}
      <div className="fixed top-0 left-0 w-full z-40 p-4 flex justify-end gap-2 pointer-events-auto bg-gradient-to-b from-black/80 to-transparent">
          <a href="https://t.me/SvitloInfo_news" target="_blank" className="bg-zinc-900/80 border border-white/10 px-3 py-1.5 rounded-full text-[9px] font-black uppercase text-blue-400 hover:bg-blue-900/20 transition-all backdrop-blur-md">
              Офіційний Канал
          </a>
          <a href="https://donatello.to/OneFrameStudio" target="_blank" className="bg-zinc-900/80 border border-white/10 px-3 py-1.5 rounded-full text-[9px] font-black uppercase text-yellow-500 hover:bg-yellow-900/20 transition-all backdrop-blur-md">
              Підтримати
          </a>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center px-5 pt-20 pb-32 max-w-lg mx-auto">
        
        {/* LOGO */}
        <header className="mb-6 text-center">
            <h1 className="text-5xl font-black tracking-tighter mb-1 select-none">
                Svitlo<span className="text-yellow-500">.</span>Info
            </h1>
        </header>

        {/* --- VIEW: HOME --- */}
        {activeTab === 'home' && (
            <div className="w-full flex flex-col items-center animate-slide-left">
                <ErrorBoundary>
                    <MemoizedCitySelector selectedCityId={selectedCityId} onSelect={setSelectedCityId} disabled={loading} />
                    
                    <MemoizedStatusDisplay data={outageData} loading={loading && !outageData} />

                    {selectedCityId && (
                        <div className="w-full mt-6 flex flex-col gap-3">
                            <button 
                                onClick={() => loadData(selectedCityId)} disabled={loading}
                                className="w-full bg-white text-black font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 hover:bg-zinc-200"
                            >
                                {loading ? <span className="animate-spin">↻</span> : <span>ОНОВИТИ ДАНІ</span>}
                            </button>
                            <div className="text-center"><AutoRefreshTimer onRefreshTrigger={() => loadData(selectedCityId)} isActive={!loading} /></div>
                        </div>
                    )}
                </ErrorBoundary>
            </div>
        )}

        {/* --- VIEW: ABOUT --- */}
        {activeTab === 'about' && (
            <div className="w-full animate-slide-right">
                <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 text-center">
                    <h2 className="text-2xl font-black text-white mb-6">Про Svitlo Info</h2>
                    <div className="space-y-6">
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Svitlo Info — це інструмент для моніторингу відключень електроенергії в Україні в реальному часі.
                        </p>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Ми використовуємо штучний інтелект Google Gemini для пошуку та аналізу офіційних джерел Обленерго, щоб надати вам найточнішу інформацію.
                        </p>
                        <div className="p-4 bg-white/5 rounded-2xl">
                             <p className="text-zinc-500 text-xs italic">
                                Дані носять інформаційний характер. Завжди перевіряйте офіційні джерела.
                            </p>
                        </div>
                        
                        <div className="pt-8 border-t border-white/5 mt-8">
                             <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Design & Dev</p>
                             <p className="text-sm font-black text-white uppercase tracking-widest mt-2">OneFrameStudio</p>
                             <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest mt-1">Version 1.2 global</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>

      {/* FLOATING BOTTOM NAVIGATION BAR (PREMIUM ISLAND V2) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[240px]">
        <div className="relative bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 flex items-center justify-between shadow-2xl shadow-black/50 overflow-hidden">
            
            {/* The Sliding Pill (Active Background) */}
            <div 
                className={`absolute top-1.5 bottom-1.5 rounded-full border shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${navPillColor} ${activeTab === 'home' ? 'left-1.5 w-[calc(50%-4px)]' : 'left-[calc(50%+2px)] w-[calc(50%-4px)]'}`}
            ></div>

            {/* Home Button */}
            <button 
                onClick={() => setActiveTab('home')}
                className="relative z-10 flex items-center justify-center gap-2 h-10 w-1/2 rounded-full transition-all duration-300 active:scale-90"
            >
                <IconHome active={activeTab === 'home'} colorClass={navIconColor} />
                <span className={`text-[10px] font-black uppercase tracking-wider transition-all duration-500 overflow-hidden ${activeTab === 'home' ? 'max-w-xs opacity-100 ml-1 text-white' : 'max-w-0 opacity-0 ml-0 text-zinc-500'}`}>
                    Головна
                </span>
            </button>

            {/* About Button */}
            <button 
                onClick={() => setActiveTab('about')}
                className="relative z-10 flex items-center justify-center gap-2 h-10 w-1/2 rounded-full transition-all duration-300 active:scale-90"
            >
                 <IconAbout active={activeTab === 'about'} colorClass={navIconColor} />
                 <span className={`text-[10px] font-black uppercase tracking-wider transition-all duration-500 overflow-hidden ${activeTab === 'about' ? 'max-w-xs opacity-100 ml-1 text-white' : 'max-w-0 opacity-0 ml-0 text-zinc-500'}`}>
                    Інфо
                </span>
            </button>

        </div>
      </div>

      {/* REFRESH LOADING OVERLAY */}
      {loading && outageData && createPortal(
          <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-500 animate-cinematic-in">
              <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full border-4 border-white/5 border-t-yellow-500 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <svg className="w-8 h-8 text-yellow-500 animate-pulse" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                     </svg>
                  </div>
              </div>
              <p className="text-yellow-500 font-black text-sm uppercase tracking-[0.4em] animate-pulse">
                  Оновлення Даних
              </p>
          </div>,
          document.body
      )}
    </div>
  );
};

export default App;
