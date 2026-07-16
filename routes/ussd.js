const express = require('express');
const router = express.Router();
const dataService = require('../data/index');

// USSD Session Storage (in-memory for demo)
let ussdSessions = {};

// Main USSD Handler
router.post('/ussd', (req, res) => {
    const { sessionId, phoneNumber, text } = req.body;
    
    let response = '';
    let session = ussdSessions[sessionId] || { step: 0, data: {} };

    // Main Menu
    if (text === '') {
        response = `CON Welcome to AGRICHAIN 360
1. Register as Farmer
2. Check My Crops
3. Book Drying Service
4. View Quality Passport
5. Check Payments
0. Exit`;
    } 
    // Register as Farmer
    else if (text === '1') {
        session.step = 1;
        response = `CON Enter your National ID:`;
    } 
    else if (session.step === 1) {
        session.data.nationalId = text;
        session.step = 2;
        response = `CON Enter your full name:`;
    } 
    else if (session.step === 2) {
        session.data.name = text;
        session.step = 3;
        response = `CON Select your district:
1. Jinja
2. Iganga
3. Kamuli
4. Mayuge`;
    } 
    else if (session.step === 3) {
        const districts = ['Jinja', 'Iganga', 'Kamuli', 'Mayuge'];
        session.data.district = districts[parseInt(text) - 1] || 'Jinja';
        session.step = 4;
        response = `CON Enter your main crop:
1. Maize
2. Coffee
3. Cocoa
4. Groundnuts`;
    } 
    else if (session.step === 4) {
        const crops = ['Maize', 'Coffee', 'Cocoa', 'Groundnuts'];
        session.data.crop = crops[parseInt(text) - 1] || 'Maize';
        
        // Save farmer (simulated)
        const farmerId = 'F' + Date.now().toString().slice(-6);
        
        response = `END Registration Successful!
Your Farmer ID: ${farmerId}
District: ${session.data.district}
Crop: ${session.data.crop}

You can now book drying services.`;
        
        // Clear session
        delete ussdSessions[sessionId];
    } 
    // Check My Crops
    else if (text === '2') {
        response = `CON Your Crops:
1. Maize - Batch B247 (Ready)
2. Coffee - Batch B155 (Drying)
0. Back to Main Menu`;
    } 
    // Book Drying Service
    else if (text === '3') {
        response = `CON Select crop to dry:
1. Maize (B247) - 487kg
2. Coffee (B155) - 320kg
3. Cocoa (B201) - 180kg`;
    } 
    else if (text.startsWith('3*')) {
        const choice = text.split('*')[1];
        const crops = {
            '1': { name: 'Maize', kg: 487, rate: 200 },
            '2': { name: 'Coffee', kg: 320, rate: 400 },
            '3': { name: 'Cocoa', kg: 180, rate: 500 }
        };
        const crop = crops[choice];
        
        if (crop) {
            const cost = crop.kg * crop.rate;
            response = `END Drying Booked!
Crop: ${crop.name}
Quantity: ${crop.kg}kg
Cost: UGX ${cost}
Drying starts in 2 hours.
You will receive SMS when ready.`;
        } else {
            response = `END Invalid selection.`;
        }
    } 
    // View Quality Passport
    else if (text === '4') {
        response = `CON Select batch:
1. B247 - Maize (Verified)
2. B155 - Coffee (Verified)
3. B201 - Cocoa (Pending)`;
    } 
    else if (text.startsWith('4*')) {
        const batch = text.split('*')[1];
        response = `END Digital Quality Passport
Batch: B${batch}247
Status: VERIFIED
Moisture: 13.2%
Aflatoxin: PASS
QR: agrichain360.com/passport/B${batch}247`;
    } 
    // Check Payments
    else if (text === '5') {
        response = `END Your Payments:
+ UGX 2,570,000 (Maize Sale - 14 Jul)
- UGX 97,400 (Drying Fee)
Balance: UGX 2,472,600`;
    } 
    else {
        response = `END Thank you for using AGRICHAIN 360.`;
        delete ussdSessions[sessionId];
    }

    // Save session
    if (session.step > 0) {
        ussdSessions[sessionId] = session;
    }

    res.set('Content-Type', 'text/plain');
    res.send(response);
});

// USSD Test Page
router.get('/ussd-test', (req, res) => {
    res.render('layout', {
        title: 'USSD Simulator — AGRICHAIN 360',
        page: 'ussd-test',
        data: {},
        body: 'ussdTest'
    });
});

module.exports = router;