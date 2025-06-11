const { google } = require('googleapis');

// Decode base64-encoded credentials from environment variable
const keyData = JSON.parse(Buffer.from(process.env.GOOGLE_KEY_BASE64, 'base64').toString('utf-8'));

// Authenticate with Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: keyData,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets('v4');

// Exported function to log lead data to a Google Sheet
exports.logToSheet = async ({ clientId, name, email, phone, address, accessInfo, summary, imageUrls = [] }) => {
  try {
    const client = await auth.getClient();

    // Format the data for appending
    const values = [[
      new Date().toISOString(), // Timestamp
      clientId || '',            // Client ID
      name || '',                // Name
      email || '',               // Email
      phone || '',               // Phone
      address || '',             // Address
      accessInfo || '',          // Access Info
      summary || '',             // Chat Summary
      imageUrls.join(', ')       // Comma-separated image URLs
    ]];

    // Append the row to the 'Leads' sheet
    await sheets.spreadsheets.values.append({
      auth: client,
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Leads!A1',
      valueInputOption: 'RAW',
      requestBody: { values }
    });

    console.log(`✅ Lead logged to sheet for client: ${clientId}`);
  } catch (err) {
    console.error(`❌ Error logging lead to sheet for client ${clientId}:`, err);
  }
};
