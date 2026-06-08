// Curated Unsplash photo IDs for the auth-page backdrop. Photography-themed,
// warm tones so they sit nicely against the LensHive accent.
// Plain `images.unsplash.com` URLs don't need an API key.
const PHOTO_IDS = [
  "1500828062-c11de6711aff", // golden-hour mountain ridge
  "1469474968028-56623f02e42e", // misty mountain horizon
  "1506905925346-21bda4d32df4", // sunset mountain peaks
  "1502920917128-1aa500764cbd", // foggy alpine valley
  "1470770841072-f978cf4d019e", // mountain lake reflection
  "1454486837617-ce8e1ba5ebfe", // film camera + rolls
];

const url = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1920&q=80`;

export function pickBackdrop() {
  const id = PHOTO_IDS[Math.floor(Math.random() * PHOTO_IDS.length)];
  return url(id);
}
