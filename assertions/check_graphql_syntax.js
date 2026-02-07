/**
 * JavaScript Assertion: Validiert GraphQL Query Syntax
 * 
 * Usage in Promptfoo:
 *   assert:
 *     - type: javascript
 *       value: file://assertions/check_graphql_syntax.js
 */

function getAssert(output, context) {
  if (!output || typeof output !== 'string') {
    return {
      pass: false,
      score: 0,
      reason: 'Keine Ausgabe vorhanden'
    };
  }

  const issues = [];
  let score = 1;

  // Extrahiere GraphQL Query aus der Ausgabe
  let query = output;
  
  // Entferne Markdown Code-Blöcke falls vorhanden
  const codeBlockMatch = output.match(/```(?:graphql)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    query = codeBlockMatch[1].trim();
  }

  // 1. Prüfe ob es mit "query" beginnt
  if (!query.trim().startsWith('query')) {
    issues.push('Query beginnt nicht mit "query"');
    score -= 0.2;
  }

  // 2. Prüfe auf vehicleConfigurations
  if (!query.includes('vehicleConfigurations')) {
    issues.push('Fehlt: vehicleConfigurations');
    score -= 0.3;
  }

  // 3. Prüfe auf filter Parameter
  if (!query.includes('filter')) {
    issues.push('Fehlt: filter Parameter');
    score -= 0.2;
  }

  // 4. Prüfe auf balancierte Klammern
  const openBraces = (query.match(/{/g) || []).length;
  const closeBraces = (query.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    issues.push(`Unbalancierte Klammern: ${openBraces} { vs ${closeBraces} }`);
    score -= 0.3;
  }

  // 5. Prüfe auf balancierte Klammern ()
  const openParens = (query.match(/\(/g) || []).length;
  const closeParens = (query.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    issues.push(`Unbalancierte Klammern: ${openParens} ( vs ${closeParens} )`);
    score -= 0.2;
  }

  // 6. Prüfe auf balancierte eckige Klammern []
  const openBrackets = (query.match(/\[/g) || []).length;
  const closeBrackets = (query.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    issues.push(`Unbalancierte Klammern: ${openBrackets} [ vs ${closeBrackets} ]`);
    score -= 0.2;
  }

  // 7. Prüfe auf configurations in der Response
  if (!query.includes('configurations')) {
    issues.push('Fehlt: configurations in Response');
    score -= 0.1;
  }

  // 8. Prüfe auf gültige Filter-Operatoren
  const validOperators = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'wildcard', 'oneOf', 'exists'];
  const hasValidOperator = validOperators.some(op => query.includes(op + ':') || query.includes(op + ' :'));
  if (!hasValidOperator && query.includes('filter')) {
    issues.push('Kein gültiger Filter-Operator gefunden');
    score -= 0.2;
  }

  score = Math.max(0, score);
  const pass = score >= 0.7 && issues.length <= 2;

  return {
    pass,
    score,
    reason: pass
      ? `GraphQL Syntax valide (Score: ${Math.round(score * 100)}%)`
      : `GraphQL Syntax Probleme: ${issues.join(', ')}`
  };
}

module.exports = getAssert;
