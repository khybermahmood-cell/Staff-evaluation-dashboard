// ============================================
// TEACHER EVALUATION SYSTEM - CONFIGURATION
// ============================================

const CONFIG = {
    // Your Google Sheet ID (publish to web first)
    SHEET_ID: 'YOUR-GOOGLE-SHEET-ID-HERE',
    
    // Your 5 Google Form IDs
    FORMS: {
        year6: '1CaerPP3noIXpDf2Amk8LXxl3A0YDd4Z7wUus2THUEZ0',
        year45: '14GerLJ3FhRKvYqAE8DZVWboKcjugoHOuzq5iYg_ap5I',
        year7: '1Vaf3rP3Ms3vs7Ifd7hGTblxJ9TayBDZYfqxjysqI73E',
        year8: '1g3Hdld6UTPJITtEb3bDRXtaNm7AgKCuXQyz_m6UOg7A',
        year9: '1ZoLaSPbwHjoFreuEun7I7kw0rsq8LviAQ75z9vJ5CEo'
    },
    
    // Rating scale
    RATING_SCALE: {
        min: 1,
        max: 4,
        labels: ['Poor', 'Fair', 'Good', 'Excellent']
    },
    
    // School year
    SCHOOL_YEAR: '2025/2026',
    
    // Chart colors
    COLORS: {
        primary: '#667eea',
        secondary: '#764ba2',
        rating1: '#ff4444',
        rating2: '#ffbb33',
        rating3: '#00C851',
        rating4: '#33b5e5'
    }
};

// ============================================
// GOOGLE SHEETS WEBHOOK SETUP
// ============================================

/*
TO AUTOMATE DATA FROM GOOGLE FORMS:

1. Create a Google Apps Script Web App:
   - Go to script.google.com
   - Create new project
   - Paste the webhook code below
   - Deploy as web app
   - Copy the URL to GITHUB_WEBHOOK_URL

2. Set up Form Submit triggers:
   - In Apps Script, go to Triggers
   - Add trigger: onFormSubmit
   - Choose your form
   - Function: sendToGitHub
*/

const WEBHOOK = {
    GITHUB_WEBHOOK_URL: 'YOUR-GITHUB-WEBHOOK-URL',
    
    // Apps Script code for Google Forms → GitHub
    APPS_SCRIPT_CODE: `
        function sendToGitHub(e) {
            const formResponse = e.response;
            const itemResponses = formResponse.getItemResponses();
            
            const data = {
                timestamp: formResponse.getTimestamp(),
                formId: e.source.getId(),
                responses: {}
            };
            
            itemResponses.forEach(item => {
                data.responses[item.getItem().getTitle()] = item.getResponse();
            });
            
            const options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            };
            
            UrlFetchApp.fetch('YOUR-GITHUB-WEBHOOK-URL', options);
        }
    `
};
