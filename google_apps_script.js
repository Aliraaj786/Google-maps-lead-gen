/**
 * GOOGLE APPS SCRIPT FOR GOOGLE SHEETS SYNC
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Click "Extensions" in the top menu, then select "Apps Script".
 * 3. Delete any code in the editor, and paste this entire code block.
 * 4. (Optional) If you created a standalone script, paste your Spreadsheet ID below.
 * 5. Click the Save icon (floppy disk).
 * 6. Click "Deploy" > "New deployment".
 * 7. Set the Select type to "Web app" (click gear icon next to "Select type").
 * 8. Set "Execute as" to "Me".
 * 9. Set "Who has access" to "Anyone".
 * 10. Click "Deploy", authorize permissions, and copy the "Web app URL".
 */

// OPTIONAL: If you created this script standalone (at script.google.com) 
// instead of from within your sheet, paste your Sheet's ID here:
// You can find the ID in your sheet's URL: https://docs.google.com/spreadsheets/d/ SPREADSHEET_ID /edit
var STANDALONE_SPREADSHEET_ID = ""; 

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No data received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = JSON.parse(e.postData.contents);
    
    var ss = null;
    if (STANDALONE_SPREADSHEET_ID && STANDALONE_SPREADSHEET_ID.trim() !== "") {
      ss = SpreadsheetApp.openById(STANDALONE_SPREADSHEET_ID);
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    if (!ss) {
      throw new Error("Could not find Google Sheet. If this is a standalone script, please open google_apps_script.js and enter your STANDALONE_SPREADSHEET_ID on line 16.");
    }
    
    var sheet = ss.getActiveSheet();
    
    // Check if sheet is empty (row count is 0, or just check cell A1)
    var isNewSheet = sheet.getLastRow() === 0;
    if (isNewSheet) {
      sheet.appendRow(["Business Name", "Phone", "Address", "Category/Summary", "Email", "Google Maps URL"]);
      // Format header row
      var headerRange = sheet.getRange(1, 1, 1, 6);
      headerRange.setFontWeight("bold");
      headerRange.setBackgroundColor("#10b981"); // Emerald green
      headerRange.setFontColor("#ffffff");
    }
    
    // Append each business
    var addedCount = 0;
    data.forEach(function(lead) {
      sheet.appendRow([
        lead.name || "",
        lead.phone || "",
        lead.address || "",
        lead.category || "",
        lead.email || "",
        lead.url || ""
      ]);
      addedCount++;
    });
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, 6);
    
    var response = { status: "success", message: "Successfully synced " + addedCount + " leads!", count: addedCount };
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    var errResponse = { status: "error", message: error.toString() };
    return ContentService.createTextOutput(JSON.stringify(errResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Sync Endpoint is Active!" }))
    .setMimeType(ContentService.MimeType.JSON);
}
