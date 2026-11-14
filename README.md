# Llapi Fert

Web aplikacion në gjuhën shqipe për katalogun, ofertat dhe menaxhimin e Llapi Fert. Ndërtuar me Next.js App Router, React, TypeScript, PostgreSQL (Neon) dhe NextAuth Credentials.

## Kërkesat

- Node.js 20.6 ose më i ri dhe npm
- Databazë PostgreSQL; rekomandohet Neon

## Nisja lokale

1. Krijo projektin PostgreSQL në Neon dhe hap SQL Editor për branch-in e projektit.
2. Ekzekuto tërë skedarin `database/schema.sql`. Ai krijon tabelat, lidhjet, kufizimet, kategoritë dhe tri produkte demonstruese pa të dhëna klientësh. Nëse e ke ekzekutuar më parë, ekzekutoje përsëri pas këtij ndryshimi; `ALTER TABLE ... IF NOT EXISTS` shton fushat e dimensioneve/çmimeve pa fshirë kërkesat ekzistuese.
3. Te Neon, shtyp **Connect**, zgjidh branch/database/role dhe kopjo pooled connection string-un (hosti zakonisht përmban `-pooler`).
4. Kopjo `.env.example` në `.env.local`, vendos connection string-un te `DATABASE_URL`, gjenero sekretin me `openssl rand -base64 32` dhe vendose te `NEXTAUTH_SECRET`, pastaj vendos `NEXTAUTH_URL=http://localhost:3000`.
5. Instalo varësitë me `npm install` dhe krijo administratorin me `npm run admin:create`. Komanda kërkon emrin/emailin dhe fjalëkalimin pa e shfaqur atë në terminal.
6. Nise me `npm run dev`, pastaj vizito `http://localhost:3000`.

## Llogaria e administratorit

Skema nuk krijon kredenciale të paracaktuara. Pasi të jetë lidhur databaza, përdor `npm run admin:create`; fjalëkalimi kalohet përmes prompt-it të fshehur dhe ruhet vetëm si hash bcrypt. Hyrja është te `/login`, ndërsa paneli te `/admin`. Verifikimi i rolit bëhet në server si te faqja e panelit ashtu edhe në API-të e administrimit. Klientët vizitorë dërgojnë kërkesë oferte pa llogari.

## Funksionet e aplikacionit

- Faqja kryesore dhe faqet “Rreth nesh”, kontakt, privatësi dhe kushte përdorimi.
- Katalog, kërkim me tekst, filtrim sipas kategorisë dhe faqe individuale produkti.
- Formular oferte i validuar; porosia dhe artikulli/sasia ruhen në një transaksion PostgreSQL.
- Çmim i llogaritur në ndërfaqe dhe i verifikuar sërish në server për fertraj, gypa dhe shtylla; dimensioni, çmimi për copë dhe totali ruhen te porosia.
- Panel administratori për shtim, ndryshim, çaktivizim produktesh dhe ndryshim të statusit të kërkesave.
- NextAuth JWT session me role `customer` dhe `admin`.

## Struktura

```text
database/schema.sql
public/images/
src/app/                 faqet App Router, API Route Handlers dhe stilet
src/components/          header, footer, kartelat dhe formulari
src/lib/                 PostgreSQL, autentikimi, query-t dhe rojet e rolit
.env.example             emrat e variablave, pa sekrete
```

Fotot e produkteve, fotot `foto5`, `foto6`, `foto11` dhe logoja janë ato të ofruara në dosjen `image/`; kopjet e optimizuara të përdorura nga faqja ruhen te `public/images/`. Pa `DATABASE_URL`, katalogu përdor tri produkte paraprake të shënuara në faqe; kërkesat për ofertë aktivizohen pasi të lidhet Neon. Informacioni i kontaktit në `Footer`, `contact/page.tsx` është demonstrativ dhe duhet zëvendësuar me numrin, emailin dhe adresën zyrtare para publikimit. Emrat dhe përshkrimet e produkteve janë përgatitur sipas informatave të dhëna; çmimet lihen “Kërko ofertë”.

## Prodhimi

`npm run build` ndërton aplikacionin për prodhim; vendos të njëjtat variabla mjedisi në host dhe sigurohu që skema SQL është aplikuar në databazë.

Për Vercel, lidhe repository-n GitHub me **Add New → Project**. Vercel e njeh Next.js automatikisht. Te **Project Settings → Environment Variables**, shto `DATABASE_URL`, `NEXTAUTH_SECRET` dhe `NEXTAUTH_URL` për Production (dhe Preview nëse përdor branch të veçantë Neon); pastaj bëj Deploy ose redeploy pasi të ndryshosh variablat.
