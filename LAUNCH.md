# tasko – Checkliste vor dem Livegang

Hosting: **GitHub Pages**, Deployment über GitHub Actions (`.github/workflows/pages.yml`).

Alle offenen Stellen im Code finden:

```sh
grep -rn "TODO" --include="*.html" --include="*.css" --include="*.js" --include="*.svg" --include="*.txt" --include="*.xml" --include="*.yml" .
```

## 1. GitHub Pages einrichten

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

`.nojekyll` sorgt dafür, dass GitHub die Dateien unverändert ausliefert (keine Jekyll-Verarbeitung).

## 2. Domain: `taskoapp.de`

Kanonische Adresse ist **`https://taskoapp.de`** (ohne `www`). Sie steht bereits in allen
Canonicals, OG/Twitter, JSON-LD, `robots.txt` und `sitemap.xml`.

**Wichtig:** Alle Pfade sind root-relativ (`/assets/...`). Das funktioniert nur unter der
eigenen Domain. Unter einer Projekt-Adresse wie `<name>.github.io/tasko/` fehlen CSS, JS,
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
- [ ] In Formspree `taskoapp.de` als erlaubte Domain eintragen (siehe Abschnitt 5)

Kontrolle, dass kein Platzhalter mehr im Code steht (darf nichts finden):

```sh
grep -rn "DOMAIN-PLATZHALTER" --exclude=LAUNCH.md .
```

## 3. Sicherheit

GitHub Pages erlaubt **keine eigenen HTTP-Header**. Deshalb steht in allen fünf HTML-Dateien
im `<head>`:

- `Content-Security-Policy` als `<meta http-equiv>`
- `Referrer-Policy` als `<meta name="referrer">`

Bei einer neuen Seite beide Meta-Tags mitkopieren. Bei Änderungen an der CSP (z. B. neuer
externer Dienst) alle Seiten gleich anpassen:

```sh
grep -rn "Content-Security-Policy" --include="*.html" .
```

Per Meta **nicht** möglich und damit aktuell nicht gesetzt: `frame-ancestors` (Schutz vor
Einbettung in fremde Seiten), `X-Content-Type-Options`, `Permissions-Policy`. Falls das später
nötig wird, geht es nur mit einem vorgeschalteten Dienst (z. B. Cloudflare) oder einem
anderen Hosting.

## 4. Rechtstexte

- [x] Impressum: Anschrift eingetragen, Abschnitt „Verantwortlich für den Inhalt“ entfernt – `impressum/index.html`
- [ ] Nach der Gründung: Impressum auf die Gesellschaft umstellen
- [ ] Datenschutzerklärung rechtlich prüfen, Stand-Datum aktuell halten – `datenschutz/index.html` (Quelltext: `scripts/_texte/tasko-datenschutz-website.md`)
- [ ] Abschnitt 5 Datenschutz anpassen, sobald Domain-Mail aktiv ist.
- [ ] Datenschutzhinweise zur Umfrage rechtlich prüfen, Stand-Datum aktuell halten – `datenschutz-umfrage/index.html`
- Quelltexte der Rechtstexte (Markdown) liegen in `scripts/_texte/`. Sie sind im Repo, werden aber nicht veröffentlicht.
- [x] Entwurfshinweise auf Impressum und Datenschutz entfernt
- [ ] JArbSchG-Formulierungen rechtlich prüfen lassen (Hero-Subline, OG-/Twitter-Description, Sicherheitskarte)
- [ ] Umfrage: Angabe zur Anonymität nur, wenn die Tally-Umfrage wirklich anonym ist

## 5. Kontaktformular (Formspree)

- [x] Eigener Formspree-Endpoint eingetragen: `https://formspree.io/f/xkjogzjv` (`action` in `index.html`, `main.js` sendet an `form.action`)
- [ ] In Formspree die erlaubte Domain `taskoapp.de` eintragen
- [ ] Testversand auf `https://taskoapp.de`: Erfolgsmeldung erscheint, Mail kommt an, alle Felder (Name, E-Mail, Ich bin …, Nachricht) sind enthalten
- [ ] Fehlerfall prüfen: Mit ungültiger ID erscheint die Fehlermeldung mit Mail-Adresse

## 6. Caching: `?v=` hochzählen

