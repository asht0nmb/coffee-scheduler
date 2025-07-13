/**
 * Centralized timezone configurations for the Coffee Scheduler application.
 * This file consolidates all timezone options to ensure consistency across components.
 */

export interface TimezoneOption {
  value: string;
  label: string;
  region?: 'us' | 'europe' | 'asia' | 'oceania' | 'americas';
}

/**
 * Comprehensive list of supported timezones, organized by popularity and region.
 * US timezones are prioritized first, followed by major international zones.
 */
export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  // United States - Most commonly used
  { 
    value: 'America/New_York', 
    label: 'Eastern Time (EST/EDT)', 
    region: 'us' 
  },
  { 
    value: 'America/Chicago', 
    label: 'Central Time (CST/CDT)', 
    region: 'us' 
  },
  { 
    value: 'America/Denver', 
    label: 'Mountain Time (MST/MDT)', 
    region: 'us' 
  },
  { 
    value: 'America/Los_Angeles', 
    label: 'Pacific Time (PST/PDT)', 
    region: 'us' 
  },
  { 
    value: 'America/Anchorage', 
    label: 'Alaska Time (AKST/AKDT)', 
    region: 'us' 
  },
  { 
    value: 'Pacific/Honolulu', 
    label: 'Hawaii Time (HST)', 
    region: 'us' 
  },
  
  // Europe - Major business centers
  { 
    value: 'Europe/London', 
    label: 'London (GMT/BST)', 
    region: 'europe' 
  },
  { 
    value: 'Europe/Paris', 
    label: 'Paris (CET/CEST)', 
    region: 'europe' 
  },
  { 
    value: 'Europe/Berlin', 
    label: 'Berlin (CET/CEST)', 
    region: 'europe' 
  },
  { 
    value: 'Europe/Rome', 
    label: 'Rome (CET/CEST)', 
    region: 'europe' 
  },
  { 
    value: 'Europe/Madrid', 
    label: 'Madrid (CET/CEST)', 
    region: 'europe' 
  },
  
  // Asia - Major business centers
  { 
    value: 'Asia/Tokyo', 
    label: 'Tokyo (JST)', 
    region: 'asia' 
  },
  { 
    value: 'Asia/Shanghai', 
    label: 'Shanghai (CST)', 
    region: 'asia' 
  },
  { 
    value: 'Asia/Seoul', 
    label: 'Seoul (KST)', 
    region: 'asia' 
  },
  { 
    value: 'Asia/Hong_Kong', 
    label: 'Hong Kong (HKT)', 
    region: 'asia' 
  },
  { 
    value: 'Asia/Singapore', 
    label: 'Singapore (SGT)', 
    region: 'asia' 
  },
  { 
    value: 'Asia/Mumbai', 
    label: 'Mumbai (IST)', 
    region: 'asia' 
  },
  { 
    value: 'Asia/Dubai', 
    label: 'Dubai (GST)', 
    region: 'asia' 
  },
  
  // Oceania
  { 
    value: 'Australia/Sydney', 
    label: 'Sydney (AEDT/AEST)', 
    region: 'oceania' 
  },
  { 
    value: 'Australia/Melbourne', 
    label: 'Melbourne (AEDT/AEST)', 
    region: 'oceania' 
  },
  { 
    value: 'Pacific/Auckland', 
    label: 'Auckland (NZDT/NZST)', 
    region: 'oceania' 
  },
  
  // Other Americas
  { 
    value: 'America/Toronto', 
    label: 'Toronto (EST/EDT)', 
    region: 'americas' 
  },
  { 
    value: 'America/Vancouver', 
    label: 'Vancouver (PST/PDT)', 
    region: 'americas' 
  },
  { 
    value: 'America/Sao_Paulo', 
    label: 'São Paulo (BRT)', 
    region: 'americas' 
  },
  { 
    value: 'America/Mexico_City', 
    label: 'Mexico City (CST/CDT)', 
    region: 'americas' 
  }
];

/**
 * Simplified timezone options for basic use cases (modals, quick selectors).
 * Contains only the most common timezones.
 */
export const MAJOR_TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'GMT (London)' },
  { value: 'Europe/Paris', label: 'CET (Paris)' },
  { value: 'Asia/Tokyo', label: 'JST (Tokyo)' },
  { value: 'Asia/Shanghai', label: 'CST (Shanghai)' },
  { value: 'Australia/Sydney', label: 'AEST (Sydney)' }
];

/**
 * Helper functions for working with timezones
 */
export const TimezoneUtils = {
  /**
   * Get timezone options filtered by region
   */
  getByRegion: (region: TimezoneOption['region']) => 
    TIMEZONE_OPTIONS.filter(tz => tz.region === region),
  
  /**
   * Find timezone option by value
   */
  findByValue: (value: string) => 
    TIMEZONE_OPTIONS.find(tz => tz.value === value),
  
  /**
   * Get all US timezones
   */
  getUSTimezones: () => 
    TIMEZONE_OPTIONS.filter(tz => tz.region === 'us'),
  
  /**
   * Get display label for a timezone value
   */
  getLabel: (value: string) => 
    TimezoneUtils.findByValue(value)?.label || value,
};

/**
 * Default timezone for new users and fallbacks
 */
export const DEFAULT_TIMEZONE = 'America/New_York';