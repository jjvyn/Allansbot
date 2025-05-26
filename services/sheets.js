const { google } = require('googleapis');

const keyData = JSON.parse(Buffer.from(process.env.GOOGLE_KEY_BASE64, 'base64').toString('utf-8'));

const auth = new google.auth.GoogleAuth({
  credentials: keyData,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets('v4');

exports.logToSheet = async ({ clientId, message, reply }) => {
  const client = await auth.getClient();
  await sheets.spreadsheets.values.append({
    auth: client,
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Leads!A1',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[new Date().toISOString(), clientId, message, reply]]
    }
  });
};
