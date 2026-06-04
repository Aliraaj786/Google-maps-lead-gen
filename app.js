// State management
let rawLeads = [];
let filteredLeads = [];

// DOM Elements
const jsonInput = document.getElementById('jsonInput');
const clearBtn = document.getElementById('clearBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');

const filterTypeSelect = document.getElementById('filterType');
const scriptUrlInput = document.getElementById('scriptUrl');
const copyScriptCodeBtn = document.getElementById('copyScriptCodeBtn');

const totalLeadsVal = document.getElementById('totalLeadsVal');
const filteredLeadsVal = document.getElementById('filteredLeadsVal');
const percentageVal = document.getElementById('percentageVal');

const copyClipboardBtn = document.getElementById('copyClipboardBtn');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');
const syncSheetsBtn = document.getElementById('syncSheetsBtn');

const previewTable = document.getElementById('previewTable');
const previewCount = document.getElementById('previewCount');
const statusIndicator = document.getElementById('statusIndicator');
const toast = document.getElementById('toast');

// Sample Data
const sampleJson = [
  {
    "title": "Starbucks Coffee",
    "phone": "+1 202-555-0143",
    "address": "455 Massachusetts Ave NW, Washington, DC",
    "categoryName": "Coffee Shop",
    "website": "https://www.starbucks.com",
    "url": "https://maps.google.com/?cid=123"
  },
  {
    "title": "Elite Plumbing Services",
    "phone": "+1 202-555-0199",
    "address": "1200 K St NW, Washington, DC",
    "categoryName": "Plumber",
    "website": "",
    "url": "https://maps.google.com/?cid=456",
    "email": "info@eliteplumbingdc.com"
  },
  {
    "title": "Downtown Bakery & Cafe",
    "phone": "+1 202-555-0188",
    "address": "700 11th St NW, Washington, DC",
    "categoryName": "Bakery",
    "website": "http://downtownbakery.com",
    "url": "https://maps.google.com/?cid=789"
  },
  {
    "title": "Apex Auto Repair",
    "phone": "+1 202-555-0177",
    "address": "1625 I St NW, Washington, DC",
    "categoryName": "Auto Repair Shop",
    "website": "",
    "url": "https://maps.google.com/?cid=101"
  },
  {
    "title": "Green Leaf Landscaping",
    "phone": "+1 202-555-0122",
    "address": "901 New York Ave NW, Washington, DC",
    "categoryName": "Landscaper",
    "website": "",
    "url": "https://maps.google.com/?cid=202"
  }
];

