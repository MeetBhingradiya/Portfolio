/**
 * Test script for Contact Form and Ticket System
 * Run with: node test-contact-system.js
 */

const baseUrl = 'http://localhost:3000'; // Adjust if different

// Test data
const testFormData = {
    name: 'Test User',
    email: 'test@example.com',
    subject: 'Test Contact Form',
    message: 'This is a test message to verify the contact form functionality.',
    projectType: 'web-development'
};

async function testContactForm() {
    console.log('🧪 Testing Contact Form...');
    
    try {
        const response = await fetch(`${baseUrl}/api/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testFormData)
        });
        
        const data = await response.json();
        console.log('✅ Contact Form Response:', data);
        
        return data;
    } catch (error) {
        console.error('❌ Contact Form Error:', error.message);
        return null;
    }
}

async function testTicketSystem() {
    console.log('🎫 Testing Ticket System...');
    
    try {
        const response = await fetch(`${baseUrl}/api/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...testFormData,
                subject: 'Test Ticket Creation'
            })
        });
        
        const data = await response.json();
        console.log('✅ Ticket Creation Response:', data);
        
        if (data.success && data.ticket) {
            // Test ticket retrieval
            console.log('🔍 Testing Ticket Retrieval...');
            const statusResponse = await fetch(`${baseUrl}/api/tickets?id=${data.ticket.id}&email=${testFormData.email}`);
            const statusData = await statusResponse.json();
            console.log('✅ Ticket Status Response:', statusData);
        }
        
        return data;
    } catch (error) {
        console.error('❌ Ticket System Error:', error.message);
        return null;
    }
}

async function testRateLimit() {
    console.log('⏱️  Testing Rate Limiting...');
    
    // Send first request
    const first = await testContactForm();
    
    if (first && first.success) {
        console.log('✅ First request succeeded');
        
        // Send second request immediately (should be rate limited)
        console.log('🚫 Testing rate limit with immediate second request...');
        const second = await testContactForm();
        
        if (second && second.rateLimited) {
            console.log('✅ Rate limiting is working correctly');
            console.log(`⏰ Time remaining: ${second.timeRemaining}ms`);
        } else if (second && second.success) {
            console.log('⚠️  Warning: Rate limiting may not be working (second request succeeded)');
        }
    }
}

async function runAllTests() {
    console.log('🚀 Starting Contact System Tests...\n');
    
    // Test 1: Contact Form
    // await testContactForm();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Ticket System
    await testTicketSystem();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Rate Limiting
    await testRateLimit();
    
    console.log('\n✨ All tests completed!');
    console.log('\n📝 Notes:');
    console.log('- Make sure your Next.js server is running on http://localhost:3000');
    console.log('- Configure SMTP settings in .env.local for email functionality');
    console.log('- Check browser console and network tab for detailed debugging');
    console.log('- Rate limiting resets every 3 hours per IP address');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
    runAllTests().catch(console.error);
}

// Export for browser testing
if (typeof window !== 'undefined') {
    window.testContactSystem = {
        testContactForm,
        testTicketSystem,
        testRateLimit,
        runAllTests
    };
}
