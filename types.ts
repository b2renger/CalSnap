export interface CalendarEvent {
  id: string;
  summary: string;
  start: Date;
  end: Date;
}

export interface ParsedCalendar {
  id: string;
  name: string;
  color: string;
  events: CalendarEvent[];
  initials: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  availableCalendars: string[]; // IDs of calendars that are free
  unavailableCalendars: string[]; // IDs of calendars that are busy
  score: number; // 0 to 1, 1 being 100% available
}

export interface LunchConfig {
  enabled: boolean;
  startHour: number;
  endHour: number;
}

export interface SchedulingConfig {
  durationMinutes: number;
  searchRangeDays: number;
  workHourStart: number; // 0-23
  workHourEnd: number; // 0-23
  lunch: LunchConfig;
}