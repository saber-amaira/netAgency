// Génère src/environments/environment.ts à partir des variables d'environnement.
import { writeFileSync } from 'node:fs';

const url = process.env.SUPABASE_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';

if (process.env.CI && (!url || !anonKey)) {
  console.warn('SUPABASE_URL / SUPABASE_ANON_KEY non définies : build sans backend.');
}

writeFileSync(
  new URL('../src/environments/environment.ts', import.meta.url),
  `export const environment = {\n  supabaseUrl: ${JSON.stringify(url)},\n  supabaseAnonKey: ${JSON.stringify(anonKey)},\n};\n`,
);
