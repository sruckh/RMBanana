// DOM Elements
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');
const previewSection = document.getElementById('previewSection');
const originalImage = document.getElementById('originalImage');
const outputImage = document.getElementById('outputImage');
const outputContainer = document.getElementById('outputContainer');
const processingOverlay = document.getElementById('processingOverlay');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const status = document.getElementById('status');

let currentFile = null;
let downloadUrl = null;
let downloadFilename = null;

// Drag and Drop Events
dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
});

// Handle file selection
function handleFile(file) {
  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    showStatus('Please upload a PNG, JPEG, or WebP image.', 'error');
    return;
  }

  // Validate file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    showStatus('File size must be less than 10MB.', 'error');
    return;
  }

  currentFile = file;
  
  // Display preview
  const reader = new FileReader();
  reader.onload = (e) => {
    originalImage.src = e.target.result;
    uploadSection.classList.add('hidden');
    previewSection.classList.remove('hidden');
    
    // Scroll to preview section smoothly
    previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Reset output
    outputImage.src = '';
    outputImage.classList.add('hidden');
    processingOverlay.classList.add('hidden');
    processBtn.disabled = false;
    downloadBtn.disabled = true;
    hideStatus();
  };
  reader.readAsDataURL(file);
}

// Process button
processBtn.addEventListener('click', async () => {
  if (!currentFile) return;

  processBtn.disabled = true;
  outputImage.classList.add('hidden');
  processingOverlay.classList.remove('hidden');
  hideStatus();

  const formData = new FormData();
  formData.append('image', currentFile);

  try {
    const response = await fetch('/api/remove-watermark', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to process image');
    }

    const result = await response.json();

    if (result.success) {
      outputImage.src = result.image;
      outputImage.classList.remove('hidden');
      processingOverlay.classList.add('hidden');
      
      // Setup download
      downloadUrl = result.downloadUrl;
      downloadFilename = result.filename;
      downloadBtn.disabled = false;
      
      showStatus('✨ Watermark removed successfully!', 'success');
      
      // Preload download
      preloadDownload(result.downloadUrl);
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Error:', error);
    processingOverlay.classList.add('hidden');
    showStatus(`Error: ${error.message}`, 'error');
    processBtn.disabled = false;
  }
});

// Download button
downloadBtn.addEventListener('click', () => {
  if (downloadUrl && downloadFilename) {
    // If we have a preloaded blob, use it
    if (window.downloadBlob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(window.downloadBlob);
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } else {
      // Fallback to server download
      fetch(downloadUrl)
        .then(res => res.blob())
        .then(blob => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = downloadFilename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(a.href);
        });
    }
  }
});

// Preload download for faster response
function preloadDownload(url) {
  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      window.downloadBlob = blob;
    })
    .catch(() => {});
}

// Reset button
resetBtn.addEventListener('click', () => {
  currentFile = null;
  downloadUrl = null;
  downloadFilename = null;
  window.downloadBlob = null;
  
  originalImage.src = '';
  outputImage.src = '';
  fileInput.value = '';
  
  previewSection.classList.add('hidden');
  uploadSection.classList.remove('hidden');
  
  // Scroll back to upload section
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  processBtn.disabled = false;
  downloadBtn.disabled = true;
  hideStatus();
});

// Status helpers
function showStatus(message, type) {
  status.textContent = message;
  status.className = `status ${type}`;
  status.classList.remove('hidden');
  
  // Auto-hide success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      hideStatus();
    }, 5000);
  }
}

function hideStatus() {
  status.classList.add('hidden');
}

// Prevent default drag behaviors on document
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());

// Smooth scroll on scroll indicator click
document.querySelector('.scroll-indicator')?.addEventListener('click', () => {
  document.querySelector('.app-section')?.scrollIntoView({ behavior: 'smooth' });
});
