# tasko – Checkliste und Projektaufbau

Hosting: **GitHub Pages**, Deployment über GitHub Actions (`.github/workflows/pages.yml`).
Die Website ist rein statisch: kein JavaScript, kein Build-Schritt, kein Tracking.

Alle offenen Stellen im Code finden:

```sh
grep -rn "TODO" --include="*.html" --include="*.css" --include="*.svg" --include="*.txt" --include="*.xml" --include="*.yml" . | grep -v _vorlage
```

## 1. Projektaufbau

```
index.html                 Startseite
impressum/  datenschutz/  datenschutz-umfrage/  404.html   Unterseiten
assets/css/home.css        Startseite (Layout, Farben, Animationen)
assets/css/header.css      Kopfzeile, gemeinsam für alle fünf Seiten
assets/css/style.css       Unterseiten (Rechtstexte, 404, Footer)
assets/fonts/              Poppins und Inter, selbst gehostet (keine Verbindung zu Google)
assets/img/                Fotos (foto1, foto2) und freigestellte App-Screens (app1–4, geld1–3)
assets/img/logo/           Logo-Dateien
assets/img/og/             Vorschaubild für Open Graph / Twitter
scripts/                   Hilfsskripte und Quelltexte der Rechtstexte (nicht veröffentlicht)
_vorlage/                  Referenzvorlage und Originalbilder (nur lokal, per .gitignore ausgeschlossen)
```

- Die Startseite lädt `home.css` und `header.css`, die Unterseiten `style.css` und `header.css`.
- Die Kopfzeile (Logo, App, Kontakt, Zur Umfrage) ist auf allen Seiten gleich. Auf den Unterseiten
  zeigen die Links auf `/#app` und `/#kontakt`, das Logo auf `/`.
- Eine neue Unterseite braucht `style.css`, `header.css`, die Kopfzeile aus einer bestehenden
  Unterseite und die Meta-Tags aus Abschnitt 4.

## 2. GitHub Pages einrichten

- [ ] Repo anlegen und pushen (Standard-Branch: `main`; bei anderem Namen in `pages.yml` unter `branches:` anpassen)
- [ ] Repo → **Settings → Pages → Source: „GitHub Actions“**
  - **Nicht** „Deploy from a branch“ wählen. Sonst wird das ganze Repo veröffentlicht, inklusive `scripts/`, `LAUNCH.md` und `.gitignore`.
- [ ] Repo → **Actions**: Der Workflow „Deploy to GitHub Pages“ läuft nach jedem Push auf `main` durch. Im Log steht die Liste der veröffentlichten Dateien.
- [ ] Prüfen, dass interne Dateien **nicht** erreichbar sind (müssen 404 liefern):
  - `https://taskoapp.de/scripts/images.py`
  - `https://taskoapp.de/LAUNCH.md`

### Was veröffentlicht wird

Der Workflow kopiert nur eine feste Liste nach `_site/`:

```
index.html  404.html  impressum/  datenschutz/  datenschutz-umfrage/  assets/
favicon.svg  apple-touch-icon.png  robots.txt  sitemap.xml  .nojekyll
```

Kommt eine neue Datei oder ein neuer Ordner im Root dazu (z. B. eine weitere Unterseite),
muss sie in `pages.yml` im Schritt „Nur Website-Dateien zusammenstellen“ ergänzt werden.
`_vorlage/` und `scripts/` werden nie veröffentlicht.

`.nojekyll` sorgt dafür, dass GitHub die Dateien unverändert ausliefert (keine Jekyll-Verarbeitung).

## 3. Domain: `taskoapp.de`

Kanonische Adresse ist **`https://taskoapp.de`** (ohne `www`). Sie steht bereits in allen
Canonicals, OG/Twitter, JSON-LD, `robots.txt` und `sitemap.xml`.

**Wichtig:** Alle Pfade sind root-relativ (`/assets/...`). Das funktioniert nur unter der
eigenen Domain. Unter einer Projekt-Adresse wie `<name>.github.io/tasko/` fehlen CSS,
Bilder und Fonts.

