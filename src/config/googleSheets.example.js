// Google Sheets Configuration Example
// Copy this file to googleSheets.js and fill in your values

// Set to true for development mode (uses dev spreadsheet)
// Set to false for production mode (uses production spreadsheet)
export const IS_DEV_MODE = false

// Development Google Sheets Configuration
export const DEV_SPREADSHEET_ID = 'YOUR_DEV_SPREADSHEET_ID_HERE'
export const DEV_GOOGLE_APPS_SCRIPT_ID = 'YOUR_DEV_SCRIPT_ID_HERE'

// Production Google Sheets Configuration
export const PROD_SPREADSHEET_ID = 'YOUR_PROD_SPREADSHEET_ID_HERE'
export const PROD_GOOGLE_APPS_SCRIPT_ID = 'YOUR_PROD_SCRIPT_ID_HERE'

/**
 * Returns the current Spreadsheet ID based on the mode
 * @returns {string} Spreadsheet ID
 */
export function getSpreadsheetId() {
  return IS_DEV_MODE ? DEV_SPREADSHEET_ID : PROD_SPREADSHEET_ID
}

/**
 * Returns the current Google Apps Script ID based on the mode
 * @returns {string} Google Apps Script ID
 */
export function getGoogleAppsScriptId() {
  return IS_DEV_MODE ? DEV_GOOGLE_APPS_SCRIPT_ID : PROD_GOOGLE_APPS_SCRIPT_ID
}

