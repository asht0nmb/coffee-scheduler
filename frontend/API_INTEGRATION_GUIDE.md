# API Integration Guide

## Overview
This document tracks all data transformations and integration points between the Coffee Scheduler frontend (Next.js) and backend (Express.js).

## Data Transformation Requirements

### 1. Contact Management Workflow

#### Frontend → Backend Contact Creation
**Frontend Input:**
```typescript
NewContact {
  id: string;          // Frontend-generated temp ID
  name: string;
  email: string;
  timezone: string;
}
```

**Backend Expected:**
```javascript
{
  name: string,
  email: string, 
  timezone: string,
  meetingPreferences?: {
    duration: number,
    timeOfDay: string
  }
}
```

**Backend Response:**
```javascript
Contact {
  _id: ObjectId,       // MongoDB ObjectId - IMPORTANT!
  userId: string,
  name: string,
  email: string,
  timezone: string,
  status: 'pending',
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Scheduling Workflow

#### Complete Frontend → Backend Scheduling Flow

**Step 1: Create contacts in database**
- Frontend: `NewContact[]` → Backend: Create via `/api/contacts` POST
- Result: Get back `Contact[]` with real MongoDB `_id` fields

**Step 2: Use contact IDs for scheduling**  
- Frontend: Extract `contact._id` values → Backend: `/api/calendar/schedule-batch-advanced`

**Backend Expected:**
```javascript
{
  contactIds: ['64a1b2c3d4e5f678901234ab', ...],  // MongoDB ObjectIds!
  slotsPerContact: 3,
  dateRange?: {
    start: '2024-01-15T00:00:00Z',
    end: '2024-01-29T23:59:59Z'
  },
  consultantMode: true
}
```

**Backend Response:**
```javascript
{
  success: true,
  algorithm: 'constrained-greedy-v2.0-enhanced',
  batchId: 'advanced_batch_1642123456789',
  results: [
    {
      contact: {
        id: '64a1b2c3d4e5f678901234ab',
        name: 'John Doe',
        email: 'john@example.com',
        timezone: 'America/New_York'
      },
      suggestedSlots: [
        {
          start: '2024-01-15T14:00:00Z',
          end: '2024-01-15T15:00:00Z', 
          score: 85,
          displayTimes: {
            user: 'Mon, Jan 15 at 9:00 AM PST',
            contact: 'Mon, Jan 15 at 12:00 PM EST'
          },
          explanation: 'High-quality slot in contact timezone',
          expiresAt: '2024-01-14T14:00:00Z'
        }
      ],
      averageScore: 82
    }
  ],
  statistics: {
    totalContacts: 5,
    totalSlots: 15,
    averageScore: 78,
    fairnessScore: 95
  }
}
```

## Route Mappings (API Adapter)

| Frontend Route | Backend Route | Method | Purpose |
|----------------|---------------|---------|----------|
| `/api/contacts` | `/api/contacts` | GET,POST,PUT,DELETE | Contact CRUD |
| `/api/events` | `/api/calendar/events` | GET | Calendar events |
| `/api/scheduling` | `/api/calendar/schedule-batch-advanced` | POST | Advanced scheduling |
| `/api/settings` | `/api/user/preferences` | PUT | User settings |
| `/api/settings/profile` | `/api/user/profile` | GET | User profile |

## Authentication Flow

### Session-Based Authentication
1. **Login**: Frontend → `${API_URL}/api/auth/google` → Google OAuth → Backend session
2. **Session Check**: Frontend → `/api/auth/status` → Backend session validation  
3. **API Calls**: All requests include `credentials: 'include'` for cookies
4. **Logout**: Frontend → `/api/auth/logout` POST → Backend session destroy

## Critical Integration Points

### ⚠️ Required Transformations

#### Contact Creation → Scheduling Chain
```typescript
// CORRECT workflow:
async createSchedulingSession(contacts: NewContact[], duration: number) {
  // Step 1: Create contacts in database first
  const createdContacts = await Promise.all(
    contacts.map(contact => contactsService.createContact(contact))
  );
  
  // Step 2: Extract MongoDB ObjectIds  
  const contactIds = createdContacts.map(contact => contact._id);
  
  // Step 3: Use ObjectIds for scheduling
  const response = await apiAdapter.post('/api/scheduling', {
    contactIds,           // ← MongoDB ObjectIds, not contact objects!
    slotsPerContact: 3,
    consultantMode: true
  });
}
```

#### Frontend NewContact → Backend Contact Creation
```typescript
// Transform frontend format to backend format
const backendContactData = {
  name: newContact.name.trim(),
  email: newContact.email.toLowerCase().trim(),
  timezone: newContact.timezone,
  meetingPreferences: {
    duration: duration,
    timeOfDay: 'any' // Default, can be customized
  }
};
```

## Environment Configuration

### Production Setup
- **Vercel**: `NEXT_PUBLIC_API_URL` points to Railway backend
- **Railway**: Backend environment variables set in Railway dashboard
- **CORS**: Backend allows Vercel domain via `FRONTEND_URL` environment variable

### Local Development  
- **Frontend**: `NEXT_PUBLIC_API_URL=http://localhost:5001` 
- **Backend**: MongoDB connection via `MONGO_URI` environment variable
- **Google OAuth**: Configured via `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

## Testing Checklist

### API Integration Health
- ✅ Health check: `/api/health` 
- ✅ Authentication: `/api/auth/status`
- ✅ Route mapping: Frontend routes → Backend routes
- ✅ Error handling: 401, 404, 500 responses
- ✅ Session persistence: Page refresh maintains login

### End-to-End Workflows
- ⏳ Contact creation: NewContact → Database → ObjectId
- ⏳ Scheduling flow: Contacts → ObjectIds → Time slots  
- ⏳ Calendar integration: Backend slots → Frontend display
- ⏳ Session management: Login → Dashboard → Logout