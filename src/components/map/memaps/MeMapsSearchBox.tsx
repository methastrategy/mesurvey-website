import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, MapPin, Landmark, Compass, GraduationCap, Train, Navigation, Menu } from 'lucide-react';
import { PlaceSearchResult } from '../../../types/memaps';
import { searchPlaces } from '../../../core/memaps-services';

interface MeMapsSearchBoxProps {
  onSelectPlace: (place: PlaceSearchResult) => void;
  onClear?: () => void;
  onToggleMenu?: () => void;
  isMenuOpen?: boolean;
  placeholder?: string;
  className?: string;
  isUnifiedWithFlyout?: boolean;
  onFocusInput?: () => void;
  onSearchStateChange?: (state: {
    query: string;
    results: PlaceSearchResult[];
    isLoading: boolean;
    setQuery: (q: string) => void;
    triggerFullSearch: (q?: string) => Promise<void>;
  }) => void;
}

export const MeMapsSearchBox: React.FC<MeMapsSearchBoxProps> = ({
  onSelectPlace,
  onClear,
  onToggleMenu,
  isMenuOpen = false,
  placeholder = 'ค้นหาสถานที่ต่างๆ...',
  className = '',
  isUnifiedWithFlyout = false,
  onFocusInput,
  onSearchStateChange
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

  const triggerFullSearch = async (targetQuery = query) => {
    const trimmed = targetQuery.trim();
    if (!trimmed) return;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);
    try {
      const res = await searchPlaces(trimmed, controller.signal, { allowRemote: true });
      setResults(res);
      setIsOpen(true);
      if (res.length > 0) {
        setSelectedIndex(0);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Submit search error', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Perform debounced LOCAL search on typing (no network spam)
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchPlaces(query, controller.signal, { allowRemote: false });
        setResults(res);
        setSelectedIndex(-1);
        onSearchStateChange?.({
          query,
          results: res,
          isLoading: false,
          setQuery,
          triggerFullSearch
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Search query error', err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Sync state on query/results/loading changes
  useEffect(() => {
    onSearchStateChange?.({
      query,
      results,
      isLoading,
      setQuery,
      triggerFullSearch
    });
  }, [query, results, isLoading]);

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
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerFullSearch(query);
      }
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
      } else {
        triggerFullSearch(query);
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
      <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl transition-all">
        {onToggleMenu && (
          <button
            type="button"
            onClick={onToggleMenu}
            aria-label="เปิดเมนูเครื่องมือแผนที่"
            title="เปิดเมนูเครื่องมือแผนที่ & เลเยอร์"
            className={`pl-3 pr-1 py-2 transition-all duration-150 ease-spring hover:scale-110 active:scale-90 flex items-center justify-center cursor-pointer ${
              isMenuOpen
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => triggerFullSearch(query)}
          aria-label="ค้นหาพิกัดหรือสถานที่"
          className={`${onToggleMenu ? 'pl-1.5' : 'pl-3.5'} pr-2 text-slate-400 hover:text-blue-500 transition-all duration-150 ease-spring hover:scale-110 active:scale-90 flex items-center justify-center cursor-pointer`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </button>

        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
            onFocusInput?.();
          }}
          onFocus={() => {
            setIsOpen(true);
            onFocusInput?.();
          }}
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
            className="p-1.5 mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-all duration-150 ease-spring hover:scale-110 active:scale-90"
            title="ล้างข้อความ"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Results Dropdown (Shown only when not unified with external flyout panel) */}
      {!isUnifiedWithFlyout && isOpen && (
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
