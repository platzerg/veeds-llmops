/**
 * JavaScript Assertion: Prüft Professionalität der Antwort
 * 
 * Usage in Promptfoo:
 *   assert:
 *     - type: javascript
 *       value: file://assertions/check_professional.js
 */

// Unprofessionelle Ausdrücke
const UNPROFESSIONAL_PATTERNS = [
  /\b(lol|haha|omg|wtf|rofl|lmao)\b/gi,
  /\b(cool|krass|geil|mega|hammer|alter)\b/gi,
  /!{2,}/g,  // Mehrere Ausrufezeichen
  /\?{2,}/g, // Mehrere Fragezeichen
  /\.{4,}/g, // Zu viele Punkte
  /😀|😂|🤣|😎|👍|🔥|💯/g, // Emojis
  /\b(ey|yo|hey|hi|hallo)\b/gi, // Informelle Begrüßungen
];

// Professionelle Indikatoren
const PROFESSIONAL_PATTERNS = [
  /\b(daher|somit|folglich|entsprechend|gemäß)\b/gi,
  /\b(bitte beachten|zu beachten|wichtig ist)\b/gi,
  /\b(technisch|spezifikation|standard|norm)\b/gi,
];

function getAssert(output, context) {
  if (!output || typeof output !== 'string') {
    return {
      pass: false,
      score: 0,
      reason: 'Keine Ausgabe vorhanden'
    };
  }

  const issues = [];
  let unprofessionalCount = 0;
  let professionalCount = 0;

  // Prüfe auf unprofessionelle Muster
  for (const pattern of UNPROFESSIONAL_PATTERNS) {
    const matches = output.match(pattern);
    if (matches) {
      unprofessionalCount += matches.length;
      issues.push(`Gefunden: "${matches.slice(0, 3).join(', ')}"`);
    }
  }

  // Zähle professionelle Indikatoren
  for (const pattern of PROFESSIONAL_PATTERNS) {
    const matches = output.match(pattern);
    if (matches) {
      professionalCount += matches.length;
    }
  }

  // Prüfe Satzstruktur (beginnt mit Großbuchstabe, endet mit Punkt)
  const sentences = output.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const properSentences = sentences.filter(s => /^[A-ZÄÖÜ]/.test(s.trim()));
  const sentenceRatio = sentences.length > 0 ? properSentences.length / sentences.length : 0;

  // Berechne Score
  const baseScore = unprofessionalCount === 0 ? 1 : Math.max(0, 1 - (unprofessionalCount * 0.2));
  const bonusScore = Math.min(professionalCount * 0.1, 0.2);
  const sentenceScore = sentenceRatio * 0.2;
  const finalScore = Math.min(baseScore + bonusScore + sentenceScore, 1);

  const pass = unprofessionalCount === 0 && finalScore >= 0.7;

  return {
    pass,
    score: finalScore,
    reason: pass
      ? `Antwort ist professionell (Score: ${Math.round(finalScore * 100)}%)`
      : `Antwort ist nicht professionell genug. ${issues.join(', ')}`
  };
}

module.exports = getAssert;
