import { headers } from 'next/headers';
import { authorize } from '@/lib/publisher/auth';
import VideoCoverage from './VideoCoverage';
export const dynamic='force-dynamic';
export default async function Page(){
  const denied=authorize(new Request('https://publisher.local',{headers:await headers()}));
  if(denied)return <p>Administrator authentication required.</p>;
  return <VideoCoverage/>;
}
