export default async function gitBlobHash(blob: string) {
  const blobUint8 = new TextEncoder().encode(`blob ${blob.length}\0${blob}`);
  const hashBuffer = await crypto.subtle.digest('SHA-1', blobUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((bytes) => bytes.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}
