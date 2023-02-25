export async function gitBlobHash(blob: string) {
  const blobEncoded = new TextEncoder().encode(blob);
  const prefixEncoded = new TextEncoder().encode(`blob ${blobEncoded.length}\0`);
  const objectEncoded = new Uint8Array(prefixEncoded.length + blobEncoded.length);
  objectEncoded.set(prefixEncoded);
  objectEncoded.set(blobEncoded, prefixEncoded.length);
  const hashBuffer = await crypto.subtle.digest('SHA-1', objectEncoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((bytes) => bytes.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}
