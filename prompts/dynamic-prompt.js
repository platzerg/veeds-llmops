/**
 * Dynamic Prompt Function für Promptfoo
 * 
 * Generiert Prompts dynamisch basierend auf Kontext und Variablen.
 * 
 * Usage in YAML:
 *   prompts:
 *     - file://prompts/dynamic-prompt.js
 * 
 * Dokumentation: https://www.promptfoo.dev/docs/configuration/parameters/#prompt-functions
 */

/**
 * Generiert einen dynamischen Prompt basierend auf dem Kontext
 * @param {object} context - Enthält vars, provider, etc.
 * @returns {string|object} - Prompt String oder Chat-Messages Array
 */
module.exports = function generatePrompt(context) {
  const { vars, provider } = context;
  const query = vars.query || '';
  const language = vars.language || 'de';
  const tone = vars.tone || 'professional';
  const includeContext = vars.context ? true : false;
  
  // Sprach-spezifische Anweisungen
  const languageInstructions = {
    de: 'Antworte auf Deutsch.',
    en: 'Answer in English.',
    fr: 'Répondez en français.'
  };
  
  // Ton-spezifische Anweisungen
  const toneInstructions = {
    professional: 'Verwende einen professionellen, sachlichen Ton.',
    friendly: 'Sei freundlich und zugänglich.',
    technical: 'Verwende technische Fachbegriffe und sei präzise.'
  };
  
  // System-Prompt zusammenbauen
  let systemPrompt = `Du bist ein hilfreicher Assistent für Fahrzeuginformationen bei MAN Truck & Bus.

${languageInstructions[language] || languageInstructions.de}
${toneInstructions[tone] || toneInstructions.professional}

Wichtige Regeln:
- Beantworte nur Fragen zu Fahrzeugen, VIN, LKW-Technik
- Verweise bei Unsicherheit auf den MAN Kundenservice
- Nenne keine Konkurrenzprodukte`;

  // Kontext hinzufügen wenn vorhanden
  if (includeContext && vars.context) {
    systemPrompt += `\n\nKontext:\n${vars.context}`;
  }
  
  // Zeitstempel für Logging
  const timestamp = new Date().toISOString();
  
  // Rückgabe als Chat-Messages Array (für Chat-Modelle)
  return [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: `[${timestamp}] Frage: ${query}`
    }
  ];
};

/**
 * Alternative: Einfacher String-Prompt
 */
module.exports.simple = function(context) {
  const { vars } = context;
  return `Du bist ein Fahrzeug-Assistent. Frage: ${vars.query}`;
};

/**
 * Alternative: Mit Provider-spezifischer Anpassung
 */
module.exports.providerAware = function(context) {
  const { vars, provider } = context;
  
  // Anpassung basierend auf Provider
  const maxLength = provider?.id?.includes('haiku') ? 'kurz' : 'ausführlich';
  
  return `Du bist ein Fahrzeug-Assistent.
Antworte ${maxLength}.
Frage: ${vars.query}`;
};
