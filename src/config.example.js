export const config = {
    allowedUrl: 'https://your-company.e-days.com/TimeSubmission',
    // Optional. Soll-Arbeitszeit pro Wochentag, als Stunden-Zahl (8) oder als
    // "HH:MM"-String (7:28) für Minutengenauigkeit. Fehlende Tage verwenden
    // die Defaults (Mo-Fr: 8, Sa/So: 0).
    targetHours: { Mo: '08:00', Di: '08:00', Mi: '08:00', Do: '08:00', Fr: '08:00', Sa: 0, So: 0 }
  };