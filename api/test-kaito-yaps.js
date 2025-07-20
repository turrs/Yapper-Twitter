// Test script for Kaito Yaps API endpoint
// Run this to test the endpoint locally

const testUsername = 'elonmusk'; // Test with a known username
const testParams = {
  duration: '30d',
  topic_id: 'CYSIC',
  top_n: '100'
};

async function testKaitoYapsAPI() {
  console.log('Testing Kaito Yaps API endpoint...');
  
  try {
    // Test the API endpoint with custom parameters
    const params = new URLSearchParams({
      username: testUsername,
      ...testParams
    });
    
    const response = await fetch(`https://hub.kaito.ai/api/v1/gateway/ai/kol/mindshare/top-leaderboard?${params.toString()}`);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ API test successful!');
      console.log(`Found ${data.total_count} yaps for @${data.username}`);
      console.log('Settings used:', data.settings);
      
      if (data.yaps && data.yaps.length > 0) {
        console.log('Sample yap:', data.yaps[0]);
      } else {
        console.log('No yaps found for this user in the leaderboard');
      }
    } else {
      console.log('❌ API test failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testKaitoYapsAPI();

// Export for use in other test files
module.exports = { testKaitoYapsAPI }; 