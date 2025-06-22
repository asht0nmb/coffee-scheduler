// User types
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  timezone: string;
  _id: string;
}

// Contact types
export interface Contact {
  _id: string;
  userId: string;
  name: string;
  email: string;
  timezone: string;
  status: 'pending' | 'slots_generated' | 'email_sent' | 'scheduled' | 'completed';
  meetingPreferences?: {
    duration: number;
    timeOfDay?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Time slot types
export interface TimeSlot {
  start: string;
  end: string;
  quality?: {
    score: number;
    factors: string[];
  };
  displayTimes?: {
    contact: string;
    user: string;
  };
}

// Scheduling types
export interface SchedulingRequest {
  contactIds: string[];
  slotsPerContact?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  consultantMode?: boolean;
}

export interface SchedulingResult {
  success: boolean;
  results: Array<{
    contactId: string;
    slots: TimeSlot[];
    status: string;
  }>;
  metadata: {
    totalContacts: number;
    successfullyScheduled: number;
    algorithm: string;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

// Auth types
export interface AuthStatus {
  authenticated: boolean;
  user?: User;
  expiresAt?: string;
}