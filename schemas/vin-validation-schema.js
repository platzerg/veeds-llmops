/**
 * JSON Schema für VIN Validation Response
 * 
 * Usage in Promptfoo:
 *   assert:
 *     - type: javascript
 *       value: file://schemas/vin-validation-schema.js
 */

const vinValidationSchema = {
  type: "object",
  required: ["vin", "isValid"],
  properties: {
    vin: {
      type: "string",
      description: "Die zu validierende VIN",
      pattern: "^[A-HJ-NPR-Z0-9]{17}$"
    },
    isValid: {
      type: "boolean",
      description: "Ob die VIN gültig ist"
    },
    manufacturer: {
      type: "object",
      description: "Hersteller-Informationen aus WMI",
      properties: {
        code: { type: "string" },
        name: { type: "string" },
        country: { type: "string" }
      }
    },
    modelYear: {
      type: "string",
      description: "Modelljahr (Position 10)"
    },
    plant: {
      type: "string",
      description: "Produktionswerk (Position 11)"
    },
    serialNumber: {
      type: "string",
      description: "Seriennummer (Position 12-17)"
    },
    errors: {
      type: "array",
      description: "Validierungsfehler",
      items: {
        type: "object",
        properties: {
          position: { type: "integer" },
          message: { type: "string" }
        }
      }
    }
  }
};

// VIN Regex: 17 Zeichen, keine I, O, Q
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

/**
 * Validiert VIN-Validierungs-Response
 * @param {string} output - LLM Output (sollte JSON sein)
 * @param {object} context - Test-Kontext
 * @returns {object} - { pass, score, reason }
 */
module.exports = function validateVinResponse(output, context) {
  try {
    const data = JSON.parse(output);
    
    // Prüfe required fields
    if (!data.vin || typeof data.vin !== 'string') {
      return {
        pass: false,
        score: 0,
        reason: 'Feld "vin" fehlt oder ist kein String'
      };
    }
    
    if (typeof data.isValid !== 'boolean') {
      return {
        pass: false,
        score: 0.3,
        reason: 'Feld "isValid" fehlt oder ist kein Boolean'
      };
    }
    
    // Prüfe VIN Format
    if (!VIN_REGEX.test(data.vin)) {
      // Wenn VIN ungültig ist, sollte isValid false sein
      if (data.isValid === true) {
        return {
          pass: false,
          score: 0.5,
          reason: `VIN "${data.vin}" ist ungültig, aber isValid ist true`
        };
      }
    }
    
    // Prüfe auf verbotene Zeichen
    if (/[IOQ]/i.test(data.vin)) {
      if (data.isValid === true) {
        return {
          pass: false,
          score: 0.5,
          reason: 'VIN enthält verbotene Zeichen (I, O, Q), aber isValid ist true'
        };
      }
    }
    
    // Prüfe Länge
    if (data.vin.length !== 17) {
      if (data.isValid === true) {
        return {
          pass: false,
          score: 0.5,
          reason: `VIN hat ${data.vin.length} Zeichen (erwartet: 17), aber isValid ist true`
        };
      }
    }
    
    return {
      pass: true,
      score: 1,
      reason: 'JSON entspricht dem VIN Validation Schema'
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
module.exports.schema = vinValidationSchema;
module.exports.VIN_REGEX = VIN_REGEX;
