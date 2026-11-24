/** Shared PIN entry for the standalone Books editor.
 * PIN and pepper are Netlify function secrets. No PIN or verifier goes to the client.
 * This grants SHARED owner access; it is not a substitute for distinct user identities.
 */
import { createHmac, timingSafeEqual, createHash } from 'node:crypto';

export const WINDOW_MS = 15 * 60_000;
export const LOCK_MS = 30 * 60_000;
export const IP_MAX_FAILURES = 5;
export const GLOBAL_MAX_FAILURES = 30;
export const PIN_SESSION_SECONDS = 8 * 60 * 60;

export function validPin(raw) { return typeof raw === 'string' && /^\\d{4}$/.test(raw); }

export function verifyPin(input, expected, pepper) {
  if (!validPin(expected) || !pepper || typeof pepper !== 'string' || pepper.length < 24) return false;
  if (!validPin(input)) return false;
  const h = v => createHmac('sha256',pepper).update(v).digest();
  return timingSafeEqual(h(input),h(expected));
}

export function ipScope(ip,pepper){
  return 'ip:' + createHash('sha256').update(String(pepper)+':'+String(ip||'unknown')).digest('hex');
}

export function state(row,now=Date.now()) {
  if (row?.locked_until && Date.parse(row.locked_until) > now) return { locked:true, count:Number(row.failure_count)||0 };
  const started = row?.window_start ? Date.parse(row.window_start) : 0;
  const count = started && now-started<WINDOW_MS ? Number(row.failure_count)||0 : 0;
  return { locked:false, count:Math.max(0,count) };
}

export function nextFailure(row,max,now=Date.now()){
  const prior = state(row,now);
  if(prior.locked) return {locked:true,count:prior.count,until:new Date(now+LOCK_MS).toISOString()};
  const n=prior.count+1;
  return {locked:n>=max,count:n,until:n>=max?new Date(now+LOCK_MS).toISOString():null};
}
