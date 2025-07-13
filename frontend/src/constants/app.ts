/**
 * Centralized application constants for the Coffee Scheduler.
 * This file contains all hardcoded values used throughout the application.
 */

/**
 * Application branding and text constants
 */
export const APP_CONSTANTS = {
  APP_NAME: 'Coffee Scheduler',
  APP_TAGLINE: 'Spend time connecting, not scheduling',
  COMPANY_NAME: 'Coffee Scheduler Inc.',
  
  // Default event and meeting text
  DEFAULT_EVENT_TITLE: 'Coffee Chat',
  DEFAULT_CONTACT_NAME: 'Unknown Contact',
  
  // Navigation and UI text
  DASHBOARD_SUBTITLE: 'Dashboard',
  MENU_TITLE: 'Menu',
  
  // Action buttons and CTAs
  CTA_PRIMARY: 'Start Connecting',
  CTA_NEW_EVENT: '✨ New Event',
  CTA_VIEW_DETAILS: '📋 View Details',
  CTA_SCHEDULE_AGAIN: '🔄 Schedule Again',
  CTA_EDIT_MEETING: '✏️ Edit Meeting',
  CTA_CANCEL_MEETING: '❌ Cancel Meeting',
  
  // Status messages
  SUCCESS_SAVE: 'Settings saved successfully!',
  ERROR_VALIDATION: 'Please add at least one contact to continue with scheduling.',
  LOADING_TEXT: 'Loading...',
  
  // Placeholder text
  NO_EVENTS_UPCOMING: 'Your scheduled meetings will appear here',
  NO_EVENTS_PAST: 'Your completed scheduling sessions will appear here',
} as const;

/**
 * Default values for user preferences and settings
 */
export const DEFAULT_VALUES = {
  TIMEZONE: 'America/New_York',
  DURATION: 30, // minutes
  WORKING_HOURS: {
    START: '09:00',
    END: '17:00',
  },
  REMINDER_TIME: 15, // minutes before meeting
  SYNC_FREQUENCY: 'hourly' as const,
  DATA_RETENTION: 365, // days
} as const;

/**
 * Animation and transition constants
 */
export const ANIMATION_CONSTANTS = {
  DURATION_FAST: 200, // ms
  DURATION_NORMAL: 300, // ms
  DURATION_SLOW: 500, // ms
  
  // CSS class names for consistent transitions
  TRANSITION_COLORS: 'transition-colors duration-200',
  TRANSITION_ALL: 'transition-all duration-200',
  TRANSITION_TRANSFORM: 'transition-transform duration-200',
} as const;

/**
 * Layout and sizing constants
 */
export const LAYOUT_CONSTANTS = {
  MODAL_MAX_WIDTH: '28rem', // 448px
  SIDEBAR_WIDTH: '16rem', // 256px
  HEADER_HEIGHT: '4rem', // 64px
  MOBILE_BREAKPOINT: '768px',
  
  // Z-index values for layering
  Z_INDEX: {
    DROPDOWN: 1000,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    TOOLTIP: 1070,
  },
} as const;

/**
 * Business logic constants
 */
export const BUSINESS_CONSTANTS = {
  // Events and scheduling
  MAX_CONTACTS_PER_EVENT: 10,
  MIN_MEETING_DURATION: 15, // minutes
  MAX_MEETING_DURATION: 120, // minutes
  DEFAULT_SLOTS_PER_CONTACT: 3,
  
  // Pagination and limits
  EVENTS_PER_PAGE: 20,
  RECENT_EVENTS_LIMIT: 6,
  
  // Time ranges
  WORKING_DAYS: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const,
  WEEKEND_DAYS: ['saturday', 'sunday'] as const,
  
  // Session and storage
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes in ms
  AUTO_SAVE_INTERVAL: 2 * 60 * 1000, // 2 minutes in ms
} as const;

/**
 * API and external service constants
 */
export const API_CONSTANTS = {
  DEFAULT_API_TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Endpoints (if needed for client-side routing)
  ENDPOINTS: {
    CONTACTS: '/api/contacts',
    EVENTS: '/api/events',
    SCHEDULING: '/api/scheduling',
    SETTINGS: '/api/settings',
  },
} as const;

/**
 * Form validation constants
 */
export const VALIDATION_CONSTANTS = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MIN_EMAIL_LENGTH: 5,
  MAX_EMAIL_LENGTH: 254,
  
  // Regex patterns
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NAME_REGEX: /^[a-zA-Z\s'-]+$/,
} as const;

/**
 * Environment and feature flags
 */
export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: true,
  ENABLE_BETA_FEATURES: false,
  ENABLE_DARK_MODE: false,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_EXPORT: true,
} as const;

/**
 * Date and time formatting options
 */
export const DATE_FORMATS = {
  DISPLAY_DATE: {
    weekday: 'long' as const,
    year: 'numeric' as const,
    month: 'long' as const,
    day: 'numeric' as const,
  },
  DISPLAY_TIME: {
    hour: 'numeric' as const,
    minute: '2-digit' as const,
    hour12: true as const,
  },
  SHORT_DATE: {
    month: 'short' as const,
    day: 'numeric' as const,
    year: 'numeric' as const,
  },
  SHORT_TIME: {
    hour: 'numeric' as const,
    minute: '2-digit' as const,
    hour12: true as const,
    timeZoneName: 'short' as const,
  },
} as const;