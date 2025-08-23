/**
 * API Integration Test
 * 
 * Quick test to verify the API adapter is working correctly
 * Run this with: node src/test-api-integration.mjs
 */

// Simple version without TypeScript for quick testing
import axios from 'axios';

const API_URL = 'http://localhost:5001';

// Create a simple API adapter test
class APIAdapterTest {
  constructor(baseURL) {
    this.api = axios.create({
      baseURL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Route mapping (simplified version)
  mapRoute(frontendRoute) {
    const routeMap = {
      '/api/contacts': '/api/contacts',
      '/api/events': '/api/calendar/events', 
      '/api/scheduling': '/api/calendar/schedule-batch-advanced',
      '/api/settings': '/api/user/preferences',
      '/api/health': '/api/health'
    };
    
    return routeMap[frontendRoute] || frontendRoute;
  }

  async request(frontendRoute, options = {}) {
    try {
      const backendRoute = this.mapRoute(frontendRoute);
      console.log(`Testing: ${frontendRoute} -> ${backendRoute}`);
      
      const config = {
        ...options,
        url: backendRoute,
        timeout: 10000,
      };

      const response = await this.api.request(config);
      
      return {
        data: response.data,
        success: true,
        status: response.status,
        message: response.data?.message
      };

    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 'NETWORK_ERROR',
        error: error.response?.data?.error || error.message,
        message: 'Request failed'
      };
    }
  }

  async get(frontendRoute) {
    return this.request(frontendRoute, { method: 'GET' });
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting API Integration Tests...\n');
  
  const adapter = new APIAdapterTest(API_URL);
  
  const tests = [
    {
      name: 'Health Check',
      route: '/api/health',
      expectAuth: false
    },
    {
      name: 'Contacts Endpoint',
      route: '/api/contacts',
      expectAuth: true
    },
    {
      name: 'Events Endpoint', 
      route: '/api/events',
      expectAuth: true
    },
    {
      name: 'Scheduling Endpoint',
      route: '/api/scheduling',
      expectAuth: true
    },
    {
      name: 'Settings Endpoint',
      route: '/api/settings', 
      expectAuth: true
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n🔍 Testing: ${test.name}`);
    console.log(`   Route: ${test.route}`);
    
    const result = await adapter.get(test.route);
    
    if (test.expectAuth && result.status === 401) {
      console.log(`   ✅ PASS - Route mapped correctly (401 Auth Required)`);
      console.log(`   📡 Backend Response: ${result.error}`);
      passed++;
    } else if (!test.expectAuth && result.success) {
      console.log(`   ✅ PASS - Route working`);
      console.log(`   📡 Backend Response: ${result.message || 'Success'}`);
      passed++;
    } else if (result.status === 404) {
      console.log(`   ❌ FAIL - Route not found (404)`);
      console.log(`   📡 Backend Response: ${result.error}`);
      failed++;
    } else if (result.status === 'NETWORK_ERROR') {
      console.log(`   ❌ FAIL - Network error`);
      console.log(`   📡 Error: ${result.error}`);
      failed++;
    } else {
      console.log(`   ⚠️  UNEXPECTED - Status: ${result.status}`);
      console.log(`   📡 Response: ${result.error || result.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round(passed / (passed + failed) * 100)}%`);

  if (failed === 0) {
    console.log(`\n🎉 All tests passed! API Integration is working correctly.`);
  } else {
    console.log(`\n⚠️  Some tests failed. Check the route mappings and backend availability.`);
  }

  return failed === 0;
}

// Run the tests
runTests().catch(console.error);