Smart Coffee Chat Scheduler - Technical Specification
Executive Summary
This document specifies a timezone-aware scheduling system that suggests optimal meeting times for coffee chats. The system analyzes a user's calendar availability and suggests times that work well across different timezones, optimizing for meeting quality and human energy patterns.

Table of Contents

System Architecture
Core Algorithm Specification
Data Structures
Scoring System
Optimization Strategy
Edge Case Handling
API Specification
Performance Requirements
Implementation Notes


1. System Architecture
1.1 High-Level Architecture
The system follows a five-layer architecture:
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│         (Format results with explanations)                   │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                    OPTIMIZATION LAYER                        │
│      (Assign slots optimally across all contacts)           │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                      SCORING LAYER                           │
│    (Calculate quality scores for each slot/contact pair)    │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                    TRANSLATION LAYER                         │
│        (Convert slots between timezones & filter)           │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                    EXTRACTION LAYER                          │
│          (Get available slots from user calendar)            │
└─────────────────────────────────────────────────────────────┘
1.2 Processing Flow

Input: User's Google Calendar + Contact list with timezones
Output: 3 optimal time slots per contact with explanations
Processing: User-first approach (start with actual availability)


2. Core Algorithm Specification
2.1 Algorithm Type
Constrained Greedy Optimization with 2-Step Lookahead
This approach balances computational efficiency with result quality, suitable for typical batch sizes (3-5 contacts).
2.2 Detailed Algorithm Steps
ALGORITHM: OptimizeCoffeeChats

INPUT:
  - userCalendar: Calendar object with busy/free times
  - contacts: Array of {id, name, email, timezone}
  - dateRange: {start: Date, end: Date}
  - options: {slotsPerContact: 3, consultantMode: true}

OUTPUT:
  - Array of {contactId, suggestedSlots: [{start, end, score, explanation}]}

STEPS:
1. EXTRACT user availability
   1.1 Query calendar for free blocks in dateRange
   1.2 Filter to working hours (8am-6pm user timezone)
   1.3 Split into 1-hour slots
   1.4 Apply 15-minute buffer before/after existing meetings
   1.5 Remove slots that violate hard constraints

2. BUILD quality matrix
   2.1 For each user slot:
       2.1.1 Convert to each contact's timezone
       2.1.2 Check if within 8am-6pm contact time
       2.1.3 If invalid: score = 0
       2.1.4 If valid: calculate quality score
   2.2 Store in matrix[slotId][contactId] = {score, contactTime, reasoning}

3. ANALYZE constraints
   3.1 Calculate each contact's scheduling difficulty:
       difficulty = 1 / (number of slots with score > 60)
   3.2 Sort contacts by difficulty (most constrained first)

4. ASSIGN slots using constrained greedy
   4.1 Initialize: assignments = {}, usedSlots = Set()
   4.2 For each contact (in difficulty order):
       4.2.1 Get available slots (not in usedSlots)
       4.2.2 Calculate effective score for each slot:
             effectiveScore = immediateScore + lookaheadImpact
       4.2.3 Select top 3 non-conflicting slots
       4.2.4 Add to assignments and usedSlots

5. OPTIMIZE through local search
   5.1 For each pair of contacts:
       5.1.1 Try swapping slots
       5.1.2 Keep swap if total score improves
       5.1.3 Ensure both contacts maintain score > 60

6. FORMAT results
   6.1 For each assignment:
       6.1.1 Generate human-readable explanation
       6.1.2 Format times in both timezones
       6.1.3 Add context about why slot was chosen

RETURN formatted results
2.3 Lookahead Calculation
FUNCTION: CalculateLookaheadImpact
INPUT: slot, remainingContacts, currentAssignments, depth=2
OUTPUT: impact score (negative = bad impact on future choices)

1. If no remaining contacts or depth = 0: return 0
2. simulatedUsedSlots = currentUsedSlots ∪ {slot}
3. impactScore = 0
4. For next 'depth' contacts:
   4.1 currentBestScore = best available score with currentUsedSlots
   4.2 futureBestScore = best available score with simulatedUsedSlots
   4.3 impactScore += (currentBestScore - futureBestScore)
5. Return -impactScore × 0.3  // 30% weight for future impact

3. Data Structures
3.1 Core Data Types
typescriptinterface TimeSlot {
  id: string;              // "2024-03-15T14:00:00Z"
  start: Date;             // UTC timestamp
  end: Date;               // UTC timestamp
  userLocalTime: string;   // "2:00 PM PST"
}

