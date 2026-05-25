import apiService from '@/app/services/api';

// Test the authentication directly
async function testAuthentication() {
  console.log('Testing authentication...');
  
  try {
    console.log('Attempting login with test credentials...');
    const response = await apiService.login('dityo.enggar@gmail.com', 'password');
    console.log('Login response:', response);
    
    const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
    if (isObj(response) && response.success) {
      console.log('✅ Login successful!');
      console.log('User:', response.user);
      console.log('Token:', response.token);
      
      // Test getting authenticated user
      console.log('Testing getAuthenticatedUser...');
      const userResponse = await apiService.getAuthenticatedUser();
      console.log('Authenticated user response:', userResponse);
      
      if (isObj(userResponse) && userResponse.success) {
        console.log('✅ Get authenticated user successful!');
        console.log('User data:', userResponse.user);
      }
    } else if (isObj(response)) {
      console.log('❌ Login failed:', response.message);
    }
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Export for use in browser console
declare global {
  interface Window {
    testAuth: () => Promise<void>;
  }
}

window.testAuth = testAuthentication;

console.log('Authentication test ready. Run testAuth() in console to test.');