// Hardcoded Google Apps Script code to copy easily
const appsScriptCode = `/**
 * GOOGLE APPS SCRIPT FOR GOOGLE SHEETS SYNC
 * 
 * Paste this entire script in Extensions > Apps Script in Google Sheets.
 * Deploy as Web App with Execute as: "Me" and Who has access: "Anyone".
 */
var STANDALONE_SPREADSHEET_ID = ""; // Paste Sheet ID if using script.google.com directly

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
      throw new Error("Could not find Google Sheet. Please set STANDALONE_SPREADSHEET_ID.");
    }
    
    var sheet = ss.getActiveSheet();
    var isNewSheet = sheet.getLastRow() === 0;
    if (isNewSheet) {
      sheet.appendRow(["Business Name", "Phone", "Website", "Address", "Category/Summary", "Email", "Google Maps URL"]);
      var headerRange = sheet.getRange(1, 1, 1, 7);
      headerRange.setFontWeight("bold");
      headerRange.setBackgroundColor("#10b981");
      headerRange.setFontColor("#ffffff");
    }
    
    var addedCount = 0;
    data.forEach(function(lead) {
      sheet.appendRow([
        lead.name || "",
        lead.phone || "",
        lead.website || "",
        lead.address || "",
        lead.category || "",
        lead.email || "",
        lead.url || ""
      ]);
      addedCount++;
    });
    
    sheet.autoResizeColumns(1, 7);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", count: addedCount }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

// Toast Helper
function showToast(message, isError = false) {
  toast.textContent = message;
  if (isError) {
    toast.classList.add('error');
  } else {
    toast.classList.remove('error');
  }
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// Status Helper
function updateStatus(text, type = 'green') {
  if (statusIndicator) {
    statusIndicator.innerHTML = `<span class="status-dot ${type}"></span>${text}`;
  }
}

// Processing Logic
function processData(silent = false) {
  const inputVal = jsonInput.value.trim();
  if (!inputVal) {
    if (!silent) showToast('Please paste JSON data first.', true);
    // Reset stats
    totalLeadsVal.textContent = '-';
    filteredLeadsVal.textContent = '-';
    percentageVal.textContent = '-';
    filteredLeads = [];
    renderTable();
    // Disable buttons
    copyClipboardBtn.disabled = true;
    downloadCsvBtn.disabled = true;
    syncSheetsBtn.disabled = true;
    updateStatus('Ready to process');
    return;
  }

  try {
    const parsed = JSON.parse(inputVal);
    
    // Support either single object or array of objects
    rawLeads = Array.isArray(parsed) ? parsed : [parsed];
    
    if (rawLeads.length === 0) {
      if (!silent) showToast('The JSON array is empty.', true);
      return;
    }

    updateStatus('Filtering data...', 'amber');
    
    const filterMode = filterTypeSelect.value;
    
    // Filter businesses based on the mode selected
    filteredLeads = rawLeads.filter(lead => {
      const hasWeb = lead.website && typeof lead.website === 'string' && lead.website.trim() !== '';
      if (filterMode === 'no-website') {
        return !hasWeb;
      } else if (filterMode === 'has-website') {
        return hasWeb;
      } else {
        return true; // all-leads
      }
    }).map(lead => {
      // Robust Address Resolution
      let resolvedAddress = 'No Address';
      if (lead.address && typeof lead.address === 'string' && lead.address.trim() !== '') {
        resolvedAddress = lead.address;
      } else if (lead.fullAddress && typeof lead.fullAddress === 'string' && lead.fullAddress.trim() !== '') {
        resolvedAddress = lead.fullAddress;
      } else if (lead.addressSnippet && typeof lead.addressSnippet === 'string' && lead.addressSnippet.trim() !== '') {
        resolvedAddress = lead.addressSnippet;
      } else if (lead.street && typeof lead.street === 'string' && lead.street.trim() !== '') {
        const parts = [
          lead.street,
          lead.city,
          lead.state,
          lead.postalCode,
          lead.countryCode
        ].filter(part => part && typeof part === 'string' && part.trim() !== '');
        resolvedAddress = parts.join(', ');
      }
      
      // Robust Email Resolution
      let resolvedEmail = 'No Email';
      if (lead.email && typeof lead.email === 'string' && lead.email.trim() !== '') {
        resolvedEmail = lead.email;
      } else if (lead.emails && Array.isArray(lead.emails) && lead.emails.length > 0) {
        resolvedEmail = lead.emails[0];
      } else if (lead.emails && typeof lead.emails === 'string' && lead.emails.trim() !== '') {
        resolvedEmail = lead.emails;
      } else if (lead.contactInfo && typeof lead.contactInfo === 'object') {
        if (lead.contactInfo.email && typeof lead.contactInfo.email === 'string') {
          resolvedEmail = lead.contactInfo.email;
        } else if (lead.contactInfo.emails && Array.isArray(lead.contactInfo.emails) && lead.contactInfo.emails.length > 0) {
          resolvedEmail = lead.contactInfo.emails[0];
        }
      }

      // Normalize columns
      return {
        name: lead.title || lead.name || 'Unnamed Business',
        phone: lead.phone || lead.phoneNumber || lead.phoneUnformatted || 'No Phone',
        website: lead.website || '',
        address: resolvedAddress,
        category: lead.categoryName || lead.subTitle || 'Business',
        email: resolvedEmail,
        url: lead.url || lead.link || ''
      };
    });

    // Update statistics UI
    totalLeadsVal.textContent = rawLeads.length;
    filteredLeadsVal.textContent = filteredLeads.length;
    const percentage = rawLeads.length > 0 ? Math.round((filteredLeads.length / rawLeads.length) * 100) : 0;
    percentageVal.textContent = `${percentage}%`;

    // Render Preview Table
    renderTable();

    // Enable/Disable Actions
    const hasData = filteredLeads.length > 0;
    copyClipboardBtn.disabled = !hasData;
    downloadCsvBtn.disabled = !hasData;
    syncSheetsBtn.disabled = !hasData;

    updateStatus(`Processed ${rawLeads.length} items`);
    if (!silent) showToast(`Successfully filtered ${filteredLeads.length} target leads!`);
  } catch (error) {
    if (!silent) {
      console.error(error);
      updateStatus('Error parsing JSON', 'red');
      showToast('Invalid JSON format. Please check your data syntax.', true);
    } else {
      updateStatus('Typing JSON...', 'amber');
    }
  }
}

// Event Listeners
clearBtn.addEventListener('click', () => {
  jsonInput.value = '';
  processData(true);
});

loadSampleBtn.addEventListener('click', () => {
  jsonInput.value = JSON.stringify(sampleJson, null, 2);
  processData(false);
  updateStatus('Sample data loaded');
});

copyScriptCodeBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(appsScriptCode)
    .then(() => {
      showToast('Google Apps Script code copied to clipboard!');
    })
    .catch(err => {
      showToast('Failed to copy code: ' + err, true);
    });
});

// Auto-process as user types or pastes
jsonInput.addEventListener('input', () => {
  processData(true);
});

// Auto-process on filter selection change
filterTypeSelect.addEventListener('change', () => {
  processData(true);
});

// Render Table Function
function renderTable() {
  const tbody = previewTable.querySelector('tbody');
  tbody.innerHTML = '';
  previewCount.textContent = filteredLeads.length;

  if (filteredLeads.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-state-row">
        <td colspan="5" class="empty-state">
          <div class="empty-icon">📂</div>
          <div class="empty-text">No businesses matching filter criteria. All entries had websites!</div>
        </td>
      </tr>
    `;
    return;
  }

  filteredLeads.forEach(lead => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td title="${lead.name}">${escapeHtml(lead.name)}</td>
      <td title="${lead.phone}">${escapeHtml(lead.phone)}</td>
      <td title="${lead.website}">${lead.website ? `<a href="${escapeHtml(lead.website)}" target="_blank" style="color: var(--accent-indigo); text-decoration: none;">${escapeHtml(lead.website)}</a>` : '-'}</td>
      <td title="${lead.category}">${escapeHtml(lead.category)}</td>
      <td title="${lead.email}">${escapeHtml(lead.email)}</td>
      <td title="${lead.address}">${escapeHtml(lead.address)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Copy to Clipboard (Tab-separated)
copyClipboardBtn.addEventListener('click', () => {
  if (filteredLeads.length === 0) return;

  const headers = ['Business Name', 'Phone Number', 'Website', 'Category/Summary', 'Email', 'Address', 'Google Maps URL'];
  const rows = [headers.join('\t')];

  filteredLeads.forEach(lead => {
    rows.push([
      lead.name,
      lead.phone,
      lead.website,
      lead.category,
      lead.email,
      lead.address,
      lead.url
    ].join('\t'));
  });

  const clipboardText = rows.join('\n');
  navigator.clipboard.writeText(clipboardText)
    .then(() => {
      showToast('Data copied! Press Ctrl+V in Google Sheets.');
    })
    .catch(err => {
      showToast('Failed to copy: ' + err, true);
    });
});

// Download CSV File
downloadCsvBtn.addEventListener('click', () => {
  if (filteredLeads.length === 0) return;

  const headers = ['Business Name', 'Phone Number', 'Website', 'Category/Summary', 'Email', 'Address', 'Google Maps URL'];
  const rows = [headers];

  filteredLeads.forEach(lead => {
    rows.push([
      `"${lead.name.replace(/"/g, '""')}"`,
      `"${lead.phone.replace(/"/g, '""')}"`,
      `"${lead.website.replace(/"/g, '""')}"`,
      `"${lead.category.replace(/"/g, '""')}"`,
      `"${lead.email.replace(/"/g, '""')}"`,
      `"${lead.address.replace(/"/g, '""')}"`,
      `"${lead.url.replace(/"/g, '""')}"`
    ]);
  });

  const csvContent = rows.map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `filtered_gmaps_leads_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showToast('CSV downloaded successfully!');
});

// Sync to Google Sheets via Web App API
syncSheetsBtn.addEventListener('click', async () => {
  const url = scriptUrlInput.value.trim();
  if (!url) {
    showToast('Please enter your Google Apps Script URL.', true);
    return;
  }

  if (filteredLeads.length === 0) return;

  updateStatus('Syncing to Google Sheets...', 'amber');
  syncSheetsBtn.disabled = true;

  try {
    // Send as text/plain body without headers to prevent preflight OPTIONS check (CORS)
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors', // Follow redirect but may encounter CORS block if headers aren't perfect
      body: JSON.stringify(filteredLeads)
    });

    const result = await response.json();
    if (result.status === 'success') {
      showToast(`Sheets Sync Completed! Added ${result.count} leads.`);
      updateStatus(`Synced ${result.count} items`);
    } else {
      showToast(`Sync Error: ${result.message}`, true);
      updateStatus('Sync Failed', 'red');
    }
  } catch (error) {
    console.error(error);
    // Note: Due to Google redirect behaviors, sometimes a CORS error is thrown 
    // even though the data was successfully posted and added to the sheet.
    showToast('Sync request sent! Verify your Google Sheet to confirm updates.', false);
    updateStatus('Sync Complete (Verify Sheet)');
  } finally {
    syncSheetsBtn.disabled = false;
  }
});

// Contact Modal & WhatsApp Redirect
const contactModal = document.getElementById('contactModal');
const openContactModalBtn = document.getElementById('openContactModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const contactForm = document.getElementById('contactForm');

if (openContactModalBtn && contactModal && closeModalBtn && contactForm) {
  openContactModalBtn.addEventListener('click', () => {
    contactModal.classList.add('open');
  });

  closeModalBtn.addEventListener('click', () => {
    contactModal.classList.remove('open');
  });

  contactModal.addEventListener('click', (e) => {
    if (e.target === contactModal) {
      contactModal.classList.remove('open');
    }
  });

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const clientName = document.getElementById('clientName').value.trim();
    const projectType = document.getElementById('projectType').value;
    const projectDetails = document.getElementById('projectDetails').value.trim();
    
    const messageText = `Hello Sharim Studios! I would like to inquire about a custom project.\n\nName: ${clientName}\nProject Type: ${projectType}\nDetails: ${projectDetails}`;
    const whatsappUrl = `https://wa.me/923361831110?text=${encodeURIComponent(messageText)}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Reset and close
    contactForm.reset();
    contactModal.classList.remove('open');
    showToast('Redirecting to WhatsApp...');
  });
}
