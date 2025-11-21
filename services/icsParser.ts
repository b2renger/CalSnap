import { CalendarEvent } from '../types.ts';

// Helper to parse ICS date strings (e.g., 20231025T143000Z)
const parseICSDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;

  // Clean formatting
  const cleaned = dateStr.trim();
  
  // Simple regex for YYYYMMDDTHHMMSS(Z)
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?/.exec(cleaned);
  
  if (match) {
    const [_, year, month, day, hour, minute, second, z] = match;
    const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}${z ? 'Z' : ''}`;
    return new Date(isoString);
  }

  // Handle Date-only (All day events) - YYYYMMDD
  const dateOnlyMatch = /^(\d{4})(\d{2})(\d{2})$/.exec(cleaned);
  if (dateOnlyMatch) {
    const [_, year, month, day] = dateOnlyMatch;
    return new Date(`${year}-${month}-${day}T00:00:00`);
  }

  return null;
};

export const parseICS = (content: string): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  const lines = content.split(/\r\n|\n|\r/);
  
  let inEvent = false;
  let currentEvent: Partial<CalendarEvent> = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = { id: Math.random().toString(36).substring(7) };
      continue;
    }
    
    if (line === 'END:VEVENT') {
      inEvent = false;
      if (currentEvent.start && currentEvent.end) {
        // Ensure start is before end
        if (currentEvent.start < currentEvent.end) {
             events.push(currentEvent as CalendarEvent);
        }
      }
      currentEvent = {};
      continue;
    }
    
    if (inEvent) {
      if (line.startsWith('DTSTART')) {
        // Handle DTSTART;TZID=...: or DTSTART:
        const parts = line.split(':');
        if (parts.length >= 2) {
           const dateVal = parts[parts.length - 1];
           currentEvent.start = parseICSDate(dateVal) || undefined;
        }
      } else if (line.startsWith('DTEND')) {
        const parts = line.split(':');
        if (parts.length >= 2) {
           const dateVal = parts[parts.length - 1];
           currentEvent.end = parseICSDate(dateVal) || undefined;
        }
      } else if (line.startsWith('SUMMARY')) {
        currentEvent.summary = line.substring(8);
      }
    }
  }
  
  return events;
};