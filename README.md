# Llapi Fert

Web aplikacion në gjuhën shqipe për katalogun, ofertat dhe menaxhimin e Llapi Fert. Ndërtuar me Next.js App Router, React, TypeScript, PostgreSQL (Neon) dhe NextAuth Credentials.

## Kërkesat

- Node.js 20.6 ose më i ri dhe npm
- Databazë PostgreSQL; rekomandohet Neon

## Nisja lokale

1. Krijo projektin PostgreSQL në Neon dhe hap SQL Editor për branch-in e projektit.
2. Ekzekuto tërë skedarin `database/schema.sql`. Ai krijon tabelat, lidhjet, kufizimet, kategoritë dhe tri produkte demonstruese pa të dhëna klientësh. Nëse e ke ekzekutuar më parë, ekzekutoje përsëri pas këtij ndryshimi; migrimi shton fushat e biznesit/lokacionit dhe statuset e reja pa fshirë porositë ekzistuese.
3. Te Neon, shtyp **Connect**, zgjidh branch/database/role dhe kopjo pooled connection string-un (hosti zakonisht përmban `-pooler`).
4. Kopjo `.env.example` në `.env.local`, vendos connection string-un te `DATABASE_URL`, gjenero sekretin me `openssl rand -base64 32` dhe vendose te `NEXTAUTH_SECRET`, pastaj vendos `NEXTAUTH_URL=http://localhost:3000`.
5. Instalo varësitë me `npm install` dhe krijo administratorin me `npm run admin:create`. Komanda kërkon emrin/emailin dhe fjalëkalimin pa e shfaqur atë në terminal.
6. Nise me `npm run dev`, pastaj vizito `http://localhost:3000`.

Për njoftimin automatik në WhatsApp, krijo një aplikacion në Meta WhatsApp Business Platform, regjistro numrin dërgues, gjenero access token dhe krijo/aprovo një template Utility me trupin: `Përshëndetje {{1}}, porosia juaj ka përfunduar dhe është në proces të ardhjes. Të gjitha të mirat nga Llapi Fert.` Klienti duhet të pajtohet në formular për të marrë njoftimin. Vendose të njëjtin emër dhe gjuhë të template-it në variablat më poshtë (gjuha parazgjedhje `sq`). Në Vercel shtoji si Environment Variables dhe bëj redeploy.

```text
WHATSAPP_PHONE_NUMBER_ID=<ID i numrit dërgues në Meta>
WHATSAPP_ACCESS_TOKEN=<token i WhatsApp Business>
WHATSAPP_TEMPLATE_NAME=llapifert_porosia_perfunduar
WHATSAPP_TEMPLATE_LANGUAGE=sq
WHATSAPP_API_VERSION=v27.0
```

## Llogaria e administratorit

Skema nuk krijon kredenciale të paracaktuara. Pasi të jetë lidhur databaza, përdor `npm run admin:create`; fjalëkalimi kalohet përmes prompt-it të fshehur dhe ruhet vetëm si hash bcrypt. Hyrja është te `/login`, ndërsa paneli te `/admin`. Verifikimi i rolit bëhet në server si te faqja e panelit ashtu edhe në API-të e administrimit. Klientët vizitorë dërgojnë kërkesë oferte pa llogari.

## Funksionet e aplikacionit

- Faqja kryesore dhe faqet “Rreth nesh”, kontakt, privatësi dhe kushte përdorimi.
- Katalog, kërkim me tekst, filtrim sipas kategorisë dhe faqe individuale produkti.
- Formular porosie pa llogari, me të dhënat e kompanisë, numrin e biznesit, telefonin, lokacionin dhe shumë rreshta produktesh/dimensionesh.
- Çmim i llogaritur në ndërfaqe dhe i verifikuar sërish në server për fertraj, gypa dhe shtylla; dimensioni, çmimi për copë dhe totali ruhen te porosia.
- Panel administratori për produktet dhe porositë, me statuset “Në proces”, “Përfunduar” dhe “Nisur / në rrugë”; shënimi si “Përfunduar” dërgon template-in e miratuar në WhatsApp dhe lejon riprovimin nëse dërgimi dështon.
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
