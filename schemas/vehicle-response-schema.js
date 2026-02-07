/**
 * JSON Schema für Vehicle Information Response
 * 
 * Usage in Promptfoo:
 *   assert:
 *     - type: javascript
 *       value: file://schemas/vehicle-response-schema.js
 */

const vehicleResponseSchema = {
  type: "object",
  required: ["answer", "confidence"],
  properties: {
    answer: {
      type: "string",
      description: "Die Hauptantwort auf die Frage",
      minLength: 10
    },
    confidence: {
      type: "number",
      description: "Konfidenz-Score zwischen 0 und 1",
      minimum: 0,
      maximum: 1
    },
    sources: {
      type: "array",
      description: "Quellen für die Antwort",
      items: { type: "string" }
    },
    category: {
      type: "string",
      description: "Kategorie der Frage",
      enum: ["VIN", "Technik", "Wartung", "Elektro", "Allgemein"]
    },
    relatedTopics: {
      type: "array",
      description: "Verwandte Themen",
      items: { type: "string" }
    }
  },
  additionalProperties: false
};

/**
 * Validiert Output gegen das Schema
 * @param {string} output - LLM Output (sollte JSON sein)
 * @param {object} context - Test-Kontext
 * @returns {object} - { pass, score, reason }
 */
module.exports = function validateVehicleResponse(output, context) {
  try {
    const data = JSON.parse(output);
    
    // Prüfe required fields
    if (!data.answer || typeof data.answer !== 'string') {
      return {
        pass: false,
        score: 0,
        reason: 'Feld "answer" fehlt oder ist kein String'
      };
    }
    
    if (data.answer.length < 10) {
      return {
        pass: false,
        score: 0.3,
        reason: `Antwort zu kurz: ${data.answer.length} Zeichen (min: 10)`
      };
    }
    
    if (typeof data.confidence !== 'number') {
      return {
        pass: false,
        score: 0.5,
        reason: 'Feld "confidence" fehlt oder ist keine Zahl'
      };
    }
    
    if (data.confidence < 0 || data.confidence > 1) {
      return {
        pass: false,
        score: 0.5,
        reason: `Confidence außerhalb des Bereichs: ${data.confidence} (erwartet: 0-1)`
      };
    }
    
    // Prüfe optionale Felder
    if (data.category && !['VIN', 'Technik', 'Wartung', 'Elektro', 'Allgemein'].includes(data.category)) {
      return {
        pass: false,
        score: 0.7,
        reason: `Ungültige Kategorie: ${data.category}`
      };
    }
    
    return {
      pass: true,
      score: 1,
      reason: 'JSON entspricht dem Vehicle Response Schema'
    };
    
  } catch (e) {
    return {
      pass: false,
      score: 0,
      reason: `Kein valides JSON: ${e.message}`
    };
  }
};

// Exportiere auch das Schema für Referenz
module.exports.schema = vehicleResponseSchema;
