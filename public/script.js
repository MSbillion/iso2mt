// Form submission handler
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('isoForm');
  const submitBtn = document.getElementById('submitBtn');
  const resultContainer = document.getElementById('resultContainer');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const mt103Result = document.getElementById('mt103Result');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', copyToClipboard);
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadMT103);
  }
});

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const submitBtn = document.getElementById('submitBtn');
  const resultContainer = document.getElementById('resultContainer');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const mt103Result = document.getElementById('mt103Result');

  // Validate form
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  try {
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    resultContainer.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');

    // Get form data
    const xmlData = getFormXML(form);

    // Send to server
    const response = await fetch('/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: xmlData,
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      // Display MT103 result
      displayMT103Result(result.mt103);
    } else {
      showError(result.message || 'Failed to convert ISO to MT103');
    }
  } catch (error) {
    console.error('Form submission error:', error);
    showError(`Error: ${error.message}`);
  } finally {
    // Reset button state
    submitBtn.disabled = false;
    submitBtn.textContent = 'Convert to MT103';
    loadingSpinner.classList.add('hidden');
  }
}

/**
 * Build XML from form data
 */
function getFormXML(form) {
  const formData = new FormData(form);
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<ISO20022>\n';

  // Map form fields to ISO 20022 XML structure
  const fieldMapping = {
    'messageType': 'MessageType',
    'senderId': 'SenderId',
    'receiverId': 'ReceiverId',
    'date': 'Date',
    'amount': 'Amount',
    'currency': 'Currency',
    'debitorName': 'DebitorName',
    'debitorAccountNumber': 'DebitorAccountNumber',
    'debitorBIC': 'DebitorBIC',
    'creditorName': 'CreditorName',
    'creditorAccountNumber': 'CreditorAccountNumber',
    'creditorBIC': 'CreditorBIC',
    'instructionId': 'InstructionId',
    'endToEndId': 'EndToEndId',
    'purpose': 'Purpose',
    'remittanceInfo': 'RemittanceInfo',
  };

  for (const [key, value] of formData.entries()) {
    if (value.trim()) {
      const xmlKey = fieldMapping[key] || key;
      xml += `  <${xmlKey}>${escapeXML(value)}</${xmlKey}>\n`;
    }
  }

  xml += '</ISO20022>';
  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXML(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Display MT103 result
 */
function displayMT103Result(mt103Content) {
  const resultContainer = document.getElementById('resultContainer');
  const mt103Result = document.getElementById('mt103Result');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  if (mt103Result) {
    mt103Result.textContent = mt103Content;
    mt103Result.setAttribute('data-content', mt103Content);
  }

  if (resultContainer) {
    resultContainer.classList.remove('hidden');
  }

  if (copyBtn) {
    copyBtn.style.display = 'inline-block';
  }

  if (downloadBtn) {
    downloadBtn.style.display = 'inline-block';
  }
}

/**
 * Copy MT103 result to clipboard
 */
async function copyToClipboard() {
  const mt103Result = document.getElementById('mt103Result');
  const copyBtn = document.getElementById('copyBtn');

  if (!mt103Result) return;

  const content = mt103Result.getAttribute('data-content') || mt103Result.textContent;

  try {
    await navigator.clipboard.writeText(content);

    // Visual feedback
    const originalText = copyBtn.textContent;
    const originalBg = copyBtn.style.backgroundColor;

    copyBtn.textContent = 'Copied!';
    copyBtn.style.backgroundColor = '#4CAF50';

    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.backgroundColor = originalBg;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    alert('Failed to copy to clipboard. Please try again.');
  }
}

/**
 * Download MT103 as file
 */
function downloadMT103() {
  const mt103Result = document.getElementById('mt103Result');
  const downloadBtn = document.getElementById('downloadBtn');

  if (!mt103Result) return;

  const content = mt103Result.getAttribute('data-content') || mt103Result.textContent;

  if (!content.trim()) {
    alert('No MT103 content to download');
    return;
  }

  // Create blob
  const blob = new Blob([content], { type: 'text/plain' });

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = generateFileName();
  document.body.appendChild(link);

  // Trigger download
  link.click();

  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  // Visual feedback
  const originalText = downloadBtn.textContent;
  downloadBtn.textContent = 'Downloaded!';
  setTimeout(() => {
    downloadBtn.textContent = originalText;
  }, 2000);
}

/**
 * Generate MT103 filename with timestamp
 */
function generateFileName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `MT103_${year}${month}${day}_${hours}${minutes}${seconds}.txt`;
}

/**
 * Display error message
 */
function showError(message) {
  const resultContainer = document.getElementById('resultContainer');
  const mt103Result = document.getElementById('mt103Result');

  if (mt103Result) {
    mt103Result.textContent = '';
    mt103Result.innerHTML = `<div class="error-message">${escapeXML(message)}</div>`;
  }

  if (resultContainer) {
    resultContainer.classList.remove('hidden');
  }

  // Hide action buttons
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  if (copyBtn) copyBtn.style.display = 'none';
  if (downloadBtn) downloadBtn.style.display = 'none';
}

/**
 * Clear form and results
 */
function clearForm() {
  const form = document.getElementById('isoForm');
  const resultContainer = document.getElementById('resultContainer');

  if (form) {
    form.reset();
  }

  if (resultContainer) {
    resultContainer.classList.add('hidden');
  }
}

/**
 * Validate amount field (numeric only)
 */
function validateAmount(input) {
  input.value = input.value.replace(/[^0-9.]/g, '');

  // Ensure only one decimal point
  const parts = input.value.split('.');
  if (parts.length > 2) {
    input.value = parts[0] + '.' + parts[1];
  }
}

/**
 * Format currency display
 */
function formatCurrency(amount, currency = 'USD') {
  if (!amount || isNaN(amount)) return '';

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  });

  return formatter.format(parseFloat(amount));
}

/**
 * Validate IBAN format
 */
function validateIBAN(iban) {
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
  return ibanRegex.test(iban.replace(/\s/g, ''));
}

/**
 * Validate BIC format
 */
function validateBIC(bic) {
  const bicRegex = /^[A-Z0-9]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  return bicRegex.test(bic.replace(/\s/g, ''));
}

/**
 * Auto-format IBAN with spaces
 */
function formatIBAN(input) {
  let value = input.value.replace(/\s/g, '').toUpperCase();
  let formatted = '';

  for (let i = 0; i < value.length; i++) {
    if (i > 0 && i % 4 === 0) {
      formatted += ' ';
    }
    formatted += value[i];
  }

  input.value = formatted;
}

/**
 * Export functions for testing
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getFormXML,
    escapeXML,
    validateIBAN,
    validateBIC,
    formatCurrency,
  };
}
