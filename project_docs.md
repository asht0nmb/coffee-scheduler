# Smart Coffee-Chat Scheduler - Development Documentation

## 🎯 **Project Overview**

### **Vision Statement**
A smart scheduling assistant that eliminates the back-and-forth of coordinating 1:1 meetings across multiple time zones. The system intelligently finds optimal meeting times, prevents double-booking conflicts, and provides seamless integration with Google Calendar.

### **Core Problem Solved**
When scheduling coffee chats with multiple people sequentially, later contacts get progressively worse time slot options. Our solution uses intelligent batch allocation to ensure everyone gets quality meeting times without conflicts.

---

## 📊 **Current Project Status**

### **✅ COMPLETED (Production Ready)**
- **Backend Foundation**: Node.js + Express + MongoDB deployed on Railway
- **Google OAuth Integration**: Authentication with calendar access (includes critical PKCE fix)
- **Contact Management**: Full CRUD operations with timezone support
- **Calendar Intelligence**: Raw availability fetching and smart slot analysis
- **Database Architecture**: User, Contact, TentativeSlot, and SuggestedSlot schemas
- **Production Deployment**: Auto-deploy from GitHub to Railway

### **🔄 IN PROGRESS (Sprint 1)**
- **Code Modularization**: Breaking monolithic server.js into focused modules
- **Performance Analysis**: Establishing baselines and optimization targets
- **Critical Bug Fixes**: Race conditions and input validation

### **📋 PLANNED (Next Sprints)**
- **Frontend Development**: React + Tailwind dashboard
- **Email Integration**: Template generation and Gmail integration
- **Advanced Features**: Drag-and-drop scheduling, mobile optimization

---

## 🏗️ **Technical Architecture**

### **Technology Stack**
```
Frontend (Planned):  React + TypeScript + Tailwind CSS
Backend:             Node.js + Express.js
Database:            MongoDB with Mongoose ODM
Authentication:      Google OAuth 2.0
APIs:                Google Calendar API, Google People API
Deployment:          Railway (auto-deployment from GitHub)
```

### **Current File Structure**
```
smart-coffee-scheduler/
├── backend/
│   ├── server.js (1,300+ lines - BEING REFACTORED)
│   ├── package.json
│   └── .env.example
├── frontend/ (planned)
└── docs/ (this file)
```

### **Target File Structure (Sprint 1)**
```
smart-coffee-scheduler/backend/
├── server.js (entry point - ~50 lines)
├── routes/
│   ├── auth.js (OAuth routes)
│   ├── contacts.js (Contact management)
│   ├── calendar.js (Calendar & scheduling)
│   └── user.js (User profile routes)
├── models/
│   ├── User.js
│   ├── Contact.js
│   ├── TentativeSlot.js
│   └── SuggestedSlot.js
├── middleware/
│   ├── auth.js (ensureAuthenticated)
│   ├── validation.js (input validation)
│   └── rateLimiting.js
├── utils/
│   ├── googleAuth.js (OAuth client setup)
│   ├── slotAnalysis.js (scheduling algorithms)
│   └── timeUtils.js (timezone helpers)
└── config/
    └── database.js (MongoDB connection)
```

---

## 🔐 **Critical Implementation Details**

### **Google OAuth PKCE Fix (PRESERVE EXACTLY)**
```javascript
// CRITICAL: Custom PKCE override - DO NOT MODIFY
oauth2Client.generateAuthUrl = function(opts) {
  delete opts.code_challenge;
  delete opts.code_challenge_method;
  return google.auth.OAuth2.prototype.generateAuthUrl.call(this, opts);
};

oauth2Client.getToken = async function(codeOrOptions) {
  const originalTransporterRequest = this.transporter.request;
  this.transporter.request = function(opts) {
    if (opts.data && opts.data instanceof URLSearchParams) {
      opts.data.delete('code_verifier');
    }
    return originalTransporterRequest.apply(this, arguments);
  };
  // ... rest of implementation
};
```

### **MongoDB Model Pattern**
```javascript
// Always use this pattern to prevent re-compilation errors
const ModelName = mongoose.models.ModelName || mongoose.model('ModelName', modelSchema);
```

### **Timezone Strategy**
- **Storage**: All times in UTC in database
- **Display**: Convert to user/contact timezone only for presentation
- **Working Hours**: Applied in recipient's timezone (default 9am-5:30pm)

---

## 🐛 **Known Issues & Fixes Needed**

### **🔴 CRITICAL (Sprint 1)**
1. **Race Condition**: Batch scheduling can create overlapping slots if multiple requests run simultaneously
2. **Input Validation**: Missing validation allows potential resource exhaustion attacks
3. **Working Hours Bug**: Hardcoded 9-5 ignores user's actual working hour preferences

### **🟡 HIGH PRIORITY**
1. **Performance**: Inefficient timezone operations in loops
2. **Memory Usage**: Slot generation creates thousands of objects for large batches
3. **Database Queries**: N+1 query patterns in batch operations

### **🟢 MEDIUM PRIORITY**
1. **Contact Preferences**: Time preferences not fully utilized in scoring algorithm
2. **Fairness Algorithm**: Per-contact scoring doesn't ensure global fairness
3. **Schema Duplication**: TentativeSlot and SuggestedSlot serve similar purposes

---

## 📋 **Development Standards**

