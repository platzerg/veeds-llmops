/**
 * JavaScript Assertion: Validiert VIN-Format in der Antwort
 * 
 * Usage in Promptfoo:
 *   assert:
 *     - type: javascript
 *       value: file://assertions/check_vin_format.js
 */

// VIN Regex: 17 Zeichen, keine I, O, Q
const VIN_REGEX = /\b[A-HJ-NPR-Z0-9]{17}\b/g;

// Verbotene Zeichen in VIN
const FORBIDDEN_CHARS = ['I', 'O', 'Q'];

function validateVin(vin) {
  const errors = [];

  // Prüfe Länge
  if (vin.length !== 17) {
    errors.push(`Länge: ${vin.length} (erwartet: 17)`);
  }

  // Prüfe auf verbotene Zeichen
  for (const char of FORBIDDEN_CHARS) {
    if (vin.includes(char)) {
      errors.push(`Verbotenes Zeichen: ${char}`);
    }
  }

  // Prüfe auf ungültige Zeichen
  if (!/^[A-HJ-NPR-Z0-9]+$/.test(vin)) {
    errors.push('Enthält ungültige Zeichen');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function getAssert(output, context) {
  if (!output || typeof output !== 'string') {
    return {
      pass: false,
      score: 0,
      reason: 'Keine Ausgabe vorhanden'
    };
  }

  // Suche nach VINs im Output
  const foundVins = output.match(VIN_REGEX) || [];

  // Wenn keine VIN erwartet wird, ist das OK
  const query = context.vars?.query?.toLowerCase() || '';
  const expectsVin = query.includes('vin') || query.includes('beispiel') || query.includes('example');

  if (foundVins.length === 0) {
    if (expectsVin) {
      return {
        pass: false,
        score: 0.5,
        reason: 'Keine VIN in der Antwort gefunden, obwohl eine erwartet wurde'
      };
    }
    return {
      pass: true,
      score: 1,
      reason: 'Keine VIN in der Antwort (nicht erwartet)'
    };
  }

  // Validiere gefundene VINs
  const validationResults = foundVins.map(vin => ({
    vin,
    ...validateVin(vin)
  }));

  const validVins = validationResults.filter(r => r.valid);
  const invalidVins = validationResults.filter(r => !r.valid);

  if (invalidVins.length > 0) {
    const errorDetails = invalidVins
      .map(r => `${r.vin}: ${r.errors.join(', ')}`)
      .join('; ');
    
    return {
      pass: false,
      score: validVins.length / foundVins.length,
      reason: `Ungültige VIN(s) gefunden: ${errorDetails}`
    };
  }

  return {
    pass: true,
    score: 1,
    reason: `${validVins.length} gültige VIN(s) gefunden: ${validVins.map(r => r.vin).join(', ')}`
  };
}

module.exports = getAssert;
