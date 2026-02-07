/**
 * JavaScript Assertion: Prüft ob Antwort auf Deutsch ist
 * 
 * Usage in Promptfoo:
 *   assert:
 *     - type: javascript
 *       value: file://assertions/check_german.js
 */

// Deutsche Wörter und Muster
const GERMAN_PATTERNS = [
  /\b(der|die|das|ein|eine|und|oder|ist|sind|wird|werden|hat|haben|kann|können)\b/gi,
  /[äöüß]/i,
  /\b(nicht|auch|aber|wenn|dann|weil|dass|damit|jedoch)\b/gi,
  /\b(Fahrzeug|Nummer|Zeichen|Hersteller|Information)\b/gi
];

// Englische Wörter (sollten nicht vorkommen)
const ENGLISH_PATTERNS = [
  /\b(the|is|are|was|were|has|have|can|will|would|should)\b/gi,
  /\b(vehicle|number|character|manufacturer|information)\b/gi
];

function getAssert(output, context) {
  if (!output || typeof output !== 'string') {
    return {
      pass: false,
      score: 0,
      reason: 'Keine Ausgabe vorhanden'
    };
  }

  let germanScore = 0;
  let englishScore = 0;

  // Zähle deutsche Muster
  for (const pattern of GERMAN_PATTERNS) {
    const matches = output.match(pattern);
    if (matches) {
      germanScore += matches.length;
    }
  }

  // Zähle englische Muster
  for (const pattern of ENGLISH_PATTERNS) {
    const matches = output.match(pattern);
    if (matches) {
      englishScore += matches.length;
    }
  }

  // Berechne Verhältnis
  const totalMatches = germanScore + englishScore;
  const germanRatio = totalMatches > 0 ? germanScore / totalMatches : 0;

  // Mindestens 70% deutsche Wörter
  const pass = germanRatio >= 0.7 && germanScore >= 3;
  const score = Math.min(germanRatio, 1);

  return {
    pass,
    score,
    reason: pass 
      ? `Antwort ist auf Deutsch (${Math.round(germanRatio * 100)}% deutsche Wörter)`
      : `Antwort ist nicht ausreichend auf Deutsch (${Math.round(germanRatio * 100)}% deutsche Wörter, min: 70%)`
  };
}

module.exports = getAssert;
