import React from 'react';
import { TimeSlot, ParsedCalendar } from '../types.ts';

interface Props {
  slot: TimeSlot;
  calendars: ParsedCalendar[];
}

export const SlotCard: React.FC<Props> = ({ slot, calendars }) => {
  // Get formatted time
  const dateStr = slot.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
  const timeStr = `${slot.start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} - ${slot.end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;

  // Determine status color
  let statusColor = 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'; // Default
  let badgeColor = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  let barColor = 'bg-amber-400';
  let statusText = 'Partial Match';
  
  if (slot.score === 1) {
    statusColor = 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
    badgeColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
    barColor = 'bg-emerald-500';
    statusText = 'Perfect Match';
  } else if (slot.score > 0.6) {
    statusText = 'Good Match';
  }

  const missingNames = calendars.filter(c => slot.unavailableCalendars.includes(c.id)).map(c => c.name);

  return (
    <div className={`rounded-xl border p-5 transition-all shadow-sm hover:shadow-md ${statusColor}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{dateStr}</h3>
          <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-xl">{timeStr}</p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${badgeColor}`}>
          {statusText}
        </div>
      </div>

      {/* Availability Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>Availability</span>
          <span>{Math.round(slot.score * 100)}%</span>
        </div>
        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${slot.score * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Missing People */}
      {missingNames.length > 0 ? (
        <div className="text-sm">
            <span className="text-red-500 dark:text-red-400 font-medium text-xs uppercase tracking-wide">Missing:</span>
            <div className="flex flex-wrap gap-2 mt-2">
                {missingNames.map(name => (
                    <span key={name} className="px-2 py-1 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-md text-xs font-medium">
                        {name}
                    </span>
                ))}
            </div>
        </div>
      ) : (
          <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
               <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
             </svg>
             Everyone is available
          </div>
      )}
    </div>
  );
};