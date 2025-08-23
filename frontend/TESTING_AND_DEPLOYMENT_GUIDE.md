# Coffee Scheduler - Testing & Railway Deployment Guide

## 🧪 **Complete Testing Walkthrough**

### **Current Status: ✅ All Tests Passing**
- Backend: Running on http://localhost:5001 
- Frontend: Running on http://localhost:3001
- Integration: 6/6 tests passing

---

## **Phase 1: Local Development Testing** ✅ COMPLETE

### **1. Services Running**
```bash
# Backend (Terminal 1)
cd backend && npm run start
# ✅ Running with memory storage fallback

# Frontend (Terminal 2) 
cd frontend && npm run dev -- --port 3001
# ✅ Running with Next.js Turbopack
```

### **2. Integration Test Results**
```bash
cd frontend && node integration-test.mjs
# ✅ All 6 tests passing
```

---

## **Phase 2: Railway Production Setup**

### **Railway Environment Variables to Set**

In your **Railway Dashboard → Backend Service → Variables**, set these:

```bash
# Database (you already have this)
MONGO_URL=mongodb://mongouser:mongopassword@mongohost:mongoport/railway

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
GOOGLE_REDIRECT_URL=https://your-frontend-domain.vercel.app

# Production Configuration
NODE_ENV=production
SESSION_SECRET=your_secure_session_secret_32_chars_min
FRONTEND_URL=https://your-frontend-domain.vercel.app
COOKIE_DOMAIN=.vercel.app

# Server (Railway auto-sets PORT, but you can override)
PORT=3000
```

### **Frontend Environment Variables**

In your **Vercel Dashboard → Project → Settings → Environment Variables**:

```bash
# API Connection
NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app
NEXT_PUBLIC_APP_ENV=production
```

---

## **Phase 3: Production Deployment Testing**

### **1. Deploy Backend to Railway**
```bash
# If not already deployed
railway login
railway init
railway up

# If already deployed, just push
git add .
git commit -m "Update environment configuration for Railway"
git push
```

### **2. Deploy Frontend to Vercel**
```bash
# If using Vercel CLI
vercel --prod

# Or push to connected Git repository
git push origin main
```

### **3. Production Health Check**
```bash
# Test Railway backend
curl https://your-backend-service.railway.app/api/health

# Should show:
# "mongodb": true (with Railway MongoDB)
# "environment": "production"
```

---

## **Phase 4: End-to-End Production Testing**

### **Critical Workflows to Test**

1. **🔐 Authentication Flow**:
   - Visit your production frontend URL
   - Click "Login with Google" 
   - Complete OAuth flow
   - Verify redirect to dashboard

2. **👥 Contact Management**:
   - Create new contacts
   - Verify they persist in Railway MongoDB
   - Edit/delete contacts

3. **📅 Scheduling Workflow**:
   - Create new event with multiple contacts
   - Verify time slot generation
   - Test scheduling confirmation
   - Check data persistence

4. **🔄 Session Persistence**:
   - Login and navigate around
   - Refresh page - should stay logged in
   - Close/reopen browser - should remember session

---

## **Phase 5: Production Verification Checklist**

### **Backend Verification** ✅
- [ ] Railway service is running
- [ ] MongoDB connected (not memory fallback)
- [ ] All 28 API endpoints responding  
- [ ] Google OAuth configured
- [ ] CORS allowing frontend domain

### **Frontend Verification** ✅  
- [ ] Vercel deployment successful
- [ ] Next.js build completed without errors
- [ ] API calls reaching Railway backend
- [ ] Authentication redirects working
- [ ] All dashboard routes protected

### **Integration Verification** ✅
- [ ] Login flow works end-to-end
- [ ] Data persists in Railway MongoDB
- [ ] All user workflows functional
- [ ] Error handling working properly

---

## **🚨 Troubleshooting Common Issues**

### **"MongoDB not connected" in production**
- Check `MONGO_URL` in Railway variables
- Ensure MongoDB service is running in Railway
- Verify connection string format

### **"CORS error" on frontend**
- Update `FRONTEND_URL` in Railway backend variables
- Ensure it matches your Vercel domain exactly
- Check `COOKIE_DOMAIN` setting

### **"OAuth redirect error"** 
- Update `GOOGLE_REDIRECT_URL` in Railway
- Must match Google Cloud Console settings
- Should point to your production frontend

### **"Session not persisting"**
- Check `SESSION_SECRET` is set in Railway
- Verify `COOKIE_DOMAIN` matches your domain
- Ensure HTTPS is being used in production

---

## **🎯 Next Steps for You**

### **Immediate (5 minutes)**
1. **Test Current Local Setup**:
   - Open http://localhost:3001 in browser
   - Verify homepage loads
   - Check browser console for errors

### **Railway MongoDB Connection (5 minutes)**
2. **Add Railway MONGO_URL**:
   - Copy `MONGO_URL` from Railway dashboard
   - Add to Railway backend environment variables
   - Redeploy backend service
   - Test: `curl https://your-backend.railway.app/api/health`
   - Should show `"mongodb": true`

### **Production Deployment (15 minutes)**  
3. **Full Production Setup**:
   - Set all Railway environment variables above
   - Deploy backend to Railway
   - Set Vercel environment variables
   - Deploy frontend to Vercel
   - Test complete production workflow

---

## **🏆 Success Criteria**

✅ **Local Development**: Both services running, all tests passing  
⏳ **Railway MongoDB**: Backend connected to persistent database  
⏳ **Production Deploy**: Both services deployed with proper env vars  
⏳ **End-to-End**: Complete user workflow working in production  

**Current Status**: Ready for Railway MongoDB connection and production deployment!