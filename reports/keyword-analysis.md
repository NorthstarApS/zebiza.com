# Zebiza — Dansk beauty-søgeordsanalyse (Phase 2)

**Datakilder:** Store API lager (live), eksisterende kategori-URL'er, tidligere Ahrefs-baseline (0 organiske keywords), GSC-summary fra brief (1 klik / 47 eksponeringer / 0 DK-klik).  
**Ikke tilgængeligt i workspace:** Ahrefs API, GSC ZIP-eksport.  
**Regel:** Søgevolumen og KD er `UNKNOWN`, medmindre en dokumenteret kilde findes. Ingen opfundede tal.

## Prioriteringsmodel

1. Lagerført udvalg på destinationen (Store API count > 0)
2. Købs-/kommerciel intention
3. Eksisterende URL (undgå tynde nye sider)
4. Realistisk konkurrence (UNKNOWN uden Ahrefs → ingen aggressiv thin-page-strategi)

## Keyword → URL mapping

| Cluster | Intent | Volume | KD | Lager (approx) | Primær destination | Handling | Begrundelse |
|---|---|---|---|---|---|---|---|
| hudpleje | Commercial | UNKNOWN | UNKNOWN | høj | `/da/kategori/hudpleje-ansigt/` | Forbedr | Primær beauty-universe med lager |
| ansigtsrens | Commercial | UNKNOWN | UNKNOWN | medium | `/da/kategori/ansigtsrens/` | Forbedr | Dedikeret kategori + lager |
| øjencreme | Commercial | UNKNOWN | UNKNOWN | medium | `/da/kategori/oejencreme/` | Forbedr | Eksisterende kategori |
| serum / ansigtsserum | Commercial | UNKNOWN | UNKNOWN | medium | `/da/kategori/hudpleje-ansigt/` | Forbedr H2 + filtre | Ingen separat serum-kategori med kritisk masse |
| makeup | Commercial | UNKNOWN | UNKNOWN | medium | `/da/kategori/kosmetik-ansigt/` | Forbedr | Ansigtsmakeup-owner |
| foundation | Commercial | UNKNOWN | UNKNOWN | lav–medium | `/da/kategori/kosmetik-ansigt/` | Undersøg | Kun ny side hvis lager + særskilt intent |
| mascara / eyeliner | Commercial | UNKNOWN | UNKNOWN | medium | `/da/kategori/kosmetik-oejne/` + `/da/kategori/eyeliner/` | Forbedr | Eksisterende øjenkategorier |
| læbestift | Commercial | UNKNOWN | UNKNOWN | medium | `/da/kategori/kosmetik-laeber/` | Forbedr | Eksisterende |
| neglelak / negle | Transactional | UNKNOWN | UNKNOWN | medium | `/da/kategori/nails/` | Forbedr | Canonical negle-owner |
| hårpleje | Commercial | UNKNOWN | UNKNOWN | høj | `/da/kategori/harpleje/` | Forbedr | Primær hår-universe |
| shampoo | Commercial | UNKNOWN | UNKNOWN | medium | `/da/kategori/harpleje/` | Forbedr indhold | Undgå thin shampoo-side uden særskilt taxonomi |
| hårstyling | Commercial | UNKNOWN | UNKNOWN | medium | `/da/kategori/haarstyling/` | Forbedr | Eksisterende |
| hårfarve | Transactional | UNKNOWN | UNKNOWN | medium | `/da/kategori/haarfarve/` | Forbedr | Eksisterende |
| dameparfume / parfume | Transactional | UNKNOWN | UNKNOWN | medium | `/da/kategori/parfume-dufte/` | Forbedr | Eksisterende |
| beauty tools | Commercial | UNKNOWN | UNKNOWN | høj | `/da/kategori/beauty-tools/` | Forbedr | Konsolideret owner |
| barbering / grooming mænd | Commercial | UNKNOWN | UNKNOWN | medium | `/da/kategori/barbering-grooming/` | Forbedr | Eksisterende |
| Sally Hansen neglelak | Brand | UNKNOWN | UNKNOWN | **0** | — | **Defer** | Ingen lager — ingen landing page |
| L'Oréal Metal Detox | Brand | UNKNOWN | UNKNOWN | **0** | — | **Defer** | Ingen lager |
| Rowenta / Drunk n Diamonds | Brand | UNKNOWN | UNKNOWN | **0** | — | **Defer** | GSC-impr. uden inventar |

## Konkurrenter (kvalitativt — ikke ranked)

Danske beauty-SERPs domineres typisk af Matas, Normal, Sephora DK, Boots, netapotek/webshops og brand.com. Uden Ahrefs SERP-export rapporteres ingen positioner eller KD-tal.

## Implementeret i kode

- Titles / meta / H1 via `categoryContent.ts` + prerender
- Breadcrumbs + interne links på kategori-/produktsider
- Beauty-nav mapped til ovenstående owners
- Ingen nye thin SEO-kategorier for out-of-stock brand queries

## Næste handling (kræver adgang)

1. Ahrefs Keywords Explorer (DK) for volumener på tabellen ovenfor
2. Importer GSC ZIP og merge impressions → prioritet
3. Opdater denne fil med dokumenterede Volume/KD — aldrig gæt
