const puppeteer = require('puppeteer');
const path = require('path');

async function testVMTravelsForm() {
    console.log('🚀 Starting VM Travels Form Test...');
    
    const browser = await puppeteer.launch({ 
        headless: false, // Set to true to run in background
        defaultViewport: null 
    });
    
    const page = await browser.newPage();
    
    try {
        // Open the VM Travels website
        const htmlPath = path.join(__dirname, 'index.html');
        await page.goto(`file://${htmlPath}`);
        console.log('✅ Opened VM Travels website');
        
        // Wait for the form to load
        await page.waitForSelector('#bookingForm', { timeout: 10000 });
        console.log('✅ Form loaded successfully');
        
        // Fill out the form - Local Tab
        console.log('📝 Filling out Local booking form...');
        
        // Fill common fields
        await page.type('input[name="name"]', 'Test User');
        await page.type('input[name="phone"]', '9876543210');
        await page.type('input[name="email"]', 'test@example.com');
        
        // Select pickup location
        await page.select('select[name="pickup"]', 'MG Road');
        
        // Select drop location
        await page.select('select[name="drop"]', 'Banashankari');
        
        // Set travel date (tomorrow)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split('T')[0];
        await page.type('input[name="travelDate"]', dateString);
        
        // Set time
        await page.select('select[name="hour"]', '9');
        await page.select('select[name="minute"]', '00');
        await page.select('select[name="period"]', 'AM');
        
        console.log('✅ Form filled successfully');
        
        // Submit the form
        console.log('📤 Submitting form...');
        
        // Click submit button
        await page.click('button[type="submit"]');
        
        // Wait for vehicle modal to appear
        await page.waitForSelector('#vehicleModal', { timeout: 5000 });
        console.log('✅ Vehicle modal opened');
        
        // Select first available vehicle
        await page.waitForSelector('.vehicle-card', { timeout: 5000 });
        await page.click('.vehicle-card:first-child');
        console.log('✅ Vehicle selected');
        
        // Confirm booking
        await page.click('#confirmBookingBtn');
        console.log('✅ Booking confirmed');
        
        // Wait for success notification
        await page.waitForSelector('.notification.success', { timeout: 10000 });
        console.log('✅ Success notification appeared');
        
        // Check console logs for Google Form submission
        const logs = [];
        page.on('console', msg => {
            if (msg.text().includes('Booking submitted successfully') || 
                msg.text().includes('SUBMITTING TO GOOGLE FORM') ||
                msg.text().includes('✅')) {
                logs.push(msg.text());
                console.log('📋 Console:', msg.text());
            }
        });
        
        // Wait a bit more to capture all logs
        await page.waitForTimeout(3000);
        
        // Check if response list is updated
        const responseList = await page.$('#bookingList');
        if (responseList) {
            const bookingCards = await page.$$('.booking-card');
            console.log(`✅ Found ${bookingCards.length} booking(s) in response list`);
        }
        
        // Test results
        const hasSuccessNotification = await page.$('.notification.success') !== null;
        const hasBookingInList = await page.$('.booking-card') !== null;
        
        console.log('\n🎯 TEST RESULTS:');
        console.log(`✅ Success Notification: ${hasSuccessNotification ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Booking in Response List: ${hasBookingInList ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Console Logs: ${logs.length > 0 ? 'PASS' : 'FAIL'}`);
        
        if (logs.length > 0) {
            console.log('\n📋 Google Form Submission Logs:');
            logs.forEach(log => console.log(`   ${log}`));
        }
        
        console.log('\n🎉 Test completed! Check your Google Forms for the submission.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        // Take screenshot for debugging
        await page.screenshot({ path: 'test-error.png' });
        console.log('📸 Screenshot saved as test-error.png');
    }
    
    // Keep browser open for manual inspection
    console.log('\n⏳ Keeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);
    
    await browser.close();
    console.log('🏁 Test finished');
}

// Run the test
testVMTravelsForm().catch(console.error);















