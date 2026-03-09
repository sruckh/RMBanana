const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { removeWatermarkFromBuffer } = require('removebanana');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure temp directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const outputsDir = path.join(__dirname, 'outputs');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true });

// Cleanup old files every 5 minutes
setInterval(() => {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  
  [uploadsDir, outputsDir].forEach(dir => {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file);
      try {
        const stats = fs.statSync(filePath);
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {}
    });
  });
}, 60000);

// CORS - allow all origins within docker network
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPEG, and WebP are allowed.'));
    }
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Remove watermark endpoint
app.post('/api/remove-watermark', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    console.log(`Processing image: ${req.file.originalname}, size: ${req.file.size} bytes`);

    const inputBuffer = req.file.buffer;
    const format = req.file.mimetype === 'image/png' ? 'png' : 
                   req.file.mimetype === 'image/webp' ? 'webp' : 'jpeg';

    // Process the image
    const { buffer: outputBuffer, meta } = await removeWatermarkFromBuffer(inputBuffer, {
      format: format,
      quality: 0.95,
      silent: true
    });

    // Save output temporarily for download
    const outputId = uuidv4();
    const outputFilename = `${outputId}_clean.${format}`;
    const outputPath = path.join(outputsDir, outputFilename);
    fs.writeFileSync(outputPath, outputBuffer);

    // Convert to base64 for immediate display
    const base64Image = outputBuffer.toString('base64');
    const dataUrl = `data:image/${format};base64,${base64Image}`;

    console.log('Watermark removal successful:', meta);

    res.json({
      success: true,
      image: dataUrl,
      downloadUrl: `/api/download/${outputId}`,
      filename: `clean_${req.file.originalname}`,
      meta: {
        watermark: meta.watermark,
        originalSize: inputBuffer.length,
        outputSize: outputBuffer.length
      }
    });

  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ 
      error: 'Failed to process image',
      message: error.message 
    });
  }
});

// Download endpoint
app.get('/api/download/:id', (req, res) => {
  const { id } = req.params;
  
  // Find the file
  const files = fs.readdirSync(outputsDir);
  const file = files.find(f => f.startsWith(id));
  
  if (!file) {
    return res.status(404).json({ error: 'File not found or expired' });
  }
  
  const filePath = path.join(outputsDir, file);
  const ext = path.extname(file).slice(1);
  const mimeType = ext === 'png' ? 'image/png' : 
                   ext === 'webp' ? 'image/webp' : 'image/jpeg';
  
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${file}"`);
  res.sendFile(filePath);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: err.message || 'Internal server error' 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🍌 RemoveBanana API running on port ${PORT}`);
});
