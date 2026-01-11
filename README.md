# e-days Chrome Extension

Chrome-Erweiterung für e-days TimeSubmission - zeigt Arbeitszeit und Pausen auf einen Blick.

## Problem

Bei e-days muss man die Arbeitszeit und Pausen immer im Kopf zusammenrechnen. Diese Extension zeigt:
- Gesamte Arbeitszeit des Tages
- Gesamte Pausenzeit
- Aktueller Status (arbeitet seit X, weg seit Y, Tag abgeschlossen)

## Funktionen

- Tagesstatistik auf einen Blick
- Navigation durch Wochentage
- Echtzeit-Status
- Funktioniert nur wenn e-days TimeSubmission Tab offen ist

## Installation
```bash
git clone <repo-url>
cd work-tracker
npm install
npm run build
```

## Konfiguration

Nach dem Build `dist/config.js` bearbeiten:
```javascript
export const config = {
  allowedUrl: 'https://deine-firma.e-days.com/TimeSubmission'
};
```

## In Chrome laden

1. `chrome://extensions/` öffnen
2. "Entwicklermodus" aktivieren
3. "Entpackte Erweiterung laden"
4. `dist/` Ordner auswählen

## Nutzung

1. e-days TimeSubmission Seite öffnen
2. Extension-Icon klicken
3. Statistik für heute anschauen
4. Mit ◀ ▶ durch Wochentage navigieren

## Entwicklung
```bash
npm test              # Tests ausführen
npm run test:watch    # Tests im Watch-Modus
npm run build         # Extension bauen
```

## Tech Stack

- Vanilla JavaScript (ES6)
- Vite
- Vitest
- Chrome Manifest V3
