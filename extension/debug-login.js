// Debug script untuk login extension
// Tambahkan ini ke console browser untuk debugging

// Debug login function
async function debugLogin(email, password) {
  console.log('🔍 Debug Login Started');
  console.log('Email:', email);
  console.log('Password length:', password.length);
  
  try {
    console.log('📡 Sending request to:', 'https://yapper-twitter.vercel.app/api/login-supabase');
    
    const response = await fetch('https://yapper-twitter.vercel.app/api/login-supabase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📄 Response data:', data);
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('Token:', data.token ? 'Present' : 'Missing');
      console.log('User ID:', data.userId);
      console.log('Role:', data.role);
    } else {
      console.log('❌ Login failed!');
      console.log('Error:', data.error || data.message);
    }
    
    return { success: response.ok, data };
    
  } catch (error) {
    console.log('💥 Network error:', error);
    return { success: false, error: error.message };
  }
}

// Debug storage
function debugStorage() {
  console.log('🔍 Debug Storage');
  chrome.storage.local.get(null, (result) => {
    console.log('📦 All storage data:', result);
  });
}

// Debug Supabase connection
async function debugSupabaseConnection() {
  console.log('🔍 Debug Supabase Connection');
  
  try {
    const response = await fetch('https://yapper-twitter.vercel.app/api/validate-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('📊 Supabase test response:', response.status);
    const data = await response.json();
    console.log('📄 Supabase test data:', data);
    
  } catch (error) {
    console.log('💥 Supabase connection error:', error);
  }
}

// Clear storage
function clearStorage() {
  console.log('🧹 Clearing storage...');
  chrome.storage.local.clear(() => {
    console.log('✅ Storage cleared');
  });
}

// Test with demo credentials
async function testDemoLogin() {
  console.log('🧪 Testing demo login...');
  
  const demoCredentials = [
    { email: 'demo@example.com', password: 'demo123' },
    { email: 'test@example.com', password: 'test123' }
  ];
  
  for (const cred of demoCredentials) {
    console.log(`\n🔍 Testing: ${cred.email}`);
    const result = await debugLogin(cred.email, cred.password);
    console.log('Result:', result);
  }
}

// Export functions untuk console
window.debugLogin = debugLogin;
window.debugStorage = debugStorage;
window.debugSupabaseConnection = debugSupabaseConnection;
window.clearStorage = clearStorage;
window.testDemoLogin = testDemoLogin;

console.log('🔧 Debug tools loaded!');
console.log('Available functions:');
console.log('- debugLogin(email, password)');
console.log('- debugStorage()');
console.log('- debugSupabaseConnection()');
console.log('- clearStorage()');
console.log('- testDemoLogin()'); 