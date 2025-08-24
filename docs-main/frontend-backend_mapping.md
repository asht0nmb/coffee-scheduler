  ⎿ Frontend-Backend I/O Connection Mapping & Integration Plan

    Complete I/O Mapping Analysis

    1. AUTHENTICATION FLOW

    Frontend → Backend:
    - Login Button → ${API_URL}/auth/google → Backend OAuth flow
    - Status Check → GET /api/auth/status → Session validation
    - Logout → POST /api/auth/logout → Session destruction

    Backend → Frontend:
    - OAuth Callback → ${FRONTEND_URL}/dashboard → Post-login redirect  
    - Auth Status → { authenticated: boolean, user: UserObject } → Frontend state

    2. CONTACT MANAGEMENT

    Frontend → Backend:
    - Get All Contacts → GET /api/contacts → Contact list for dashboard
    - Create Contact → POST /api/contacts → New contact from forms  
    - Update Contact → PUT /api/contacts/:id → Contact edits
    - Delete Contact → DELETE /api/contacts/:id → Contact removal
    - Contact Stats → GET /api/contacts/stats → Dashboard metrics

    Backend → Frontend:
    - Contact List → Contact[] with status/preferences → Dashboard display
    - Contact Stats → { total, pending, scheduled, completed } → Analytics

    3. SCHEDULING SYSTEM

    Frontend → Backend:
    - Create Session → POST /api/scheduling → New event scheduling
      - Frontend Input: { contacts: NewContact[], duration: number }
      - Backend Expects: { contactIds: string[], slotsPerContact: number }
    - Advanced Scheduling → POST /api/calendar/schedule-batch-advanced → Algorithm 
    scheduling
    - Get Suggestions → GET /api/calendar/suggestions → Active time slots
    - Confirm Slots → POST /api/calendar/schedule-batch → Finalize meetings

    Backend → Frontend:
    - Scheduling Result → Complex slot data with timezones → Scheduling UI
    - Suggested Slots → MongoDB suggestions → Scheduling confirmation

    4. EVENTS/CALENDAR DATA

    Frontend → Backend:
    - Get Events → GET /api/events (maps to /api/calendar/events) → Dashboard display
    - Calendar Sync → GET /api/calendar/sync-scheduled → Meeting updates

    Backend → Frontend:
    - Event List → Google Calendar events → Dashboard calendar
    - Meeting Status → Status updates → Event tracking

    5. USER PREFERENCES

    Frontend → Backend:
    - Get Preferences → GET /api/settings (maps to /api/user/preferences) → User 
    settings
    - Update Preferences → PUT /api/user/preferences → Settings changes

    Backend → Frontend:  
    - User Settings → { timezone, workingHours, preferences } → Settings UI

    Critical Data Transformation Points

    🔄 TRANSFORMATION LAYER NEEDED

    1. Contact Creation Mismatch:
      - Frontend sends: NewContact { id, name, email, timezone }
      - Backend expects: { name, email, timezone, meetingPreferences }
      - Solution: API adapter transforms frontend → backend format
    2. Scheduling Request Format:
      - Frontend: createSession(contacts: NewContact[], duration: number)  
      - Backend: { contactIds: string[], slotsPerContact: number }
      - Solution: Create contacts first, then use IDs for scheduling
    3. Route Mapping Active:
      - Frontend: /api/events → Backend: /api/calendar/events
      - Frontend: /api/settings → Backend: /api/user/preferences
      - Status: ✅ Already implemented in API adapter

    Integration Implementation Plan

    Phase 1: Authentication Connection (30 min)

    1. Create Auth Context: Frontend context to manage auth state
    2. Implement Session Checking: Regular backend /auth/status calls
    3. Update Middleware: Connect frontend protection to backend session
    4. Handle Redirects: Login/logout flow integration

    Phase 2: Service Layer Integration (45 min)

    1. Contacts Service: Test and connect CRUD operations
    2. Events Service: Connect calendar data flow  
    3. Scheduling Service: Implement contact→scheduling workflow
    4. Settings Service: Connect user preferences

    Phase 3: Data Transformation Documentation (15 min)

    1. Create API Integration Doc: Document all transformations needed
    2. Record Mismatches: Track frontend/backend format differences
    3. Add Transformation Examples: Code samples for each mismatch

    Phase 4: End-to-End Testing (30 min)

    1. Auth Flow: Login → Dashboard → API calls → Logout
    2. Contact Management: Create/Edit/Delete contacts
    3. Scheduling Flow: Create event → Generate slots → Confirm
    4. Session Persistence: Page refresh behavior

    Environment Setup for Production

    - Vercel: NEXT_PUBLIC_API_URL pointing to Railway backend
    - Railway: Google OAuth, MongoDB, session secrets configured  
    - CORS: Railway backend allows Vercel frontend domain

    Success Criteria

    ✅ User can login via Google and stay logged in✅ All dashboard data loads from 
    backend APIs✅ Contact management fully functional✅ Scheduling workflow creates 
    real calendar suggestions✅ Error handling provides user-friendly messages✅ 
    Session persists across page refreshes