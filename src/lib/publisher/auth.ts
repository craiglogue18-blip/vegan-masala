import { timingSafeEqual } from 'node:crypto';
export function authorize(req: Request, mutation = false) {
  const expected = process.env.ADMIN_PASSWORD?.trim() || process.env.ADMIN_TOKEN?.trim();
  const header = req.headers.get('authorization') || '';
  let supplied = req.headers.get('x-admin-token') || '';
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString();
    const i = decoded.indexOf(':');
    if (decoded.slice(0, i) === (process.env.ADMIN_USERNAME || 'vegan-masala')) supplied = decoded.slice(i + 1);
  }
  if (!expected || !supplied || Buffer.byteLength(expected) !== Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) return Response.json({error:'Administrator authentication required'}, {status:401, headers:{'WWW-Authenticate':'Basic realm="Recipe Publisher"','Cache-Control':'no-store'}});
  if (mutation && req.headers.get('origin') !== new URL(req.url).origin) return Response.json({error:'Same-origin request required'}, {status:403});
  return null;
}
