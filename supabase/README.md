# Supabase

Appliquer les migrations : `supabase link --project-ref <ref>` puis `supabase db push`
(ou en local : `supabase start`, qui nécessite Docker).

Créer un agent/admin : l'utilisateur s'inscrit (ou est invité depuis le dashboard Supabase),
puis un admin exécute dans le SQL editor :

```sql
update public.profiles set role = 'admin' where email = 'agent@example.com';
```

Seule la clé publique `anon` est utilisée côté client ; la clé `service_role` ne doit jamais l'être.
