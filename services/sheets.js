const { google } = require('googleapis');

const keyData = JSON.parse(
  Buffer.from(process.env.GOOGLE_KEY_BASE64, 'base64').toString('utf-8')
);

const auth = new google.auth.GoogleAuth({
  credentials: keyData,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets('v4');

exports.logToSheet = async ({ clientId, name, email, phone, address, accessInfo, summary }) => {
  const spreadsheetId = process.env.SPREADSHEET_ID;

  if (!spreadsheetId) {
    console.error('❌ SPREADSHEET_ID is missing from environment variables');
    throw new Error('Missing required environment variable: SPREADSHEET_ID');
  }

  const client = await auth.getClient();

  await sheets.spreadsheets.values.append({
    auth: client,
    spreadsheetId,
    range: 'Leads!A1',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        new Date().toISOString(),
        clientId || '',
        name || '',
        email || '',
        phone || '',
        address || '',
        accessInfo || '',
        summary || ''
      ]]
    }
  });
};