GitHub Pages liefert alle Dateien mit kurzer Cache-Dauer aus (ca. 10 Minuten), Browser und
CDN können CSS/JS aber trotzdem kurzzeitig alt anzeigen. Deshalb nach **jeder** Änderung an
`style.css`, `main.js` oder `early.js` die Versionsnummer in **allen fünf** HTML-Dateien
erhöhen (`index.html`, `impressum/index.html`, `datenschutz/index.html`, `datenschutz-umfrage/index.html`, `404.html`):

```html
<link rel="stylesheet" href="/assets/css/style.css?v=10">  →  ?v=11
<script src="/assets/js/main.js?v=8" defer></script>       →  ?v=9
<script src="/assets/js/early.js?v=8"></script>            →  ?v=9
```

Aktuellen Stand prüfen (alle Zeilen müssen dieselbe Anzahl „5“ zeigen):

```sh
grep -rho "\(style.css\|main.js\|early.js\)?v=[0-9]*" --include="*.html" . | sort | uniq -c
```

## 7. sitemap.xml

- [ ] `<lastmod>` bei jeder inhaltlichen Änderung auf das aktuelle Datum setzen (Format `JJJJ-MM-TT`, zuletzt gesetzt: 2026-10-06)
- [ ] Nach dem Livegang `https://taskoapp.de/sitemap.xml` in der Google Search Console einreichen

## 8. Bilder mit `scripts/images.py`

Erzeugt aus einem Originalfoto 4:5-Varianten in 960 px und 640 px Breite, jeweils als
JPG und WebP. EXIF-Daten (auch GPS) werden entfernt. Liegt das Original unter dem
Ziel-Namen, wird es vorher nach `scripts/_originals/` gesichert (per `.gitignore`
ausgeschlossen). Das Skript liegt im Repo, wird aber nicht veröffentlicht (siehe Abschnitt 1).

Einmalig einrichten:

```sh
python3 -m pip install pillow
```

Teamfotos (Original als `dion.jpg` bzw. `dana.jpg` in `assets/img/team/` ablegen):

```sh
python3 scripts/images.py assets/img/team/dion.jpg
python3 scripts/images.py assets/img/team/dana.jpg
```

Schnitt nach oben verschieben, falls der Kopf angeschnitten ist (0 = oben, 0.5 = Mitte, Standard 0.35):

```sh
python3 scripts/images.py assets/img/team/dana.jpg --focus 0.2
```

Ergebnis pro Foto: `name.jpg`, `name.webp` (960 × 1200) und `name-640.jpg`, `name-640.webp` (640 × 800).
Für Bilder muss `?v=` nicht erhöht werden.

## 9. Dateien & Inhalte

- [ ] Teamfotos eingebunden (siehe oben), Platzhalter mit Personen-Icon ersetzt
- [ ] Wortmarke als SVG aus der Originaldatei, ersetzt `assets/img/logo/tasko-wordmark.svg`
- [ ] Größeres bzw. SVG-Logo statt `tasko-logo-dark.png` (aktuell 264 px breit)
- [ ] Badge und Gelb `#F6C644` mit der Original-Designdatei abgleichen
- [ ] Alle Texte mit `TODO: Copy final` freigegeben
- [ ] IW-Köln-Studie verlinkt, Zahlen geprüft

## 10. Abschlusstest

- [ ] Netzwerk-Tab: beim Laden keine Requests an fremde Domains
- [ ] Konsole: keine CSP-Meldungen („Refused to …“)
- [ ] Lighthouse mobil ≥ 95 in allen Kategorien
- [ ] Safari Mac, Safari iPhone, Chrome Android
- [ ] Tastatur: alles erreichbar, Mobil-Menü mit Fokusfalle, Tabs per Pfeiltasten
- [ ] `prefers-reduced-motion` aktiv: keine Bewegung
- [ ] Kein horizontaler Scroll bei 360 px
- [ ] Umfrage-Links öffnen `https://tally.so/r/EkyG24` in neuem Tab
- [ ] Texte ohne Gedankenstriche (– —) und ohne „Wuppertal“ außerhalb von Impressum, Datenschutz und Datenschutzhinweisen zur Umfrage (dort ist die Anschrift Pflicht):
  `grep -rn "–\|—\|Wuppertal" --include="*.html" . | grep -v "<!--"`
- [ ] OG-Vorschau prüfen (z. B. beim Teilen in WhatsApp oder mit opengraph.xyz)
