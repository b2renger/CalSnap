import { ParsedCalendar, TimeSlot, SchedulingConfig } from '../types.ts';

export const findCommonSlots = (
  calendars: ParsedCalendar[],
  config: SchedulingConfig
): TimeSlot[] => {
  if (calendars.length === 0) return [];

  const now = new Date();
  // Start search from next hour to avoid immediate partial hours
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);

  const searchEnd = new Date(now);
  searchEnd.setDate(searchEnd.getDate() + config.searchRangeDays);

  const slots: TimeSlot[] = [];
  
  // UPDATED: Only suggest options with 30 minutes increment
  const incrementMinutes = 30;
  
  let cursor = new Date(now);

  // Align cursor to the next valid start time immediately
  if (cursor.getMinutes() !== 0 && cursor.getMinutes() !== 30) {
      if (cursor.getMinutes() < 30) cursor.setMinutes(30, 0, 0);
      else {
          cursor.setHours(cursor.getHours() + 1);
          cursor.setMinutes(0, 0, 0);
      }
  }

  if (cursor.getHours() < config.workHourStart) {
    cursor.setHours(config.workHourStart, 0, 0, 0);
  } else if (cursor.getHours() >= config.workHourEnd) {
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(config.workHourStart, 0, 0, 0);
  }
  
  while (cursor < searchEnd) {
    const currentStart = new Date(cursor);
    const currentEnd = new Date(cursor.getTime() + config.durationMinutes * 60000);

    // Define the strict boundaries for the current specific day
    const dayStartBoundary = new Date(currentStart);
    dayStartBoundary.setHours(config.workHourStart, 0, 0, 0);

    const dayEndBoundary = new Date(currentStart);
    dayEndBoundary.setHours(config.workHourEnd, 0, 0, 0);

    // 1. Check Day Boundaries
    
    // If we are before the start of the day, jump to start
    if (currentStart < dayStartBoundary) {
      cursor = new Date(dayStartBoundary);
      continue;
    }

    // If the END of the meeting exceeds the end of the day, skip to next day
    if (currentEnd > dayEndBoundary) {
       cursor.setDate(cursor.getDate() + 1);
       cursor.setHours(config.workHourStart, 0, 0, 0);
       continue;
    }

    // 2. Check Lunch Overlap (if enabled)
    let overlapsLunch = false;
    if (config.lunch.enabled) {
        const lunchStart = new Date(currentStart);
        lunchStart.setHours(config.lunch.startHour, 0, 0, 0);
        
        const lunchEnd = new Date(currentStart);
        lunchEnd.setHours(config.lunch.endHour, 0, 0, 0);

        // Overlap formula: (StartA < EndB) and (EndA > StartB)
        if (currentStart < lunchEnd && currentEnd > lunchStart) {
            overlapsLunch = true;
        }
    }

    if (overlapsLunch) {
        cursor.setMinutes(cursor.getMinutes() + incrementMinutes);
        continue;
    }

    // 3. Skip Weekends
    const day = currentStart.getDay();
    if (day === 0 || day === 6) {
       cursor.setDate(cursor.getDate() + 1);
       cursor.setHours(config.workHourStart, 0, 0, 0);
       continue;
    }

    // 4. Check Calendar Availability
    const availableCals: string[] = [];
    const busyCals: string[] = [];

    calendars.forEach(cal => {
      let isBusy = false;
      for (const event of cal.events) {
        // Overlap logic: (StartA < EndB) and (EndA > StartB)
        if (event.start < currentEnd && event.end > currentStart) {
          isBusy = true;
          break;
        }
      }
      if (isBusy) {
        busyCals.push(cal.id);
      } else {
        availableCals.push(cal.id);
      }
    });

    // Only add if at least one person is available
    if (availableCals.length > 0) {
        slots.push({
            start: currentStart,
            end: currentEnd,
            availableCalendars: availableCals,
            unavailableCalendars: busyCals,
            score: availableCals.length / calendars.length
        });
    }

    cursor.setMinutes(cursor.getMinutes() + incrementMinutes);
  }

  // Sort: Score (High to Low) -> Start Time (Soonest first)
  return slots.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.start.getTime() - b.start.getTime();
  });
};