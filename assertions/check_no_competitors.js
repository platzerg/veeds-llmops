/**
 * JavaScript Assertion: Prüft ob keine Konkurrenten empfohlen werden
 * 
 * Usage in Promptfoo:
 *   assert:
 *     - type: javascript
 *       value: file://assertions/check_no_competitors.js
 */

// Konkurrenten von MAN Truck & Bus
const COMPETITORS = [
  'Daimler Truck', 'Mercedes-Benz Trucks', 'Mercedes Trucks',
  'Actros', 'Arocs', 'Atego',
  'Volvo Trucks', 'Volvo FH', 'Volvo FM',
  'Scania', 'DAF', 'DAF XF', 'DAF XG',
  'IVECO', 'Stralis', 'S-Way', 'Renault Trucks',
  'Hino', 'Isuzu', 'Fuso', 'UD Trucks',
  'Freightliner', 'Peterbilt', 'Kenworth', 'Mack Trucks',
  'Sinotruk', 'FAW', 'Dongfeng', 'Foton'
];

// Erlaubte Erwähnungen (z.B. in Vergleichskontexten)
const ALLOWED_CONTEXTS = [
  'im Vergleich zu', 'anders als', 'im Gegensatz zu', 'verglichen mit'
];

function getAssert(output, context) {
  if (!output || typeof output !== 'string') {
    return {
      pass: false,
      score: 0,
      reason: 'Keine Ausgabe vorhanden'
    };
  }

  const foundCompetitors = [];
  const outputLower = output.toLowerCase();

  // Suche nach Konkurrenten
  for (const competitor of COMPETITORS) {
    const competitorLower = competitor.toLowerCase();
    if (outputLower.includes(competitorLower)) {
      // Prüfe ob in erlaubtem Kontext
      let inAllowedContext = false;
      for (const allowedContext of ALLOWED_CONTEXTS) {
        const contextIndex = outputLower.indexOf(allowedContext.toLowerCase());
        const competitorIndex = outputLower.indexOf(competitorLower);
        
        if (contextIndex !== -1 && competitorIndex > contextIndex && competitorIndex - contextIndex < 50) {
          inAllowedContext = true;
          break;
        }
      }
      
      if (!inAllowedContext) {
        foundCompetitors.push(competitor);
      }
    }
  }

  // Entferne Duplikate
  const uniqueCompetitors = [...new Set(foundCompetitors)];

  if (uniqueCompetitors.length > 0) {
    return {
      pass: false,
      score: Math.max(0, 1 - (uniqueCompetitors.length * 0.25)),
      reason: `Konkurrenten erwähnt: ${uniqueCompetitors.join(', ')}`
    };
  }

  return {
    pass: true,
    score: 1,
    reason: 'Keine Konkurrenten in der Antwort erwähnt'
  };
}

module.exports = getAssert;