interface Contact {
  id: string;
  name: string;
  email: string;
  timezone: string;        // IANA timezone (e.g., "America/New_York")
}

interface QualityScore {
  score: number;           // 0-100
  contactTime: string;     // "5:00 PM EST"
  reasoning: string[];     // ["Friday afternoon", "No meetings after"]
  breakdown: {
    baseScore: number;
    dayBonus: number;
    timeBonus: number;
    densityPenalty: number;
  };
}

interface SlotAssignment {
  contactId: string;
  slots: Array<{
    slotId: string;
    start: Date;
    end: Date;
    score: number;
    userTime: string;      // "2:00 PM PST"
    contactTime: string;   // "5:00 PM EST"
    explanation: string;
  }>;
}

interface QualityMatrix {
  [slotId: string]: {
    [contactId: string]: QualityScore;
  };
}
3.2 Configuration Constants
javascriptconst SCHEDULING_CONFIG = {
  // Hard constraints
  WORKING_HOURS_START: 8,          // 8 AM
  WORKING_HOURS_END: 18,           // 6 PM
  MINIMUM_BUFFER_MINUTES: 15,      // Between meetings
  SLOT_DURATION_MINUTES: 60,       // 1 hour slots
  
  // Soft preferences
  LUNCH_START: 12,
  LUNCH_END: 13,
  
  // Scoring weights
  BASE_SCORE_WEIGHT: 0.6,
  DAY_SCORE_WEIGHT: 0.2,
  DENSITY_SCORE_WEIGHT: 0.2,
  
  // Optimization parameters
  LOOKAHEAD_DEPTH: 2,
  LOOKAHEAD_WEIGHT: 0.3,
  MINIMUM_ACCEPTABLE_SCORE: 60,
  
  // Batch constraints
  MAX_CONTACTS_PER_BATCH: 10,
  DEFAULT_SLOTS_PER_CONTACT: 3,
};

