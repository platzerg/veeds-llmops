/**
 * Output Transform Functions für Promptfoo
 * 
 * Transformiert LLM-Outputs vor der Assertion-Prüfung.
 * 
 * Usage in YAML:
 *   defaultTest:
 *     transform: file://scripts/transform-output.js
 * 
 * Dokumentation: https://www.promptfoo.dev/docs/configuration/parameters/#transform
 */

/**
 * Standard Transform - bereinigt und normalisiert Output
 * @param {string} output - LLM Output
 * @param {object} context - Test-Kontext mit vars, prompt, provider
 * @returns {string} - Transformierter Output
 */
module.exports = function transformOutput(output, context) {
  if (!output || typeof output !== 'string') {
    return output;
  }
  
  let transformed = output;
  
  // 1. Trim Whitespace
  transformed = transformed.trim();
  
  // 2. Entferne Markdown Code-Blöcke
  transformed = transformed
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .replace(/`/g, '');
  
  // 3. Normalisiere Zeilenumbrüche
  transformed = transformed.replace(/\r\n/g, '\n');
  
  // 4. Entferne übermäßige Leerzeilen
  transformed = transformed.replace(/\n{3,}/g, '\n\n');
  
  // 5. Entferne "Antwort:" Präfix wenn vorhanden
  transformed = transformed.replace(/^(Antwort|Answer|Response):\s*/i, '');
  
  return transformed;
};

/**
 * JSON Extraktor - extrahiert JSON aus dem Output
 */
module.exports.extractJson = function(output, context) {
  if (!output) return output;
  
  // Suche nach JSON-Objekt
  const jsonMatch = output.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      // Kein valides JSON
    }
  }
  
  // Suche nach JSON-Array
  const arrayMatch = output.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      // Kein valides JSON
    }
  }
  
  return output;
};

/**
 * Lowercase Transform - für case-insensitive Vergleiche
 */
module.exports.toLowerCase = function(output, context) {
  return output?.toLowerCase() || output;
};

/**
 * First Sentence - extrahiert nur den ersten Satz
 */
module.exports.firstSentence = function(output, context) {
  if (!output) return output;
  
  const match = output.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : output;
};

/**
 * Remove Thinking - entfernt "Denk"-Abschnitte (für Chain-of-Thought)
 */
module.exports.removeThinking = function(output, context) {
  if (!output) return output;
  
  // Entferne <thinking>...</thinking> Tags
  let cleaned = output.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  
  // Entferne "Let me think..." Abschnitte
  cleaned = cleaned.replace(/^(Let me think|Lass mich überlegen|Ich denke)[\s\S]*?\n\n/gi, '');
  
  return cleaned.trim();
};

/**
 * Metadata Enrichment - fügt Metadaten zum Output hinzu
 */
module.exports.withMetadata = function(output, context) {
  return {
    content: output,
    wordCount: output?.split(/\s+/).length || 0,
    charCount: output?.length || 0,
    hasJson: output?.includes('{') && output?.includes('}'),
    language: output?.match(/[äöüß]/i) ? 'de' : 'en',
    timestamp: new Date().toISOString()
  };
};
