import { describe, it, expect } from 'vitest';
import { applyCors } from '../../api/_lib/security.js';
import { getApiBaseUrl } from '../utils/session';

const makeRes = () => {
  const headers = {};
  return {
    headers,
    setHeader: (key, value) => { headers[key] = value; },
    getHeader: (key) => headers[key]
  };
};

describe('Server configuration', () => {
  describe('CORS', () => {
    it('allows a request from the origin that serves the API', () => {
      const res = makeRes();
      const allowed = applyCors(
        { headers: { origin: 'https://noted.example.com', host: 'noted.example.com' } },
        res
      );

      expect(allowed).toBe(true);
      expect(res.getHeader('Access-Control-Allow-Origin')).toBe('https://noted.example.com');
    });

    it('allows a request through a proxy that forwards the host', () => {
      const res = makeRes();
      const allowed = applyCors(
        {
          headers: {
            origin: 'https://noted.example.com',
            host: 'internal.vercel.app',
            'x-forwarded-host': 'noted.example.com'
          }
        },
        res
      );

      expect(allowed).toBe(true);
    });

    it('still rejects an origin that is not allowed', () => {
      const res = makeRes();
      const allowed = applyCors(
        { headers: { origin: 'https://evil.example.com', host: 'noted.example.com' } },
        res
      );

      expect(allowed).toBe(false);
      expect(res.getHeader('Access-Control-Allow-Origin')).toBeUndefined();
    });

    it('never sends a wildcard origin header', () => {
      const res = makeRes();
      applyCors({ headers: { origin: 'https://evil.example.com', host: 'noted.example.com' } }, res);
      expect(res.getHeader('Access-Control-Allow-Origin')).not.toBe('*');
    });

    it('allows a request without an origin header', () => {
      const res = makeRes();
      expect(applyCors({ headers: { host: 'noted.example.com' } }, res)).toBe(true);
    });
  });

  describe('API base url', () => {
    it('uses the same origin during development', () => {
      // The dev server serves the API through its own middleware, so the
      // request must not leave the machine.
      expect(getApiBaseUrl()).toBe('');
    });
  });
});
