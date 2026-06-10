This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



## Informations de Déploiement (Privé)

### Identifiants Super Admin
- **Email** : `admin@truckmanager.com`
- **Mot de passe** : `admin123`

### Identifiants Supabase
- **Projet ID** : `noojdhgabseaannyeenl`
- **Mot de passe DB** : `Camion_Manager_123`
- **Clé API Anon** : `sb_publishable_WdvPRG_s8N_AQVW4MboM5A_QtY1Ehw2`

### Configuration NextAuth
- **NEXTAUTH_SECRET** : `app_mounir_camion`
- **NEXTAUTH_URL** : `https://camion-tau.vercel.app`

---

## Déploiement Supabase + Vercel

### Base de données Supabase (PostgreSQL)

1. Va sur [supabase.com](https://supabase.com) → **New project**
2. Copie le mot de passe ci-dessous quand Supabase le demande

```
Supabase DB Password : Camion_Manager_123///
```

3. Une fois le projet créé, va dans **Project Settings → Database → Connection string → URI**
4. Copie l'URI et remplace `[YOUR-PASSWORD]` par `Camion_Manager_123///`
5. Ajoute `?pgbouncer=true&connection_limit=1` à la fin pour Supabase

### Variables d'environnement Vercel

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | `postgresql://postgres:Camion_Manager_123///@db.xxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` (génère une chaîne) |
| `NEXTAUTH_URL` | `https://ton-projet.vercel.app` |

### Build

Le `package.json` doit contenir :

```json
"scripts": {
  "postinstall": "prisma generate",
  "vercel-build": "prisma generate && prisma db push && next build"
}
``` 