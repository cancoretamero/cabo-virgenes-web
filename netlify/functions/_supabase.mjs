// Cliente Supabase para las Netlify Functions de Cabo Vírgenes (paridad _supabase.js de Aisa).
//  - service(): clave SECRETA (sb_secret_…) → bypassa RLS. SOLO servidor, todas las escrituras.
//  - asAnon():  clave PUBLISHABLE (sb_publishable_…) → RLS aplica (lectura pública).
//  - configured(): true si hay URL + secret (si no, las funciones devuelven 503 con mensaje claro).
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const SECRET = process.env.SUPABASE_SECRET_KEY;
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY;

let _svc = null;
export function service() {
  if (!URL || !SECRET) return null;
  if (!_svc) _svc = createClient(URL, SECRET, { auth: { autoRefreshToken: false, persistSession: false } });
  return _svc;
}
export function asAnon() {
  if (!URL || !ANON) return null;
  return createClient(URL, ANON, { auth: { autoRefreshToken: false, persistSession: false } });
}
export function configured() { return Boolean(URL && SECRET); }
