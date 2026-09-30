import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, MapPin, Landmark, Compass, GraduationCap, Train, Navigation } from 'lucide-react';
import { PlaceSearchResult } from '../../../types/memaps';
import { searchPlaces } from '../../../core/memaps-services';

interface MeMapsSearchBoxProps {
  onSelectPlace: (place: PlaceSearchResult) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

export const MeMapsSearchBox: React.FC<MeMapsSearchBoxProps> = ({
  onSelectPlace,
  onClear,
  placeholder = 'ค้นหาหมุดรังวัด, แลนด์มาร์ก, มหาวิทยาลัย หรือสถานที่...',
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Categories filter
  const categories = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'survey', label: '📐 หมุดรังวัด RTSD' },
    { id: 'university', label: '🎓 สถาบันการศึกษา' },
    { id: 'landmark', label: '🏛️ แลนด์มาร์ก' },
    { id: 'station', label: '🚆 สถานี/ขนส่ง' }
  ];

  // Perform debounced search
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchPlaces(query, controller.signal);
        setResults(res);
        setSelectedIndex(-1);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Search query error', err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredResults = activeCategory === 'all'
    ? results
    : results.filter(r => r.category === activeCategory);

  const handleSelect = (place: PlaceSearchResult) => {
    setQuery(place.name);
    setIsOpen(false);
    onSelectPlace(place);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredResults.length) {
        handleSelect(filteredResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getCategoryIcon = (category: PlaceSearchResult['category']) => {
    switch (category) {
      case 'survey':
        return <Compass className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
      case 'university':
        return <GraduationCap className="w-4 h-4 text-blue-500 flex-shrink-0" />;
      case 'landmark':
        return <Landmark className="w-4 h-4 text-amber-500 flex-shrink-0" />;
      case 'station':
        return <Train className="w-4 h-4 text-purple-500 flex-shrink-0" />;
      default:
        return <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />;
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Bar */}
      <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
        <div className="pl-3.5 pr-2 text-slate-400 flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full py-2.5 pr-8 text-xs sm:text-sm bg-transparent border-0 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
        />

        {query && (
          <button
            onClick={() => {
              setQuery('');
              onClear?.();
              setIsOpen(false);
            }}
            className="p-1.5 mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition"
            title="ล้างข้อความ"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick Category Chips */}
      <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Autocomplete Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-h-72 overflow-y-auto">
          {filteredResults.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              {isLoading ? 'กำลังค้นหาพิกัด...' : 'ไม่พบสถานที่ที่ตรงกับคำค้น'}
            </div>
          ) : (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {query ? 'ผลการค้นหา' : 'สถานที่และหมุดอ้างอิงแนะนำ'}
              </div>
              {filteredResults.map((place, idx) => (
                <button
                  key={place.id}
                  onClick={() => handleSelect(place)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition-colors ${
                    selectedIndex === idx
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="mt-0.5">{getCategoryIcon(place.category)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate flex items-center justify-between">
                      <span>{place.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-1.5">
                        {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                      </span>
                    </div>
                    {place.description && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {place.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
