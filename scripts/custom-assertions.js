/**
 * Custom Assertion Provider für Promptfoo
 * 
 * Usage in YAML:
 *   assert:
 *     - type: javascript
 *       value: file://scripts/custom-assertions.js:isValidVin
 */

/**
 * Prüft ob der Output eine gültige VIN enthält
 * @param {string} output - LLM Output
 * @param {object} context - Assertion-Kontext
 * @returns {object} - { pass: boolean, score: number, reason: string }
 */
function isValidVin(output, context) {
  // VIN Pattern: 17 Zeichen, keine I, O, Q
  const vinPattern = /[A-HJ-NPR-Z0-9]{17}/g;
  const matches = output.match(vinPattern);
  
  if (matches && matches.length > 0) {
    // Prüfe ob es eine MAN VIN ist (beginnt mit WMA oder XMC)
    const isManVin = matches.some(vin => 
      vin.startsWith('WMA') || vin.startsWith('XMC')
    );
    
    return {
      pass: true,
      score: isManVin ? 1.0 : 0.8,
      reason: isManVin 
        ? `Gültige MAN VIN gefunden: ${matches[0]}`
        : `Gültige VIN gefunden: ${matches[0]} (kein MAN WMI)`
    };
  }
  
  return {
    pass: false,
    score: 0,
    reason: 'Keine gültige 17-stellige VIN im Output gefunden'
  };
}

/**
 * Prüft ob der Output technisch korrekte Informationen enthält
 * @param {string} output - LLM Output
 * @param {object} context - Assertion-Kontext
 * @returns {object} - { pass: boolean, score: number, reason: string }
 */
function isTechnicallyAccurate(output, context) {
  const errors = [];
  const outputLower = output.toLowerCase();
  
  // Bekannte falsche Aussagen prüfen
  if (outputLower.includes('vin hat 16 zeichen')) {
    errors.push('VIN hat 17 Zeichen, nicht 16');
  }
  
  if (outputLower.includes('vin hat 18 zeichen')) {
    errors.push('VIN hat 17 Zeichen, nicht 18');
  }
  
  if (outputLower.includes('buchstabe o ist erlaubt')) {
    errors.push('Buchstabe O ist in VIN nicht erlaubt');
  }
  
  if (errors.length === 0) {
    return {
      pass: true,
      score: 1.0,
      reason: 'Keine technischen Fehler gefunden'
    };
  }
  
  return {
    pass: false,
    score: 0,
    reason: `Technische Fehler: ${errors.join(', ')}`
  };
}

/**
 * Prüft ob die Antwort auf Deutsch ist
 * @param {string} output - LLM Output
 * @param {object} context - Assertion-Kontext
 * @returns {object} - { pass: boolean, score: number, reason: string }
 */
function isGerman(output, context) {
  // Einfache Heuristik: Deutsche Wörter suchen
  const germanIndicators = [
    'der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine',
    'für', 'mit', 'bei', 'auf', 'nach', 'über', 'unter'
  ];
  
  const outputLower = output.toLowerCase();
  const germanWordCount = germanIndicators.filter(word => 
    outputLower.includes(` ${word} `) || 
    outputLower.startsWith(`${word} `)
  ).length;
  
  const isGerman = germanWordCount >= 3;
  
  return {
    pass: isGerman,
    score: isGerman ? 1.0 : 0,
    reason: isGerman 
      ? `Antwort ist auf Deutsch (${germanWordCount} deutsche Wörter gefunden)`
      : 'Antwort scheint nicht auf Deutsch zu sein'
  };
}

// Exportiere Funktionen
module.exports = {
  isValidVin,
  isTechnicallyAccurate,
  isGerman
};
