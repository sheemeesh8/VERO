/**
 * Background removal — FEATURE 1, step 1.
 *
 * Extracts the primary subject from a photo as a transparent PNG using a hosted
 * segmentation API. Photoroom and Remove.bg are both supported; the provider is
 * chosen by whichever API key is present in the environment:
 *
 *   PHOTOROOM_API_KEY=...    (preferred)
 *   REMOVEBG_API_KEY=...
 *
 * @param {Buffer} imageBuffer  the original photo bytes
 * @returns {Promise<Buffer>}   a transparent PNG of the subject
 */
export async function removeBackground(imageBuffer) {
  const photoroomKey = process.env.PHOTOROOM_API_KEY;
  const removebgKey = process.env.REMOVEBG_API_KEY;

  if (photoroomKey) return removeWithPhotoroom(imageBuffer, photoroomKey);
  if (removebgKey) return removeWithRemoveBg(imageBuffer, removebgKey);

  throw new Error(
    'No background-removal API key found. Set PHOTOROOM_API_KEY or REMOVEBG_API_KEY.'
  );
}

async function removeWithPhotoroom(imageBuffer, apiKey) {
  const form = new FormData();
  form.append('image_file', new Blob([imageBuffer]), 'upload.jpg');
  form.append('format', 'png'); // transparent PNG

  const res = await fetch('https://sdk.photoroom.com/v1/segment', {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Photoroom failed: ${res.status} ${await res.text()}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function removeWithRemoveBg(imageBuffer, apiKey) {
  const form = new FormData();
  form.append('image_file', new Blob([imageBuffer]), 'upload.jpg');
  form.append('size', 'auto');
  form.append('format', 'png');

  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Remove.bg failed: ${res.status} ${await res.text()}`);
  }
  return Buffer.from(await res.arrayBuffer());
}