4. Scoring System
4.1 Base Time Scoring (Contact's Timezone)
javascriptfunction calculateBaseTimeScore(hour) {
  // hour is in 24-hour format in contact's timezone
  
  if (hour < 8 || hour >= 18) return 0;  // Outside working hours
  
  const scores = {
    8: 65,   // 8 AM - Early but acceptable
    9: 75,   // 9 AM - Good morning start
    10: 85,  // 10 AM - Prime morning
    11: 80,  // 11 AM - Late morning
    12: 30,  // 12 PM - Lunch hour (avoid)
    13: 50,  // 1 PM - Post-lunch recovery
    14: 80,  // 2 PM - Prime afternoon
    15: 85,  // 3 PM - Peak afternoon
    16: 75,  // 4 PM - Late afternoon
    17: 60   // 5 PM - End of day
  };
  
  return scores[hour] || 50;
}
4.2 Day of Week Scoring
javascriptfunction calculateDayScore(dayOfWeek, hour, options) {
  // dayOfWeek: 0 = Sunday, 5 = Friday
  
  let dayScore = 0;
  
  switch(dayOfWeek) {
    case 0: // Sunday
    case 6: // Saturday
      return -100;  // Hard no on weekends
      
    case 1: // Monday
      dayScore = -5;
      if (hour >= 14) dayScore += 5;  // Monday afternoon better
      break;
      
    case 2: // Tuesday
    case 3: // Wednesday  
    case 4: // Thursday
      dayScore = 10;  // Midweek bonus
      break;
      
    case 5: // Friday
      dayScore = 10;
      if (options.consultantMode) {
        dayScore += 15;  // Consultant Friday bonus
        if (hour >= 14) dayScore += 10;  // Friday afternoon golden
      }
      break;
  }
  
  return dayScore;
}
4.3 Meeting Density Scoring
javascriptfunction calculateDensityScore(slot, existingMeetings) {
  const slotStart = slot.start.getTime();
  const slotEnd = slot.end.getTime();
  let densityScore = 0;
  
  // Check meetings on same day
  const sameDayMeetings = existingMeetings.filter(meeting => {
    return isSameDay(meeting.start, slot.start);
  });
  
  // Penalty for too many meetings
  if (sameDayMeetings.length >= 4) densityScore -= 20;
  else if (sameDayMeetings.length >= 3) densityScore -= 10;
  
  // Check for back-to-back meetings
  const backToBack = existingMeetings.some(meeting => {
    const meetingEnd = meeting.end.getTime();
    const meetingStart = meeting.start.getTime();
    
    return Math.abs(meetingEnd - slotStart) < 30 * 60 * 1000 || 
           Math.abs(slotEnd - meetingStart) < 30 * 60 * 1000;
  });
  
  if (backToBack) densityScore -= 15;
  
  // Bonus for isolated meetings (2+ hours gap)
  const isolated = !existingMeetings.some(meeting => {
    const gap = Math.min(
      Math.abs(meeting.end.getTime() - slotStart),
      Math.abs(slotEnd - meeting.start.getTime())
    );
    return gap < 2 * 60 * 60 * 1000;
  });
  
  if (isolated) densityScore += 10;
  
  return densityScore;
}
4.4 Final Score Calculation
javascriptfunction calculateFinalScore(slot, contact, userCalendar, options) {
  // Convert slot to contact timezone
  const contactTime = convertToTimezone(slot.start, contact.timezone);
  const hour = contactTime.getHours();
  const dayOfWeek = contactTime.getDay();
  
  // Component scores
  const baseScore = calculateBaseTimeScore(hour);
  if (baseScore === 0) return { score: 0, reasoning: "Outside working hours" };
  
  const dayScore = calculateDayScore(dayOfWeek, hour, options);
  const densityScore = calculateDensityScore(slot, userCalendar.busySlots);
  
  // Weighted combination
  const finalScore = Math.max(0, Math.min(100,
    baseScore + dayScore + densityScore
  ));
  
  // Build reasoning
  const reasoning = [];
  if (hour === 10 || hour === 15) reasoning.push("Prime meeting time");
  if (dayOfWeek === 5 && hour >= 14) reasoning.push("Friday afternoon - relaxed atmosphere");
  if (densityScore > 0) reasoning.push("Good spacing from other meetings");
  if (densityScore < -10) reasoning.push("Warning: High meeting density");
  
  return {
    score: finalScore,
    contactTime: formatTime(contactTime, contact.timezone),
    reasoning,
    breakdown: { baseScore, dayScore, densityScore }
  };
}

5. Optimization Strategy
5.1 Contact Ordering Algorithm
javascriptfunction orderContactsByDifficulty(qualityMatrix, contacts) {
  return contacts
    .map(contact => {
      // Count slots with acceptable scores
      const goodSlots = Object.keys(qualityMatrix)
        .filter(slotId => qualityMatrix[slotId][contact.id].score >= 60);
      
      // Calculate average score for top 10 slots
      const topSlots = Object.keys(qualityMatrix)
        .map(slotId => qualityMatrix[slotId][contact.id])
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      
      const avgTopScore = topSlots.reduce((sum, s) => sum + s.score, 0) / topSlots.length;
      
      return {
        contact,
        goodSlotCount: goodSlots.length,
        avgTopScore,
        difficulty: 1 / (goodSlots.length + 1)  // Avoid division by zero
      };
    })
    .sort((a, b) => {
      // Primary sort: fewer good slots = higher priority
      if (a.goodSlotCount !== b.goodSlotCount) {
        return a.goodSlotCount - b.goodSlotCount;
      }
      // Secondary sort: lower average score = higher priority
      return a.avgTopScore - b.avgTopScore;
    })
    .map(item => item.contact);
}
5.2 Greedy Assignment with Lookahead
javascriptfunction assignSlotsWithLookahead(orderedContacts, qualityMatrix, slotsPerContact) {
  const assignments = {};
  const usedSlots = new Set();
  
  for (let i = 0; i < orderedContacts.length; i++) {
    const contact = orderedContacts[i];
    const remainingContacts = orderedContacts.slice(i + 1);
    
    // Get all available slots
    const availableSlots = Object.keys(qualityMatrix)
      .filter(slotId => !usedSlots.has(slotId))
      .map(slotId => ({
        slotId,
        immediateScore: qualityMatrix[slotId][contact.id].score,
        lookaheadImpact: calculateLookaheadImpact(
          slotId,
          remainingContacts,
          qualityMatrix,
          usedSlots,
          SCHEDULING_CONFIG.LOOKAHEAD_DEPTH
        )
      }));
    
    // Calculate effective scores
    availableSlots.forEach(slot => {
      slot.effectiveScore = slot.immediateScore + 
        (slot.lookaheadImpact * SCHEDULING_CONFIG.LOOKAHEAD_WEIGHT);
    });
    
    // Sort by effective score
    availableSlots.sort((a, b) => b.effectiveScore - a.effectiveScore);
    
    // Select top slots
    const selectedSlots = [];
    for (const slot of availableSlots) {
      if (selectedSlots.length >= slotsPerContact) break;
      if (slot.immediateScore >= SCHEDULING_CONFIG.MINIMUM_ACCEPTABLE_SCORE) {
        selectedSlots.push(slot.slotId);
        usedSlots.add(slot.slotId);
      }
    }
    
    // Handle case where not enough good slots
    if (selectedSlots.length < slotsPerContact) {
      // Take best available even if below threshold
      for (const slot of availableSlots) {
        if (selectedSlots.length >= slotsPerContact) break;
        if (!selectedSlots.includes(slot.slotId)) {
          selectedSlots.push(slot.slotId);
          usedSlots.add(slot.slotId);
        }
      }
    }
    
    assignments[contact.id] = selectedSlots;
  }
  
  return assignments;
}
5.3 Local Optimization
javascriptfunction optimizeAssignmentLocally(assignments, qualityMatrix, maxIterations = 100) {
  let improved = true;
  let iterations = 0;
  
  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    
    // Try all pairwise swaps
    const contactIds = Object.keys(assignments);
    
    for (let i = 0; i < contactIds.length; i++) {
      for (let j = i + 1; j < contactIds.length; j++) {
        const contact1 = contactIds[i];
        const contact2 = contactIds[j];
        
        // Try swapping each pair of slots
        for (const slot1 of assignments[contact1]) {
          for (const slot2 of assignments[contact2]) {
            const currentScore = 
              qualityMatrix[slot1][contact1].score +
              qualityMatrix[slot2][contact2].score;
            
            const swappedScore = 
              qualityMatrix[slot2][contact1].score +
              qualityMatrix[slot1][contact2].score;
            
            // Only swap if both contacts still get acceptable slots
            const swap1Acceptable = qualityMatrix[slot2][contact1].score >= 60;
            const swap2Acceptable = qualityMatrix[slot1][contact2].score >= 60;
            
            if (swappedScore > currentScore && swap1Acceptable && swap2Acceptable) {
              // Perform swap
              assignments[contact1] = assignments[contact1]
                .filter(s => s !== slot1)
                .concat([slot2]);
              assignments[contact2] = assignments[contact2]
                .filter(s => s !== slot2)
                .concat([slot1]);
              
              improved = true;
            }
          }
        }
      }
    }
  }
  
  return assignments;
}

