
import React, { useState, useRef, useEffect } from 'react';
import { CITIES } from '../constants';

interface CitySelectorProps {
  selectedCityId: string;
  onSelect: (cityId: string) => void;
  disabled: boolean;
}

const CitySelector: React.FC<CitySelectorProps> = ({ selectedCityId, onSelect, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedCity = CITIES.find(c => c.id === selectedCityId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (cityId: string) => {
    onSelect(cityId);
    setIsOpen(false);
  };

  // Generic Location Pin Icon (Beacon)
  const LocationPinIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  return (
    <div className="w-full max-w-md relative z-50" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full relative overflow-hidden bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-[2rem] py-5 px-6 flex items-center justify-between transition-all duration-300 active:scale-[0.98] ${isOpen ? 'ring-2 ring-yellow-500/50 border-transparent' : 'hover:border-white/20'}`}
      >
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shrink-0 ${selectedCity ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-white/10 text-white/40'}`}>
                <LocationPinIcon className="w-6 h-6" />
            </div>
            <div className="text-left">
                <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest mb-0.5">Локація</span>
                <span className={`block text-lg font-bold truncate max-w-[160px] ${selectedCity ? 'text-white' : 'text-white/50'}`}>
                    {selectedCity ? selectedCity.nameUk : 'Оберіть місто...'}
                </span>
            </div>
        </div>
        <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-white/10 text-white' : ''}`}>
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden max-h-[60vh] flex flex-col animate-slide-up">
            <div className="p-2 overflow-y-auto custom-scrollbar">
                {CITIES.map((city) => {
                    const isSelected = selectedCityId === city.id;
                    return (
                        <button
                            key={city.id}
                            onClick={() => handleSelect(city.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all mb-1 group ${isSelected ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-black/10 text-black' : 'bg-white/5 text-zinc-500 group-hover:bg-white/10 group-hover:text-white'}`}>
                                    <LocationPinIcon className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-base">{city.nameUk}</span>
                            </div>
                            {isSelected && <div className="bg-black/10 rounded-full p-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>}
                        </button>
                    );
                })}
            </div>
        </div>
      )}
    </div>
  );
};

export default CitySelector;
