import { createRequest, createResponse, type MockResponse } from 'node-mocks-http';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Mock } from 'vitest';

export function createMockVercelRequest(
  ...args: Parameters<typeof createRequest<VercelRequest>>
) {
  const req = createRequest<VercelRequest>(...args);
  return req;
}

export function createMockVercelResponse(
  ...args: Parameters<typeof createResponse<VercelResponse>>
) {
  const res = createResponse<VercelResponse>(...args);
  res.send = vi.fn(() => res);
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res as MockResponse<VercelResponse> & {
    send: Mock;
    status: Mock;
    json: Mock;
  };
}