6. Edge Case Handling
6.1 Insufficient Slots
javascriptfunction handleInsufficientSlots(availableSlots, contacts, slotsPerContact) {
  const totalNeeded = contacts.length * slotsPerContact;
  const totalAvailable = availableSlots.length;
  
  if (totalAvailable === 0) {
    return {
      error: "NO_AVAILABILITY",
      message: "No available time slots found in the specified date range",
      suggestion: "Try extending the date range or reducing meeting constraints"
    };
  }
  
  if (totalAvailable < contacts.length) {
    return {
      error: "SEVERE_SHORTAGE", 
      message: `Only ${totalAvailable} slots for ${contacts.length} contacts`,
      suggestion: "Cannot schedule all contacts. Consider scheduling in multiple batches."
    };
  }
  
  if (totalAvailable < totalNeeded) {
    const adjustedSlots = Math.floor(totalAvailable / contacts.length);
    return {
      warning: "REDUCED_SLOTS",
      message: `Reduced to ${adjustedSlots} slots per contact`,
      adjustedSlotsPerContact: adjustedSlots
    };
  }
  
  return null;  // No issues
}
6.2 Extreme Timezone Handling
javascriptfunction handleExtremeTimezones(contact, qualityMatrix, userTimezone) {
  const timeDiff = getTimezoneDifference(userTimezone, contact.timezone);
  
  // If time difference > 12 hours, we have an extreme case
  if (Math.abs(timeDiff) > 12) {
    const scores = Object.values(qualityMatrix)
      .map(slots => slots[contact.id].score)
      .filter(score => score > 0);
    
    if (scores.length === 0) {
      // No valid slots within normal hours
      return {
        strategy: "RELAX_CONSTRAINTS",
        message: `No standard working hours overlap with ${contact.name} (${contact.timezone})`,
        action: "Relaxing working hours to 7 AM - 7 PM for this contact",
        relaxedConstraints: {
          workingHoursStart: 7,
          workingHoursEnd: 19
        }
      };
    }
    
    const avgScore = scores.reduce((a, b) => a + b) / scores.length;
    if (avgScore < 50) {
      return {
        strategy: "COMPROMISE",
        message: `Limited good times due to ${Math.abs(timeDiff)}-hour time difference`,
        action: "Showing best available options despite suboptimal timing"
      };
    }
  }
  
  return null;  // No special handling needed
}
6.3 High Meeting Density
javascriptfunction detectMeetingOverload(userCalendar, proposedSlots, threshold = 4) {
  const slotsByDay = {};
  
  // Group existing meetings by day
  userCalendar.busySlots.forEach(meeting => {
    const day = meeting.start.toDateString();
    slotsByDay[day] = (slotsByDay[day] || 0) + 1;
  });
  
  // Add proposed slots
  proposedSlots.forEach(slot => {
    const day = slot.start.toDateString();
    slotsByDay[day] = (slotsByDay[day] || 0) + 1;
  });
  
  // Check for overload
  const overloadDays = Object.entries(slotsByDay)
    .filter(([day, count]) => count > threshold)
    .map(([day, count]) => ({ day, count }));
  
  if (overloadDays.length > 0) {
    return {
      warning: "MEETING_OVERLOAD",
      message: "High meeting density detected",
      overloadDays,
      suggestion: "Consider spreading meetings across more days"
    };
  }
  
  return null;
}