- [ ] Repo → Settings → Pages → **Custom domain**: `taskoapp.de` (ohne `www`) eintragen
- [ ] DNS beim Domain-Anbieter setzen (Werte laut GitHub-Doku „Managing a custom domain“ gegenprüfen):
  - `taskoapp.de` (Apex): A-Records auf `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  - optional zusätzlich AAAA-Records (IPv6) laut GitHub-Doku
  - `www.taskoapp.de`: CNAME auf `<name>.github.io` (GitHub leitet `www` dann automatisch auf `taskoapp.de` um)
- [ ] Domain in GitHub verifizieren (Account/Organisation → Settings → Pages → „Add a domain“), schützt vor Übernahme
- [ ] **Enforce HTTPS** aktivieren, sobald das Zertifikat bereitsteht
- [ ] Prüfen:
  - `https://taskoapp.de/` lädt mit Schriften, Bildern und ohne Konsolenfehler
  - `https://www.taskoapp.de/` leitet auf `https://taskoapp.de/` um
  - `http://taskoapp.de/` leitet auf `https://` um
  - `https://taskoapp.de/impressum` leitet auf `/impressum/` weiter
  - `https://taskoapp.de/gibt-es-nicht` zeigt die eigene 404-Seite

## 4. Sicherheit

GitHub Pages erlaubt **keine eigenen HTTP-Header**. Deshalb steht in allen fünf HTML-Dateien
im `<head>`:

- `Content-Security-Policy` als `<meta http-equiv>`
- `Referrer-Policy` als `<meta name="referrer">`

Die CSP ist auf allen Seiten gleich:

```
default-src 'self'; img-src 'self' data:; font-src 'self'; style-src 'self'; script-src 'none'; form-action 'none'; base-uri 'self'; object-src 'none'
```

- `script-src 'none'`: Die Seite lädt kein JavaScript. Das JSON-LD im `<head>` der Startseite
  ist ein Datenblock und wird davon nicht blockiert.
- `style-src 'self'`: keine Inline-Styles (`style="…"`) verwenden, alles in die CSS-Dateien.
- `form-action 'none'`: Es gibt kein Formular mehr.

Bei einer neuen Seite beide Meta-Tags mitkopieren. Bei Änderungen an der CSP (z. B. neuer
externer Dienst) alle Seiten gleich anpassen:

```sh
grep -rn "Content-Security-Policy" --include="*.html" . | grep -v _vorlage
```

Per Meta **nicht** möglich und damit aktuell nicht gesetzt: `frame-ancestors` (Schutz vor
Einbettung in fremde Seiten), `X-Content-Type-Options`, `Permissions-Policy`. Falls das später
nötig wird, geht es nur mit einem vorgeschalteten Dienst (z. B. Cloudflare) oder einem
anderen Hosting.

## 5. Rechtstexte

- [x] Impressum: Anschrift eingetragen, Abschnitt „Verantwortlich für den Inhalt“ entfernt – `impressum/index.html`
- [ ] Nach der Gründung: Impressum auf die Gesellschaft umstellen
- [ ] Datenschutzerklärung rechtlich prüfen, Stand-Datum aktuell halten – `datenschutz/index.html` (Quelltext: `scripts/_texte/tasko-datenschutz-website.md`)
- [ ] Quelltext `scripts/_texte/tasko-datenschutz-website.md` an die Website angleichen (Kontaktformular entfernt, Abschnitte neu nummeriert, Löschfrist in Abschnitt 4)
- [ ] Abschnitt 4 Datenschutz (Kontakt per E-Mail oder Telefon) anpassen, sobald Domain-Mail aktiv ist
- [ ] Datenschutzhinweise zur Umfrage rechtlich prüfen, Stand-Datum aktuell halten – `datenschutz-umfrage/index.html`
- Quelltexte der Rechtstexte (Markdown) liegen in `scripts/_texte/`. Sie sind im Repo, werden aber nicht veröffentlicht.
- [x] Entwurfshinweise auf Impressum und Datenschutz entfernt
- [ ] JArbSchG-Formulierungen rechtlich prüfen lassen: Abschnitt „Safety by Design“ (inkl. Paragrafen der vier Prüfschritte, offen: Karte 04 „Zeitfenster“), Meta-, OG- und Twitter-Description

## 6. Caching: `?v=` hochzählen

GitHub Pages liefert alle Dateien mit kurzer Cache-Dauer aus (ca. 10 Minuten), Browser und
CDN können CSS aber trotzdem kurzzeitig alt anzeigen. Deshalb nach **jeder** Änderung an
einer CSS-Datei deren Versionsnummer in allen Seiten erhöhen, die sie laden:

| Datei | eingebunden in |
|---|---|
| `home.css` | `index.html` |
| `header.css` | alle fünf Seiten |
| `style.css` | `impressum/`, `datenschutz/`, `datenschutz-umfrage/`, `404.html` |

