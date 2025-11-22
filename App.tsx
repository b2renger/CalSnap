import React, { useState, useMemo, useEffect } from 'react';
import { CalendarUploader } from './components/CalendarUploader.tsx';
import { SlotCard } from './components/SlotCard.tsx';
import { ParsedCalendar, SchedulingConfig } from './types.ts';
import { parseICS } from './services/icsParser.ts';
import { findCommonSlots } from './services/scheduler.ts';
import { CALENDAR_COLORS, MOCK_INITIALS } from './constants.ts';

const App: React.FC = () => {
  // Global State
  const [darkMode, setDarkMode] = useState<boolean>(true);

  const [calendars, setCalendars] = useState<ParsedCalendar[]>([]);
  
  // URL Import State
  const [urlInput, setUrlInput] = useState<string>('');
  const [isUrlLoading, setIsUrlLoading] = useState<boolean>(false);
  
  // Configuration State
  const [duration, setDuration] = useState<number>(60); // minutes
  const [searchDays, setSearchDays] = useState<number>(5);
  const [dayStartHour, setDayStartHour] = useState<number>(9); // 09:00
  const [dayEndHour, setDayEndHour] = useState<number>(18); // 18:00

  // Lunch Configuration
  const [lunchEnabled, setLunchEnabled] = useState<boolean>(false);
  const [lunchStart, setLunchStart] = useState<number>(12); // 12:00
  const [lunchEnd, setLunchEnd] = useState<number>(13); // 13:00

  // Process files into calendar objects
  const handleUpload = async (files: FileList) => {
    const newCalendars: ParsedCalendar[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();
      const events = parseICS(text);
      
      // Generate a stable color based on current count
      const color = CALENDAR_COLORS[(calendars.length + i) % CALENDAR_COLORS.length];
      
      newCalendars.push({
        id: Math.random().toString(36).substring(7),
        name: file.name.replace('.ics', ''),
        color,
        initials: MOCK_INITIALS(file.name),
        events
      });
    }
    
    setCalendars(prev => [...prev, ...newCalendars]);
  };

  const handleUrlAdd = async () => {
    if (!urlInput) return;
    setIsUrlLoading(true);
    try {
      const response = await fetch(urlInput);
      if (!response.ok) throw new Error('Failed to fetch');
      const text = await response.text();
      const events = parseICS(text);
      
      const color = CALENDAR_COLORS[calendars.length % CALENDAR_COLORS.length];
      
      // Try to guess name from URL
      let name = 'Web Calendar';
      try {
          const urlObj = new URL(urlInput);
          const parts = urlObj.pathname.split('/');
          const lastPart = parts[parts.length - 1];
          if (lastPart && lastPart.length > 2) {
              name = lastPart.replace('.ics', '');
          } else {
              name = urlObj.hostname;
          }
      } catch(e) {}

      setCalendars(prev => [...prev, {
        id: Math.random().toString(36).substring(7),
        name: name,
        color,
        initials: MOCK_INITIALS(name),
        events
      }]);
      setUrlInput('');
    } catch (e) {
      alert('Could not load calendar. Please check the URL and ensure the server allows CORS (Cross-Origin Resource Sharing).');
    } finally {
      setIsUrlLoading(false);
    }
  };

  const handleRemoveCalendar = (id: string) => {
    setCalendars(prev => prev.filter(c => c.id !== id));
  };

  // Calculate slots whenever inputs change
  const slots = useMemo(() => {
    // Validation: Ensure end is after start
    const validEndHour = dayEndHour > dayStartHour ? dayEndHour : dayStartHour + 1;
    const validLunchEnd = lunchEnd > lunchStart ? lunchEnd : lunchStart + 1;
    
    const config: SchedulingConfig = {
      durationMinutes: duration,
      searchRangeDays: searchDays,
      workHourStart: dayStartHour, 
      workHourEnd: validEndHour,
      lunch: {
          enabled: lunchEnabled,
          startHour: lunchStart,
          endHour: validLunchEnd
      }
    };
    return findCommonSlots(calendars, config);
  }, [calendars, duration, searchDays, dayStartHour, dayEndHour, lunchEnabled, lunchStart, lunchEnd]);

  const LOOK_AHEAD_OPTIONS = [3, 5, 7, 14, 21, 28, 35, 42];

  return (
    <div className={`${darkMode ? 'dark' : ''} w-full`}>
        <div className="min-h-screen pb-20 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 transition-colors">
            <div className="w-full px-4 md:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
                </svg>
                </div>
                <span className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">CalSnap</span>
            </div>
            
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                    {darkMode ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                        </svg>
                    )}
                </button>
                <div className="text-xs text-slate-400 dark:text-slate-500 font-medium px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                    Client-Side
                </div>
            </div>
            </div>
        </header>

        <main className="w-full px-4 md:px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
            
            {/* Left Sidebar: Controls */}
            <div className="space-y-6">
                
                {/* Uploader Section */}
                <section>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide mb-3">Calendars</h2>
                <CalendarUploader onUpload={handleUpload} />
                
                {/* URL Input */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Add via URL</label>
                    <div className="flex gap-2">
                        <input 
                            type="url" 
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUrlAdd()}
                            placeholder="https://example.com/cal.ics"
                            className="flex-1 text-sm p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400"
                        />
                        <button 
                            onClick={handleUrlAdd}
                            disabled={isUrlLoading || !urlInput}
                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center min-w-[40px]"
                        >
                            {isUrlLoading ? (
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 ml-1">Note: Server must support CORS.</p>
                </div>

                {/* Calendar List */}
                <div className="mt-4 space-y-2">
                    {calendars.map(cal => (
                    <div key={cal.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                        <div 
                            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: cal.color }}
                        >
                            {cal.initials}
                        </div>
                        <div className="truncate">
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{cal.name}</div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">{cal.events.length} events</div>
                        </div>
                        </div>
                        <button 
                        onClick={() => handleRemoveCalendar(cal.id)}
                        className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1 transition-colors"
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                        </svg>
                        </button>
                    </div>
                    ))}
                    {calendars.length === 0 && (
                        <div className="text-sm text-slate-500 dark:text-slate-500 italic px-2">No calendars added yet.</div>
                    )}
                </div>
                </section>

                {/* Settings Section */}
                <section className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide mb-4">Duration</h2>
                    
                    <div className="mb-3">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Length: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{duration} min</span></label>
                        </div>
                        <input 
                            type="range" 
                            min="15" 
                            max="240" 
                            step="15" 
                            value={duration <= 240 ? duration : 240}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                        />
                        <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
                            <span>15m</span>
                            <span>4h</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => setDuration(480)}
                            className={`py-2 px-3 text-xs font-medium rounded border transition-colors ${
                                duration === 480 
                                ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' 
                                : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                            }`}
                        >
                            8 Hours
                        </button>
                        <button 
                            onClick={() => setDuration(720)}
                            className={`py-2 px-3 text-xs font-medium rounded border transition-colors ${
                                duration === 720 
                                ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' 
                                : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                            }`}
                        >
                            12 Hours
                        </button>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide mb-4">Time Window</h2>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Day Start</label>
                            <select 
                                value={dayStartHour} 
                                onChange={(e) => setDayStartHour(Number(e.target.value))}
                                className="w-full p-2 text-sm font-medium text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            >
                                {Array.from({length: 24}).map((_, i) => (
                                    <option key={i} value={i} disabled={i >= dayEndHour}>{i.toString().padStart(2, '0')}:00</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Day End</label>
                            <select 
                                value={dayEndHour} 
                                onChange={(e) => setDayEndHour(Number(e.target.value))}
                                className="w-full p-2 text-sm font-medium text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            >
                                {Array.from({length: 24}).map((_, i) => (
                                    <option key={i} value={i + 1} disabled={i + 1 <= dayStartHour}>{(i + 1).toString().padStart(2, '0')}:00</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Lunch Config */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Exclude Lunch Break</label>
                            <button 
                                onClick={() => setLunchEnabled(!lunchEnabled)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                    lunchEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'
                                }`}
                            >
                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                                    lunchEnabled ? 'translate-x-5' : 'translate-x-1'
                                }`}/>
                            </button>
                        </div>
                        
                        {lunchEnabled && (
                            <div className="grid grid-cols-2 gap-3 mt-2 animate-in slide-in-from-top-1 fade-in duration-200">
                                <div>
                                    <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">From</label>
                                    <select 
                                        value={lunchStart} 
                                        onChange={(e) => setLunchStart(Number(e.target.value))}
                                        className="w-full p-1.5 text-sm text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 focus:ring-0"
                                    >
                                        {Array.from({length: 24}).map((_, i) => (
                                            <option key={i} value={i}>{i}:00</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">To</label>
                                    <select 
                                        value={lunchEnd} 
                                        onChange={(e) => setLunchEnd(Number(e.target.value))}
                                        className="w-full p-1.5 text-sm text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 focus:ring-0"
                                    >
                                        {Array.from({length: 24}).map((_, i) => (
                                            <option key={i} value={i} disabled={i <= lunchStart}>{i}:00</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Look Ahead: {searchDays} days</label>
                        <div className="grid grid-cols-4 gap-2">
                            {LOOK_AHEAD_OPTIONS.map(d => (
                                <button
                                    key={d}
                                    onClick={() => setSearchDays(d)}
                                    className={`py-1.5 text-xs font-medium rounded border transition-colors ${
                                        searchDays === d 
                                        ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' 
                                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'
                                    }`}
                                >
                                    {d}d
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                </section>

            </div>

            {/* Right Content: Results */}
            <div className="">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Available Slots</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Searching for <span className="font-medium text-indigo-600 dark:text-indigo-400">{duration}m</span> slots between <span className="font-medium text-indigo-600 dark:text-indigo-400">{dayStartHour}:00</span> and <span className="font-medium text-indigo-600 dark:text-indigo-400">{dayEndHour}:00</span>
                        </p>
                    </div>
                    {slots.length > 0 && (
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
                            {slots.length} options found
                        </span>
                    )}
                </div>

                {calendars.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-3 opacity-50">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0h18M5.25 12h13.5h-13.5Zm0 3.75h13.5h-13.5Z" />
                        </svg>
                        <p>Upload calendars to start finding time.</p>
                    </div>
                ) : slots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="font-medium">No common slots found.</p>
                        <p className="text-sm mt-1 text-center max-w-md px-4">
                            Try reducing the duration or expanding the time window.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                        {slots.map((slot, idx) => (
                            <SlotCard key={idx} slot={slot} calendars={calendars} />
                        ))}
                    </div>
                )}
            </div>

            </div>
        </main>
        </div>
    </div>
  );
};

export default App;