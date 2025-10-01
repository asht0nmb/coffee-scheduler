# Smart Coffee-Chat Scheduler

**An intelligent scheduling assistant that eliminates back-and-forth when coordinating 1:1 meetings across multiple people and timezones.**


<img width="1285" height="718" alt="Screenshot 2025-08-29 at 1 41 58 AM" src="https://github.com/user-attachments/assets/6dbbd22d-592a-44de-ade4-876b8b5473c9" />

## Problem & Solution

When scheduling coffee chats with multiple people, later contacts get progressively worse time slots. This app uses **intelligent batch allocation** to ensure everyone gets quality meeting times without conflicts, solving a problem that existing scheduling tools don't address.

## Features

- **Smart Algorithm**: 3-phase optimization with timezone-aware fairness scoring
- **Global Support**: Handles extreme timezones (UTC-12 to UTC+14)
- **Mobile-First**: Responsive design optimized for mobile workflows
- **Google OAuth**: Secure authentication with Calendar integration
- **High Performance**: <100ms API responses, <2s page loads
- **Real-time**: Live conflict detection and automatic expiry management

## Tech Stack

**Frontend**
- Next.js 14 with TypeScript
- Tailwind CSS + Lucide icons
- Deployed on Vercel

**Backend**
- Node.js + Express.js
- MongoDB with Mongoose
- Google Calendar API integration
- Deployed on Railway (99.9% uptime)

## Key Metrics

- **26 RESTful API endpoints** with full validation
- **115 comprehensive tests** (100% pass rate)
- **Sub-100ms** average API response time
- **Modular architecture**: 89% code reduction through refactoring
- **Production-ready** with monitoring and error handling

## Architecture Highlights

### Advanced Scheduling Algorithm
- **Phase 1**: Quality matrix generation with timezone scoring
- **Phase 2**: Constrained greedy optimization with lookahead
- **Phase 3**: Local search for fairness optimization
- **Edge cases**: Extreme timezones, insufficient slots, high density

### Production Features
- Custom Google OAuth PKCE implementation
- Distributed session management across platforms
- Rate limiting and security middleware
- Comprehensive error handling and logging
- Real-time conflict prevention with slot reservations

### Technical Challenges Solved

- OAuth Complexity: Custom PKCE implementation for Google OAuth
- Timezone Logic: Mathematical optimization across extreme timezones
- Performance: Algorithm optimization for <100ms response times
- Fairness: Ensuring equitable time slot distribution
- Mobile UX: Complex scheduling interface optimized for touch

### License
MIT License
