/**
 * Studio canvas processing — FEATURE 1, step 2 (Node + sharp).
 *
 * Takes the transparent subject PNG (from removeBackground) and composes it onto
 * a standardised editorial studio canvas:
 *   - #F4F4F2 soft off-white ground
 *   - 4:5 (1080x1350) or 1:1 (1200x1200)
 *   - ~15% padding on all sides, subject centred
 *   - a subtle contact shadow (opacity 0.18, y+12, Gaussian blur 18)
 *
 * Returns a JPEG buffer (solid ground, no alpha to preserve).
 */
import sharp from 'sharp';

export const STUDIO_SIZES = {
  '4:5': { w: 1080, h: 1350 },
  '1:1': { w: 1200, h: 1200 },
};
export const STUDIO_BG = { r: 244, g: 244, b: 242 }; // #F4F4F2
export const STUDIO_PAD = 0.15;
export const STUDIO_SHADOW = { opacity: 0.18, y: 12, blur: 18 };

/**
 * @param {Buffer} subjectPng  transparent PNG of the subject
 * @param {'4:5'|'1:1'} ratio
 * @returns {Promise<Buffer>}  JPEG of the finished studio cover
 */
export async function composeStudioCover(subjectPng, ratio = '4:5') {
  const size = STUDIO_SIZES[ratio] || STUDIO_SIZES['4:5'];

  // Trim the transparent margin, then resize the subject to fit the padded box.
  const pad = Math.round(Math.min(size.w, size.h) * STUDIO_PAD);
  const innerW = size.w - pad * 2;
  const innerH = size.h - pad * 2;

  const subject = await sharp(subjectPng)
    .trim() // drop surrounding transparency so far-away shots fill the frame
    .resize(innerW, innerH, { fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer();

  const { width: sw, height: sh } = await sharp(subject).metadata();
  const dx = Math.round((size.w - sw) / 2);
  const dy = Math.round((size.h - sh) / 2);

  // Contact shadow: the subject's alpha, blurred and faded to 18%, tinted black.
  const alpha = await sharp(subject)
    .extractChannel('alpha')
    .blur(STUDIO_SHADOW.blur)
    .linear(STUDIO_SHADOW.opacity, 0) // scale mask values → 18% strength
    .toBuffer();
  const blackRGB = await sharp({
    create: { width: sw, height: sh, channels: 3, background: { r: 0, g: 0, b: 0 } },
  })
    .png()
    .toBuffer();
  const shadow = await sharp(blackRGB).joinChannel(alpha).png().toBuffer();

  // Ground → shadow (offset down) → subject.
  return sharp({
    create: { width: size.w, height: size.h, channels: 3, background: STUDIO_BG },
  })
    .composite([
      { input: shadow, left: dx, top: dy + STUDIO_SHADOW.y },
      { input: subject, left: dx, top: dy },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();
}

/**
 * Full pipeline entry point. Removes the background, then composes the cover.
 * Returns both renders as data URLs so the client can store processed_cover +
 * original_cover and offer the "Original Background" toggle.
 *
 * @param {Buffer} originalBuffer  the uploaded photo
 * @param {object} opts  { ratio, removeBackground }  (removeBackground injectable for tests)
 */
export async function buildProductCover(originalBuffer, opts = {}) {
  const ratio = opts.ratio || '4:5';
  const remove = opts.removeBackground || (await import('./removeBackground.js')).removeBackground;

  const original_cover = `data:image/jpeg;base64,${originalBuffer.toString('base64')}`;
  try {
    const subject = await remove(originalBuffer);
    const cover = await composeStudioCover(subject, ratio);
    return {
      ok: true,
      processed_cover: `data:image/jpeg;base64,${cover.toString('base64')}`,
      original_cover,
    };
  } catch (err) {
    // A listing never fails because segmentation failed — keep the original.
    return { ok: false, processed_cover: null, original_cover, error: String(err) };
  }
}
