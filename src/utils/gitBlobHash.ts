import sha1 from 'crypto-js/sha1';
import encHex from 'crypto-js/enc-hex';

export function gitBlobHash(blob: string) {
  return sha1(`blob ${blob.length}\0${blob}`).toString(encHex);
}
