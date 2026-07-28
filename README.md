# e-days Chrome Extension

Chrome-Erweiterung für e-days TimeSubmission - zeigt Arbeitszeit und Pausen auf einen Blick.

## Problem

Bei e-days muss man die Arbeitszeit und Pausen immer im Kopf zusammenrechnen. Diese Extension zeigt:
- Gesamte Arbeitszeit des Tages
- Gesamte Pausenzeit
- Aktueller Status (arbeitet seit X, weg seit Y, Tag abgeschlossen)

## Funktionen

- Automatische Anzeige von Arbeitszeit, Pause und Status direkt unter jedem Tag auf der Zeiterfassungsseite — kein Klick nötig
- Popup als Zweitansicht: Tagesstatistik auf einen Blick, Navigation durch Wochentage
- Echtzeit-Status
- Voraussichtlicher Feierabend: zeigt, wann die für den Wochentag konfigurierte Soll-Arbeitszeit erreicht ist
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
  allowedUrl: 'https://deine-firma.e-days.com/TimeSubmission',
  // Optional. Soll-Arbeitszeit pro Wochentag, als Stunden-Zahl (8) oder als
  // "HH:MM"-String (7:28) für Minutengenauigkeit. Fehlende Tage verwenden
  // die Defaults (Mo-Fr: 8, Sa/So: 0).
  targetHours: { Mo: '08:00', Di: '08:00', Mi: '08:00', Do: '08:00', Fr: '08:00', Sa: 0, So: 0 }
};
```

## In Chrome laden

**WICHTIG:** Vor der Installation muss die e-days URL konfiguriert werden.

1. ZIP vom aktuellen Release herunterladen und entpacken
2. `dist/config.js` mit einem Texteditor öffnen
3. URL anpassen:
```javascript
export const config = {
  allowedUrl: 'https://deine-firma.e-days.com/TimeSubmission'
};
```

1. `chrome://extensions/` öffnen
2. "Entwicklermodus" aktivieren
3. "Entpackte Erweiterung laden"
4. `dist/` Ordner auswählen

## Nutzung
1. e-days TimeSubmission Seite öffnen
2. Arbeitszeit, Pause und Status erscheinen automatisch in Rot unter jedem Tag
3. Optional: Extension-Icon klicken, um dieselbe Statistik im Popup zu sehen und mit ◀ ▶ durch Wochentage zu navigieren

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
