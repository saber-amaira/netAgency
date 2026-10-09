# netAgency

Site immobilier classique : annonces publiques (accueil, catalogue filtrable, fiche détail avec galerie et formulaire de contact), capture de demandes (leads) et espace agent/admin (créer, modifier, publier/dépublier, photos, suivi des demandes).

Stack : Angular 21 (SPA), Supabase (Postgres + Auth + Storage, RLS), GitHub Actions, Cloudflare (Workers assets).

## Démarrage

1. `cp .env.example .env` et renseigner `SUPABASE_URL` / `SUPABASE_ANON_KEY` (clé publique anon uniquement).
2. Appliquer `supabase/migrations/*.sql` (voir `supabase/README.md`) et créer un utilisateur agent/admin.
3. `npm install && export $(grep -v '^#' .env | xargs) && npm start`

`scripts/set-env.mjs` génère `src/environments/environment.ts` depuis les variables d'environnement (ne pas committer de vraies valeurs).

## Tests / build
`npm test -- --watch=false` · `npm run build`

## Déploiement Cloudflare
`.github/workflows/deploy.yml` construit l'app et exécute `wrangler deploy` (config `wrangler.jsonc`, fallback SPA). Secrets GitHub requis : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Sans token Cloudflare, l'étape est ignorée.

## Sécurité
RLS activée sur toutes les tables ; public = lecture des annonces publiées + insertion de demandes ; agents = leurs annonces ; admins = tout. Les rôles ne sont modifiables que par un admin. Aucune clé `service_role` côté client.

Docker n'est pas inclus : non nécessaire (la CLI Supabase l'utilise en local si besoin).
