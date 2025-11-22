import React, { useState, useEffect, useCallback } from 'react';
import { CITIES, AUTO_REFRESH_INTERVAL } from './constants';
import { OutageInfo } from './types';
import { fetchOutageInfo } from './services/geminiService';
import CitySelector from './components/CitySelector';
import StatusDisplay from './components/StatusDisplay';

// --- Intro Animation Component ---
const IntroAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 1. Start exit animation after 800ms
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 800);
    
    // 2. Complete and unmount after total 1300ms
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1300);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, []); // Empty dependency array ensures this runs ONLY ONCE on mount

  return (
    <div 
      onClick={onComplete} // Allow user to tap to skip immediately
      className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center cursor-pointer`}
    >
      {/* Container handles the exit animation (fade out/zoom) */}
      <div className={`flex flex-col items-center ${isExiting ? 'animate-cinematic-out' : 'animate-cinematic-in'}`}>
         <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-yellow-500/10"></div>
               <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
               </svg>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter">
              Svitlo<span className="text-yellow-500">.</span>Info
            </h1>
         </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [outageData, setOutageData] = useState<OutageInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showIntro, setShowIntro] = useState<boolean>(true);
  
  // Initialize Telegram Mini App features
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand(); // Open full height
      
      // Set the Telegram header color to match our black theme
      if (tg.setHeaderColor) {
        tg.setHeaderColor('#000000');
      }
      if (tg.setBackgroundColor) {
        tg.setBackgroundColor('#000000');
      }
    }
  }, []);
  
  // Stable callback to prevent re-renders from resetting the intro logic
  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);
  
  const loadData = useCallback(async (cityId: string) => {
    if (!cityId) return;
    
    setLoading(true);
    const city = CITIES.find(c => c.id === cityId);
    if (city) {
      const data = await fetchOutageInfo(city.nameUk);
      setOutageData(data);
    }
    setLoading(false);
    // Reset countdown for auto-refresh
    setCountdown(AUTO_REFRESH_INTERVAL / 1000);
  }, []);

  // Initialize from Local Storage
  useEffect(() => {
    const savedCity = localStorage.getItem('svitlo_city_id');
    if (savedCity && CITIES.some(c => c.id === savedCity)) {
      setSelectedCityId(savedCity);
    }
  }, []);

  // Effect to trigger load when city changes (and save to storage)
  useEffect(() => {
    if (selectedCityId) {
      localStorage.setItem('svitlo_city_id', selectedCityId);
      loadData(selectedCityId);
      setCountdown(AUTO_REFRESH_INTERVAL / 1000);
    }
  }, [selectedCityId, loadData]);

  // Timer for auto-refresh logic
  useEffect(() => {
    if (!selectedCityId) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (typeof prev === 'number' && prev <= 1) {
          loadData(selectedCityId);
          return AUTO_REFRESH_INTERVAL / 1000;
        }
        return (prev !== null && prev > 0) ? prev - 1 : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedCityId, loadData]);

  // Handle manual refresh
  const handleRefresh = () => {
    if (selectedCityId && !loading) {
      loadData(selectedCityId);
    }
  };

  const formatCountdown = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center relative selection:bg-yellow-500 selection:text-black overflow-x-hidden">
      
      {/* Intro Splash Screen */}
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}

      {/* Background Mesh Gradient Effect */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-yellow-600/20 rounded-full blur-[120px]"></div>
      </div>

      <div className={`relative z-10 w-full max-w-lg flex flex-col items-center px-4 py-12 transition-all duration-1000 delay-300 ${showIntro ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
            Svitlo<span className="text-yellow-500">.</span>Info
          </h1>
          <p className="text-zinc-500 font-medium">Дізнайся про відключення у своєму місті</p>
        </header>

        <main className="w-full flex flex-col items-center">
          <CitySelector 
            selectedCityId={selectedCityId} 
            onSelect={setSelectedCityId}
            disabled={loading}
          />

          <StatusDisplay data={outageData} loading={loading} />

          {selectedCityId && (
            <div className="mt-8 w-full px-6 flex flex-col items-center gap-4 animate-slide-left" style={{ animationDelay: '0.2s' }}>
               <button 
                 onClick={handleRefresh}
                 disabled={loading}
                 className="group w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-yellow-500/30 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100"
               >
                 <svg className={`w-5 h-5 text-yellow-500 transition-transform duration-700 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
                 <span>{loading ? 'Оновлюємо дані...' : 'Перевірити зараз'}</span>
               </button>
               
               <span className="text-zinc-600 text-xs font-medium bg-black px-3 py-1 rounded-full border border-zinc-900">
                 Автооновлення через {formatCountdown(countdown)}
               </span>
            </div>
          )}

          <div className="mt-16 text-center px-8 pb-8">
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold mb-2">Про сервіс</p>
            <p className="text-zinc-700 text-xs leading-relaxed max-w-xs mx-auto">
              Дані генеруються ШІ на основі відкритих джерел (сайти Обленерго, новини). Можливі неточності. Перевіряйте офіційні канали.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
