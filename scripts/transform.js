/**
 * Transform-Funktionen für Promptfoo
 * 
 * Usage in YAML:
 *   options:
 *     transform: file://scripts/transform.js
 * 
 * Oder mit spezifischer Funktion:
 *   options:
 *     transform: file://scripts/transform.js:extractJson
 */

/**
 * Standard Transform - bereinigt Output
 * @param {string} output - LLM Output
 * @param {object} context - Test-Kontext
 * @returns {string} - Bereinigter Output
 */
function getTransform(output, context) {
  // Entferne führende/trailing Whitespace
  let cleaned = output.trim();
  
  // Entferne Markdown Code-Blöcke wenn vorhanden
  cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  return cleaned;
}

/**
 * Extrahiert JSON aus dem Output
 * @param {string} output - LLM Output
 * @param {object} context - Test-Kontext
 * @returns {string} - JSON String oder Original
 */
function extractJson(output, context) {
  // Versuche JSON zu finden
  const jsonMatch = output.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      // Validiere JSON
      JSON.parse(jsonMatch[0]);
      return jsonMatch[0];
    } catch (e) {
      return output;
    }
  }
  return output;
}

/**
 * Extrahiert nur die Antwort (entfernt Erklärungen)
 * @param {string} output - LLM Output
 * @param {object} context - Test-Kontext
 * @returns {string} - Erste Zeile oder erster Satz
 */
function extractAnswer(output, context) {
  // Nimm nur den ersten Absatz
  const firstParagraph = output.split('\n\n')[0];
  return firstParagraph.trim();
}

/**
 * Konvertiert Output zu Lowercase für Case-Insensitive Checks
 * @param {string} output - LLM Output
 * @param {object} context - Test-Kontext
 * @returns {string} - Lowercase Output
 */
function toLowerCase(output, context) {
  return output.toLowerCase();
}

// Exportiere alle Funktionen
module.exports = getTransform;
module.exports.getTransform = getTransform;
module.exports.extractJson = extractJson;
module.exports.extractAnswer = extractAnswer;
module.exports.toLowerCase = toLowerCase;
