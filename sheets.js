const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: 'services/service-account.json',
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
