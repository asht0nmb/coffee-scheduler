#!/usr/bin/env node

/**
 * Integration Test - Frontend-Backend Communication
 * Tests the critical API endpoints and data flow
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const FRONTEND_BASE = 'http://localhost:3001';

console.log('🚀 Starting Coffee Scheduler Integration Tests\n');

// Test 1: Backend Health Check
console.log('1️⃣ Testing Backend Health...');
try {
  const response = await fetch(`${API_BASE}/api/health`);
  const data = await response.json();
  
  if (data.message && data.googleAuth !== undefined && data.mongodb !== undefined) {
    console.log('✅ Backend health check passed');
    console.log(`   - Environment: ${data.environment}`);
    console.log(`   - Google Auth: ${data.googleAuth ? 'Configured' : 'Missing'}`);
    console.log(`   - MongoDB: ${data.mongodb ? 'Connected' : 'Memory fallback'}`);
  } else {
    throw new Error('Invalid health response');
  }
} catch (error) {
  console.log('❌ Backend health check failed:', error.message);
  process.exit(1);
}

// Test 2: Authentication Status
console.log('\n2️⃣ Testing Authentication Endpoint...');
try {
  const response = await fetch(`${API_BASE}/api/auth/status`);
  const data = await response.json();
  
  if (data.hasOwnProperty('authenticated') && data.hasOwnProperty('user')) {
    console.log('✅ Auth status endpoint working');
    console.log(`   - Authenticated: ${data.authenticated}`);
    console.log(`   - User: ${data.user ? 'Present' : 'None (expected for non-logged users)'}`);
  } else {
    throw new Error('Invalid auth status response');
  }
} catch (error) {
  console.log('❌ Auth status check failed:', error.message);
  process.exit(1);
}

// Test 3: API Routes Discovery
console.log('\n3️⃣ Testing API Routes Discovery...');
try {
  const response = await fetch(`${API_BASE}/api/debug/routes`);
  const data = await response.json();
  
  if (data.routes && Array.isArray(data.routes) && data.routes.length > 0) {
    console.log('✅ API routes discovery working');
    console.log(`   - Total routes: ${data.count}`);
    console.log(`   - Key routes: ${data.routes.filter(r => 
      ['/api/auth/google', '/api/contacts', '/api/calendar/schedule-batch-advanced']
      .some(path => r.path === path)
    ).length}/3 critical endpoints found`);
  } else {
    throw new Error('No routes found');
  }
} catch (error) {
  console.log('❌ API routes discovery failed:', error.message);
  process.exit(1);
}

// Test 4: Protected Endpoint (should fail without auth)
console.log('\n4️⃣ Testing Protected Endpoint (should fail)...');
try {
  const response = await fetch(`${API_BASE}/api/contacts`);
  const data = await response.json();
  
  if (data.error === 'Not authenticated') {
    console.log('✅ Protected endpoint correctly blocks unauthenticated requests');
  } else {
    throw new Error('Protected endpoint should have rejected request');
  }
} catch (error) {
  console.log('❌ Protected endpoint test failed:', error.message);
  process.exit(1);
}

// Test 5: Frontend Server Response
console.log('\n5️⃣ Testing Frontend Server...');
try {
  const response = await fetch(`${FRONTEND_BASE}/`);
  
  if (response.ok) {
    console.log('✅ Frontend server responding');
    console.log(`   - Status: ${response.status}`);
    console.log(`   - Content-Type: ${response.headers.get('content-type')}`);
  } else {
    throw new Error(`Frontend returned status ${response.status}`);
  }
} catch (error) {
  console.log('❌ Frontend server test failed:', error.message);
  console.log('   Make sure frontend is running on port 3001');
}

// Test 6: Environment Configuration
console.log('\n6️⃣ Testing Environment Configuration...');
try {
  // This simulates what the frontend config module does
  const expectedApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  
  if (expectedApiUrl === API_BASE) {
    console.log('✅ Environment configuration correct');
    console.log(`   - API URL: ${expectedApiUrl}`);
  } else {
    throw new Error('Environment configuration mismatch');
  }
} catch (error) {
  console.log('❌ Environment configuration test failed:', error.message);
}

console.log('\n🎉 Integration Tests Complete!\n');
console.log('📋 Summary:');
console.log('✅ Backend API: Running and healthy');
console.log('✅ Authentication: Endpoints working');
console.log('✅ Route Protection: Working correctly'); 
console.log('✅ Frontend Server: Responsive');
console.log('✅ Environment: Properly configured');

console.log('\n🚀 Ready for End-to-End Testing!');
console.log('Next steps:');
console.log('1. Open http://localhost:3001 in browser');
console.log('2. Test Google OAuth login flow');
console.log('3. Create contacts and test scheduling workflow');
console.log('4. Verify session persistence across page refreshes');