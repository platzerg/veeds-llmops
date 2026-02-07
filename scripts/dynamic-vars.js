/**
 * Dynamische Variablen für Promptfoo
 * 
 * Usage in YAML:
 *   vars:
 *     dynamicContext: file://scripts/dynamic-vars.js
 * 
 * @param {string} varName - Name der Variable
 * @param {string} prompt - Der aktuelle Prompt
 * @param {object} otherVars - Andere Variablen
 * @param {object} provider - Provider-Informationen
 * @returns {string} - Der Variablenwert
 */
module.exports = function(varName, prompt, otherVars, provider) {
  // Beispiel: Dynamischer Kontext basierend auf der Frage
  const query = otherVars.query || '';
  
  if (query.toLowerCase().includes('vin')) {
    return `
      Kontext: VIN (Vehicle Identification Number)
      - 17 Zeichen nach ISO 3779
      - WMI für MAN: WMA (Deutschland), XMC (Polen)
      - Position 10: Modelljahr
    `;
  }
  
  if (query.toLowerCase().includes('elektro') || query.toLowerCase().includes('etgm')) {
    return `
      Kontext: MAN Elektro-LKW
      - eTGM: bis 264 kWh, bis 200 km Reichweite
      - eTGX: Fernverkehr, bis 6 Batteriepacks
      - Ladezeit: ca. 45 Min (DC Schnellladen)
    `;
  }
  
  if (query.toLowerCase().includes('euro 6')) {
    return `
      Kontext: Abgasnormen
      - Euro 6d: seit 2019, RDE-Tests
      - Euro 6e: seit 2021, strengere RDE-Limits
      - Euro VII: ab 2027 geplant
    `;
  }
  
  // Default Kontext
  return `
    Kontext: MAN Truck & Bus
    - Führender europäischer Nutzfahrzeughersteller
    - Teil der TRATON GROUP
    - Produktpalette: TGL, TGM, TGS, TGX, Busse
  `;
};