```html
<link rel="stylesheet" href="/assets/css/header.css?v=1">  →  ?v=2
```

Aktuellen Stand prüfen (pro Datei darf es nur eine Versionsnummer geben):

```sh
grep -rho "\(home\|header\|style\)\.css?v=[0-9]*" --include="*.html" . | sort | uniq -c
```

## 7. sitemap.xml

- [ ] `<lastmod>` bei jeder inhaltlichen Änderung auf das aktuelle Datum setzen (Format `JJJJ-MM-TT`, zuletzt gesetzt: 2026-10-19 für Startseite und Datenschutz)
- [ ] Nach dem Livegang `https://taskoapp.de/sitemap.xml` in der Google Search Console einreichen

## 8. Bilder

Für Bilder muss `?v=` nicht erhöht werden. Alle Bilder liegen als WebP und als Rückfallformat
vor und werden über `<picture>` eingebunden.

**Fotos** (`foto1`, `foto2`): JPG + WebP. Neue WebP-Variante erzeugen:

```sh
cwebp -q 80 -metadata none assets/img/foto1.jpg -o assets/img/foto1.webp
```

**App-Screens** (`app1`–`app4`, `geld1`–`geld3`): freigestellt, der Hintergrund um den
Handyrahmen ist transparent. PNG + WebP mit Transparenz. Die unbearbeiteten Originale liegen in
`_vorlage/original-bilder/` (nur lokal).

Neuen Screen freistellen (erzeugt `name.png` und `name.webp` im Zielordner):

```sh
python3 -m pip install pillow numpy   # einmalig
python3 scripts/cutout.py assets/img _vorlage/original-bilder/app1.jpg
```

Das Skript erwartet einen einfarbigen Hintergrund um das Handy, wie bei den bisherigen
Screenshots. Danach die Kanten auf hellem Hintergrund vergrößert prüfen (kein grauer Saum).

`scripts/images.py` erzeugt aus einem Foto 4:5-Varianten (960 px und 640 px, JPG + WebP,
ohne EXIF/GPS). Es wird auf der aktuellen Startseite nicht verwendet.

## 9. Dateien & Inhalte

- [ ] Neues Open-Graph-Bild ohne den alten Claim, ersetzt `assets/img/og/tasko-og.jpg` (danach `og:image:alt` prüfen)
- [ ] Aktuelles Foto von Dana und Dion im Kasten „Heute“ der Startseite
- [ ] Wortmarke als SVG aus der Originaldatei, ersetzt `assets/img/logo/tasko-wordmark.svg`
- [ ] Größeres bzw. SVG-Logo statt `tasko-logo-dark.png` im Footer der Unterseiten (aktuell 264 px breit)
- [ ] Badge und Gelb `#F6C644` mit der Original-Designdatei abgleichen
- [ ] Text der 404-Seite freigeben (`TODO: Copy final`)

## 10. Abschlusstest

- [ ] Netzwerk-Tab: beim Laden keine Requests an fremde Domains
- [ ] Konsole: keine CSP-Meldungen („Refused to …“)
- [ ] Lighthouse mobil ≥ 95 in allen Kategorien
- [ ] Safari Mac, Safari iPhone, Chrome Android
- [ ] Tastatur: alle Links erreichbar, Fokus sichtbar, „Zum Inhalt springen“ funktioniert
- [ ] Animationen: Einstieg blendet beim Laden ein, Überschriften, Karten und Screens beim Scrollen
- [ ] Browser ohne `animation-timeline: view()`: alles sofort sichtbar
- [ ] `prefers-reduced-motion` aktiv: keine Bewegung, keine Übergänge
- [ ] Kein horizontaler Scroll bei 360 px
- [ ] Umfrage-Links öffnen `https://tally.so/r/EkyG24` in neuem Tab
- [ ] App-Screens auf der Seite: kein grauer Rand, kein heller Saum (auch auf Retina)
- [ ] Texte ohne Gedankenstriche (– —) und ohne „Wuppertal“ außerhalb von Impressum, Datenschutz und Datenschutzhinweisen zur Umfrage (dort ist die Anschrift Pflicht):
  `grep -rn "–\|—\|Wuppertal" --include="*.html" . | grep -v "<!--" | grep -v _vorlage`
- [ ] OG-Vorschau prüfen (z. B. beim Teilen in WhatsApp oder mit opengraph.xyz)
