/* eslint-env node */
import httpProxy from 'http-proxy';
import { getCertificate } from '@vitejs/plugin-basic-ssl';

const port = 5000;
const targetHost = 'localhost';
const targetPort = 5001;

main();

async function main() {
  const cert = await getCertificate('.cert');

  const startTime = Date.now();
  httpProxy.createServer({
    ssl: {
      key: cert,
      cert
    },
    target: {
      host: targetHost,
      port: targetPort
    },
    ws: true
  }).listen(port, () => {
    console.log(`HTTPS proxy listening on https://0.0.0.0:${port}\n`);
  }).on('error', (err) => {
    // swallow ECONNREFUSED error at start, because vercel dev needs time to start
    if (err.code === 'ECONNREFUSED' && Date.now() < startTime + 10000 ) {
      return;
    }
    console.error(err);
  });
}