7. API Specification
7.1 Main Scheduling Endpoint
typescriptPOST /api/calendar/schedule-batch

Request Body:
{
  contacts: Array<{
    id: string;
    name: string;
    email: string;
    timezone: string;  // IANA timezone
  }>;
  dateRange?: {
    start: string;     // ISO date
    end: string;       // ISO date
  };
  options?: {
    slotsPerContact?: number;      // Default: 3
    consultantMode?: boolean;      // Default: true
    workingHours?: {
      start: number;   // Default: 8
      end: number;     // Default: 18
    };
  };
}

Response:
{
  success: boolean;
  results: Array<{
    contactId: string;
    contactName: string;
    contactTimezone: string;
    suggestedSlots: Array<{
      start: string;          // ISO datetime
      end: string;            // ISO datetime
      score: number;          // 0-100
      userDisplayTime: string;    // "Fri, Mar 15 at 2:00 PM PST"
      contactDisplayTime: string; // "Fri, Mar 15 at 5:00 PM EST"
      explanation: {
        primary: string;      // Main reason for selection
        factors: string[];    // Additional factors
        warnings?: string[];  // Any concerns
      };
    }>;
    alternativeAction?: {
      reason: string;
      suggestion: string;
    };
  }>;
  metadata: {
    totalSlotsAnalyzed: number;
    averageQuality: number;
    processingTime: number;
    warnings?: Array<{
      type: string;
      message: string;
    }>;
  };
}

Error Response:
{
  success: false;
  error: {
    code: string;  // NO_AVAILABILITY, INVALID_TIMEZONE, etc.
    message: string;
    details?: any;
  };
}
7.2 Supporting Endpoints
typescript// Get user's raw availability
GET /api/calendar/availability
Query Parameters:
  - start: ISO date
  - end: ISO date
  - includeBuffers: boolean

// Validate timezone
POST /api/timezones/validate
Body: { timezone: string }

// Get timezone offset
GET /api/timezones/offset
Query Parameters:
  - from: timezone
  - to: timezone
  - date: ISO date

8. Performance Requirements
8.1 Response Time Targets

Small batch (1-3 contacts): < 500ms
Medium batch (4-6 contacts): < 1 second
Large batch (7-10 contacts): < 2 seconds

8.2 Optimization Techniques

Calendar Query Optimization

Cache user's free/busy for session
Query only necessary date range
Use incremental updates when possible


Matrix Computation

Pre-calculate timezone conversions
Parallel scoring when possible
Early termination for zero scores


Memory Management

Stream large result sets
Limit matrix size to 1000 entries
Clear intermediate results



8.3 Scaling Considerations
javascript// For batches larger than 10 contacts
if (contacts.length > 10) {
  // Split into sub-batches
  const batches = chunkArray(contacts, 8);
  const results = [];
  
  for (const batch of batches) {
    const batchResult = await processBatch(batch);
    results.push(...batchResult);
    
    // Update available slots for next batch
    removeUsedSlots(batchResult);
  }
  
  return results;
}

9. Implementation Notes
9.1 Timezone Library
Use moment-timezone for all timezone operations:
javascriptconst moment = require('moment-timezone');

