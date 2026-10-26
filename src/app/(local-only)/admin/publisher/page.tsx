import { headers } from 'next/headers';
import { authorize } from '@/lib/publisher/auth';
import Publisher from './publisher';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const denied = authorize(new Request('https://publisher.local', {headers:await headers()}));
  if (denied) return <p>Sign in with the configured administrator credentials to use the Recipe Publisher.</p>;
  return <Publisher/>;
}
