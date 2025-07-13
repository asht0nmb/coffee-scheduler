/**
 * Centralized duration configurations for the Coffee Scheduler application.
 * This file consolidates all meeting duration options to ensure consistency.
 */

export interface DurationOption {
  value: number;
  label: string;
  category?: 'quick' | 'standard' | 'extended';
}

/**
 * Standard meeting duration options in minutes.
 * Organized from shortest to longest for better UX.
 */
export const DURATION_OPTIONS: DurationOption[] = [
  { 
    value: 15, 
    label: '15 minutes', 
    category: 'quick' 
  },
  { 
    value: 20, 
    label: '20 minutes', 
    category: 'quick' 
  },
  { 
    value: 25, 
    label: '25 minutes', 
    category: 'quick' 
  },
  { 
    value: 30, 
    label: '30 minutes', 
    category: 'standard' 
  },
  { 
    value: 45, 
    label: '45 minutes', 
    category: 'standard' 
  },
  { 
    value: 60, 
    label: '1 hour', 
    category: 'standard' 
  },
  { 
    value: 90, 
    label: '1.5 hours', 
    category: 'extended' 
  },
  { 
    value: 120, 
    label: '2 hours', 
    category: 'extended' 
  }
];

/**
 * Quick duration options for simplified selectors.
 * Contains only the most common meeting lengths.
 */
export const QUICK_DURATION_OPTIONS: DurationOption[] = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' }
];

/**
 * Helper functions for working with durations
 */
export const DurationUtils = {
  /**
   * Get duration options filtered by category
   */
  getByCategory: (category: DurationOption['category']) => 
    DURATION_OPTIONS.filter(duration => duration.category === category),
  
  /**
   * Find duration option by value (in minutes)
   */
  findByValue: (value: number) => 
    DURATION_OPTIONS.find(duration => duration.value === value),
  
  /**
   * Get display label for a duration value
   */
  getLabel: (value: number) => 
    DurationUtils.findByValue(value)?.label || `${value} minutes`,
  
  /**
   * Convert minutes to hours and minutes display
   */
  formatDuration: (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  },
  
  /**
   * Get quick meeting durations (≤ 30 minutes)
   */
  getQuickMeetings: () => 
    DURATION_OPTIONS.filter(duration => duration.value <= 30),
  
  /**
   * Get standard meeting durations (30-60 minutes)
   */
  getStandardMeetings: () => 
    DURATION_OPTIONS.filter(duration => 
      duration.value >= 30 && duration.value <= 60
    ),
  
  /**
   * Get extended meeting durations (> 60 minutes)
   */
  getExtendedMeetings: () => 
    DURATION_OPTIONS.filter(duration => duration.value > 60),
};

/**
 * Default meeting duration for new events and fallbacks
 */
export const DEFAULT_DURATION = 30;

/**
 * Business logic constants for duration handling
 */
export const DURATION_LIMITS = {
  MIN_DURATION: 15,
  MAX_DURATION: 120,
  DEFAULT_STEP: 15, // For duration sliders/steppers
  COFFEE_CHAT_DEFAULT: 30, // Default for coffee chats
  MEETING_DEFAULT: 60, // Default for formal meetings
} as const;