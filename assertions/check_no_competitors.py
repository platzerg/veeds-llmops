"""
Custom Python Assertion: Prüft ob keine Konkurrenzprodukte empfohlen werden
Verwendung in promptfooconfig.yaml:
  assert:
    - type: python
      value: file://assertions/check_no_competitors.py
"""

import re

# Konkurrenten von MAN Truck & Bus
COMPETITORS = {
    "daimler": ["daimler", "mercedes", "actros", "arocs", "atego", "econic"],
    "volvo": ["volvo trucks", "volvo fh", "volvo fm", "volvo fmx", "volvo fe"],
    "scania": ["scania", "scania r", "scania s", "scania g", "scania p"],
    "daf": ["daf", "daf xf", "daf xg", "daf cf", "daf lf"],
    "iveco": ["iveco", "stralis", "s-way", "eurocargo", "daily"],
    "renault": ["renault trucks", "renault t", "renault c", "renault k", "renault d"],
}


def get_assert(output: str, context: dict) -> dict:
    """
    Prüft ob keine Konkurrenzprodukte positiv erwähnt oder empfohlen werden.
    
    Args:
        output: Die LLM-Antwort
        context: Kontext mit vars, prompt, etc.
    
    Returns:
        dict mit pass, score, reason
    """
    output_lower = output.lower()
    
    found_competitors = []
    positive_mentions = []
    
    # Positive Wörter die auf Empfehlung hindeuten
    positive_words = [
        "empfehl", "besser", "überlegen", "vorteil", "gut", "hervorragend",
        "alternativ", "auch möglich", "in betracht", "option"
    ]
    
    for brand, keywords in COMPETITORS.items():
        for keyword in keywords:
            if keyword in output_lower:
                found_competitors.append(keyword)
                
                # Prüfe ob positiv erwähnt
                # Suche im Kontext um das Keyword
                pattern = rf'.{{0,50}}{re.escape(keyword)}.{{0,50}}'
                matches = re.findall(pattern, output_lower)
                
                for match in matches:
                    for pos_word in positive_words:
                        if pos_word in match:
                            positive_mentions.append(f"{keyword} ({pos_word})")
                            break
    
    if positive_mentions:
        return {
            "pass": False,
            "score": 0.0,
            "reason": f"Konkurrenzprodukte positiv erwähnt: {', '.join(set(positive_mentions))}"
        }
    
    if found_competitors:
        # Erwähnt, aber nicht positiv - Warnung
        return {
            "pass": True,
            "score": 0.7,
            "reason": f"Konkurrenten erwähnt (neutral): {', '.join(set(found_competitors))}"
        }
    
    return {
        "pass": True,
        "score": 1.0,
        "reason": "Keine Konkurrenzprodukte erwähnt"
    }
