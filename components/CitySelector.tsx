import React, { useState, useRef, useEffect } from 'react';
import { CITIES } from '../constants';
import { City } from '../types';

interface CitySelectorProps {
  selectedCityId: string;
  onSelect: (cityId: string) => void;
  disabled: boolean;
}

const CitySelector: React.FC<CitySelectorProps> = ({ selectedCityId, onSelect, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCity = CITIES.find(c => c.id === selectedCityId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (cityId: string) => {
    onSelect(cityId);
    setIsOpen(false);
  };

  return (
    <div className="w-full max-w-md mb-8 z-50 relative" ref={dropdownRef}>
      {/* Centered Label */}
      <div className="text-center mb-3">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
          Оберіть місто
        </label>
      </div>
      
      <div className="relative group">
        {/* Soft Glow behind the input */}
        <div className={`absolute -inset-0.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-[2rem] blur transition duration-700 ${isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
        
        {/* Trigger Button */}
        <button
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className="relative w-full flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-[2rem] py-4 pl-6 pr-6 shadow-xl hover:border-zinc-700 transition-all duration-300 active:scale-[0.98] text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
             <div className="flex items-center gap-3 overflow-hidden">
                <div className={`text-yellow-500 transition-transform duration-300 ${isOpen ? 'scale-110' : ''}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <span className={`font-bold text-lg truncate ${selectedCity ? 'text-white' : 'text-zinc-500'}`}>
                    {selectedCity ? selectedCity.nameUk : 'Ваша локація...'}
                </span>
            </div>

            <div className={`text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : ''}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </button>

        {/* Custom Dropdown Menu */}
        {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-[1.5rem] shadow-2xl overflow-hidden z-50 max-h-80 flex flex-col animate-dropdown">
                <div className="overflow-y-auto p-2 custom-scrollbar">
                    {CITIES.map((city) => (
                        <button
                            key={city.id}
                            onClick={() => handleSelect(city.id)}
                            className={`w-full text-left px-5 py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-between mb-2 last:mb-0 group
                                ${selectedCityId === city.id 
                                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-[0_0_25px_rgba(234,179,8,0.4)] scale-[1.02] ring-1 ring-yellow-300 z-10' 
                                    : 'text-zinc-400 hover:text-white hover:bg-white/10 hover:pl-7 hover:scale-[1.02] hover:shadow-md border border-transparent hover:border-white/5'
                                }`
                            }
                        >
                            <span className="relative z-10">{city.nameUk}</span>
                            {selectedCityId === city.id && (
                                <svg className="w-5 h-5 text-black drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default CitySelector;