// Validate timezone
function isValidTimezone(tz) {
  return moment.tz.zone(tz) !== null;
}

// Convert between timezones
function convertTime(date, fromTz, toTz) {
  return moment.tz(date, fromTz).tz(toTz);
}
9.2 Calendar Integration
javascript// Abstract calendar interface
interface CalendarProvider {
  getFreeBusy(start: Date, end: Date): Promise<FreeBusyResponse>;
  getEvents(start: Date, end: Date): Promise<Event[]>;
}

// Google Calendar implementation
class GoogleCalendarProvider implements CalendarProvider {
  // Implementation details in existing code
}
9.3 Error Handling Strategy
javascriptclass SchedulingError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

// Usage
if (totalAvailable === 0) {
  throw new SchedulingError(
    'NO_AVAILABILITY',
    'No available time slots found',
    { dateRange, contactCount: contacts.length }
  );
}
9.4 Logging Requirements
javascript// Log key decision points
logger.info('Scheduling batch', {
  userId,
  contactCount: contacts.length,
  dateRange,
  userTimezone
});

logger.debug('Quality matrix built', {
  slotCount: Object.keys(qualityMatrix).length,
  averageScores: calculateAverageScores(qualityMatrix)
});

logger.info('Scheduling complete', {
  userId,
  successCount: results.length,
  averageQuality: calculateAverageQuality(results),
  processingTime
});
9.5 Testing Considerations
Key test scenarios:

Empty calendar (all slots available)
Busy calendar (few slots available)
Extreme timezones (>12 hour difference)
DST transitions
Weekend/holiday handling
Insufficient slots
Back-to-back meeting prevention
Various batch sizes


Appendix A: Explanation Templates
A.1 Slot Explanation Generator
javascriptfunction generateExplanation(slot, contact, score, factors) {
  const templates = {
    goldenSlot: {
      primary: "Premium Friday afternoon slot",
      factors: [
        "Relaxed end-of-week atmosphere",
        "No meetings scheduled after",
        "Optimal time in {timezone}"
      ]
    },
    
    morningSlot: {
      primary: "Prime morning meeting time",
      factors: [
        "High-energy morning hours",
        "Before the lunch break",
        "Clear calendar surrounding"
      ]
    },
    
    compromiseSlot: {
      primary: "Best available given constraints",
      factors: [
        "Limited overlap due to timezone difference",
        "Acceptable time for both parties",
        "Minimal disruption to existing schedule"
      ]
    },
    
    suboptimalSlot: {
      primary: "Workable but not ideal timing",
      factors: [
        "Some scheduling constraints present"
      ],
      warnings: [
        "Consider confirming this time works"
      ]
    }
  };
  
  // Select appropriate template based on score
  let template;
  if (score >= 85 && factors.isFriday && factors.isAfternoon) {
    template = templates.goldenSlot;
  } else if (score >= 80 && factors.isMorning) {
    template = templates.morningSlot;
  } else if (score >= 60) {
    template = templates.compromiseSlot;
  } else {
    template = templates.suboptimalSlot;
  }
  
  // Customize factors
  const customizedFactors = template.factors.map(factor =>
    factor.replace('{timezone}', contact.timezone)
  );
  
  return {
    primary: template.primary,
    factors: customizedFactors,
    warnings: template.warnings
  };
}

Appendix B: Configuration Overrides
javascript// Allow runtime configuration overrides
const CONFIG_OVERRIDES = {
  // For different industries/cultures
  consulting: {
    FRIDAY_BONUS: 15,
    LUNCH_PENALTY: -30
  },
  
  tech: {
    FRIDAY_BONUS: 5,
    MORNING_BONUS: -5,  // Tech folks prefer afternoon
    LUNCH_PENALTY: -10  // More flexible lunch
  },
  
  finance: {
    EARLY_MORNING_BONUS: 10,  // 8 AM meetings common
    FRIDAY_BONUS: 0,          // No Friday preference
    LUNCH_PENALTY: -40        // Strict lunch hours
  }
};

// Apply overrides
function applyConfigOverrides(baseConfig, industry) {
  if (CONFIG_OVERRIDES[industry]) {
    return { ...baseConfig, ...CONFIG_OVERRIDES[industry] };
  }
  return baseConfig;
}

This specification provides a complete blueprint for implementing the Smart Coffee Chat Scheduler. The algorithm is fully defined, edge cases are handled, and the implementation path is clear. A developer should be able to build this system without making significant architectural decisions.