### **Code Quality Requirements**
- **File Size**: No single file over 300 lines after refactoring
- **Error Handling**: All endpoints must have proper error responses
- **Input Validation**: Validate all user inputs with appropriate limits
- **Security**: Rate limiting on expensive operations
- **Documentation**: JSDoc comments for complex functions

### **Testing Standards**
- **Manual Testing**: All endpoints tested with real Google Calendar data
- **Error Scenarios**: Test with invalid inputs, expired tokens, network failures
- **Performance**: Batch operations tested with 10+ contacts
- **Security**: Test rate limiting and input validation boundaries

### **Deployment Standards**
- **Environment Safety**: No secrets in code, proper .env usage
- **Zero Downtime**: Changes must not break existing functionality
- **Rollback Ready**: Each deployment must be easily reversible
- **Monitoring**: Health check endpoint always functional

---

## 🔄 **Team Workflow**

### **Sprint Cycle (1 Week)**
- **Monday**: Sprint planning, ticket assignment, team sync
- **Tuesday-Thursday**: Development work, daily progress updates
- **Friday**: Sprint review, demo, retrospective, next sprint planning

### **Daily Standup Format**
Each team member provides:
1. **Yesterday's Progress**: What was completed
2. **Today's Plan**: What will be worked on
3. **Blockers**: Any issues preventing progress
4. **Dependencies**: What you need from other team members

### **Code Review Process**
- **All Changes**: Reviewed by PM before integration
- **Critical Features**: Additional review by QA (Cursor)
- **Architecture Changes**: Product Owner approval required
- **Security Changes**: Extra scrutiny and testing

---

## 🎯 **Current Sprint Details**

### **Sprint 1 Goals**
1. **Modularize Codebase**: Break server.js into focused, maintainable modules
2. **Performance Baseline**: Establish current performance metrics
3. **Critical Fixes**: Address race conditions and validation issues
4. **Quality Foundation**: Set up proper development standards

### **Active Tickets**
- **TICKET #1**: File Structure Refactoring (Claude Code) - 🔴 Critical
- **TICKET #2**: Performance Analysis (Cursor) - 🟡 High

### **Success Criteria**
- [ ] Application runs without errors after refactoring
- [ ] All existing API endpoints maintain functionality
- [ ] Performance baselines established
- [ ] Code is organized into logical, focused modules
- [ ] Foundation ready for frontend development

---

## 📚 **Quick Reference**

### **Key API Endpoints**
```
Authentication:
  GET  /api/auth/google           - OAuth initiation
  GET  /api/auth/google/callback  - OAuth handling
  GET  /api/auth/status           - Session check

Contacts:
  GET    /api/contacts            - List contacts
  POST   /api/contacts            - Create contact
  PUT    /api/contacts/:id        - Update contact
  DELETE /api/contacts/:id        - Delete contact

Calendar:
  GET  /api/calendar/raw-availability  - Fetch busy times
  POST /api/calendar/analyze-slots     - Generate scored slots
  POST /api/calendar/schedule-batch    - Smart multi-contact scheduling
```

### **Environment Variables**
```bash
NODE_ENV=production
MONGO_URL=mongodb://railway-connection-string
GOOGLE_CLIENT_ID=oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=oauth-client-secret
GOOGLE_REDIRECT_URI=https://app-url.railway.app/api/auth/google/callback
SESSION_SECRET=cryptographically-secure-random-string
```

### **Local Development**
```bash
# Start development server
npm run dev

# Health check
curl http://localhost:5000/api/health

# Test authentication (manual browser test)
open http://localhost:5000/api/auth/google
```

### **Production URLs**
- **Backend**: https://backend-production-2104.up.railway.app
- **Health Check**: /api/health
- **Repository**: [GitHub repository URL]

---

## 🚨 **Emergency Procedures**

### **If Production Breaks**
1. **Immediate Rollback**: Revert to last working commit
2. **Check Railway Logs**: Monitor deployment logs for errors
3. **Verify Health Check**: Ensure /api/health responds
4. **Notify Team**: Alert PM and stakeholders
5. **Post-Mortem**: Document what went wrong and how to prevent

### **If Development is Blocked**
1. **Escalate to PM**: Immediate notification of blocking issues
2. **Document Blocker**: Clear description of problem and attempted solutions
3. **Coordinate Workaround**: PM will reassign priorities if needed
4. **Daily Check-in**: Updates until blocker is resolved

---

## 🎉 **Team Member Quick Start**

### **For Claude Code (Development)**
1. **Read this entire document** - understand the project context
2. **Check current sprint tickets** - see your assigned work
3. **Preserve critical implementations** - especially OAuth PKCE fix
4. **Follow code standards** - modular, well-documented, tested
5. **Ask questions early** - PM is here to unblock you

### **For Cursor (QA/Analysis)**
1. **Understand the architecture** - know what you're analyzing
2. **Focus on actionable insights** - translate findings to development tasks
3. **Test thoroughly** - real-world scenarios and edge cases
4. **Document everything** - findings help drive optimization priorities

### **For Product Owner**
1. **Strategic decisions only** - trust the team for implementation details
2. **Weekly sprint reviews** - see progress and provide feedback
3. **Priority guidance** - help PM make feature prioritization decisions
4. **User perspective** - ensure we're building something valuable

---

**📅 Last Updated**: [Current Date]  
**📝 Maintained By**: PM (Technical Lead)  
**🔄 Next Review**: End of Sprint 1

---

*This document is a living reference - update it as the project evolves!*