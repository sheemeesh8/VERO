/**
 * Studio Background Engine — HTTP endpoint (FEATURE 1).
 *
 * POST /api/studio-cover   multipart/form-data { image, ratio? }
 *   -> { ok, processed_cover, original_cover }
 *
 * Run:  PHOTOROOM_API_KEY=... npm start   (from studio-engine/)
 */
import express from 'express';
import multer from 'multer';
import { buildProductCover } from './studioEngine.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const app = express();

app.post('/api/studio-cover', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded (field "image").' });
  const ratio = req.body.ratio === '1:1' ? '1:1' : '4:5';
  try {
    const result = await buildProductCover(req.file.buffer, { ratio });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`VERO studio engine listening on :${PORT}`));
