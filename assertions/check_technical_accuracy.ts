/**
 * TypeScript Assertion: Prüft technische Korrektheit
 * 
 * Usage in Promptfoo:
 *   assert:
 *     - type: javascript
 *       value: file://assertions/check_technical_accuracy.ts
 */

interface AssertionResult {
  pass: boolean;
  score: number;
  reason: string;
}

interface AssertionContext {
  vars: Record<string, string>;
  prompt: string;
}

// Technische Fakten die korrekt sein müssen
const TECHNICAL_FACTS: Record<string, { correct: string[]; incorrect: string[] }> = {
  vin_length: {
    correct: ['17 zeichen', '17 stellen', '17-stellig', 'siebzehn zeichen', 'siebzehn stellen'],
    incorrect: ['16 zeichen', '18 zeichen', '15 zeichen', '20 zeichen']
  },
  vin_forbidden_chars: {
    correct: ['i, o, q', 'i o q', 'buchstaben i', 'buchstabe o', 'buchstabe q'],
    incorrect: ['alle buchstaben erlaubt', 'keine einschränkungen']
  },
  wmi_meaning: {
    correct: ['world manufacturer identifier', 'hersteller', 'herstellerkennung'],
    incorrect: ['world motor identifier', 'world model identifier']
  },
  euro_6d: {
    correct: ['abgasnorm', 'emission', 'schadstoff', 'nox'],
    incorrect: ['kraftstoffnorm', 'sicherheitsnorm']
  },
  adblue: {
    correct: ['harnstoff', 'scr', 'nox', '32,5%', '32.5%'],
    incorrect: ['diesel', 'benzin', 'kühlmittel']
  }
};

function getAssert(output: string, context: AssertionContext): AssertionResult {
  if (!output || typeof output !== 'string') {
    return {
      pass: false,
      score: 0,
      reason: 'Keine Ausgabe vorhanden'
    };
  }

  const outputLower = output.toLowerCase();
  const query = context.vars?.query?.toLowerCase() || '';
  
  const issues: string[] = [];
  const correctFacts: string[] = [];
  let relevantChecks = 0;
  let passedChecks = 0;

  // Bestimme relevante Fakten basierend auf der Frage
  const relevantTopics: string[] = [];
  
  if (query.includes('vin') || query.includes('fin') || query.includes('fahrzeug-identifikation')) {
    relevantTopics.push('vin_length', 'vin_forbidden_chars', 'wmi_meaning');
  }
  if (query.includes('euro') || query.includes('abgas')) {
    relevantTopics.push('euro_6d');
  }
  if (query.includes('adblue') || query.includes('def') || query.includes('harnstoff')) {
    relevantTopics.push('adblue');
  }

  // Wenn keine spezifischen Topics, prüfe alle
  const topicsToCheck = relevantTopics.length > 0 ? relevantTopics : Object.keys(TECHNICAL_FACTS);

  for (const topic of topicsToCheck) {
    const facts = TECHNICAL_FACTS[topic];
    if (!facts) continue;

    // Prüfe ob Topic im Output erwähnt wird
    const topicMentioned = facts.correct.some(c => outputLower.includes(c)) ||
                          facts.incorrect.some(i => outputLower.includes(i));

    if (topicMentioned) {
      relevantChecks++;

      // Prüfe auf inkorrekte Fakten
      const hasIncorrect = facts.incorrect.some(i => outputLower.includes(i));
      const hasCorrect = facts.correct.some(c => outputLower.includes(c));

      if (hasIncorrect && !hasCorrect) {
        issues.push(`Inkorrekt bei ${topic}`);
      } else if (hasCorrect) {
        passedChecks++;
        correctFacts.push(topic);
      }
    }
  }

  // Berechne Score
  const score = relevantChecks > 0 ? passedChecks / relevantChecks : 1;
  const pass = issues.length === 0 && score >= 0.8;

  return {
    pass,
    score,
    reason: pass
      ? `Technisch korrekt (${correctFacts.length} Fakten geprüft)`
      : `Technische Fehler: ${issues.join(', ')}`
  };
}

// CommonJS Export für Promptfoo
module.exports = getAssert;
module.exports.getAssert = getAssert;
module.exports.TECHNICAL_FACTS = TECHNICAL_FACTS;
