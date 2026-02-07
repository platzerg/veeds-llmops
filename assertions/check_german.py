"""
Custom Python Assertion: Prüft ob die Antwort auf Deutsch ist
Verwendung in promptfooconfig.yaml:
  assert:
    - type: python
      value: file://assertions/check_german.py
"""

import re

def get_assert(output: str, context: dict) -> dict:
    """
    Prüft ob die Antwort auf Deutsch ist.
    
    Args:
        output: Die LLM-Antwort
        context: Kontext mit vars, prompt, etc.
    
    Returns:
        dict mit pass, score, reason
    """
    # Deutsche Umlaute und ß
    german_chars = re.findall(r'[äöüÄÖÜß]', output)
    
    # Typisch deutsche Wörter
    german_words = [
        'und', 'der', 'die', 'das', 'ist', 'sind', 'wird', 'werden',
        'bei', 'mit', 'für', 'auf', 'ein', 'eine', 'einer', 'eines',
        'nicht', 'auch', 'oder', 'aber', 'wenn', 'kann', 'können',
        'fahrzeug', 'lkw', 'truck', 'motor', 'achse'
    ]
    
    output_lower = output.lower()
    found_german_words = [w for w in german_words if w in output_lower]
    
    # Scoring
    has_umlauts = len(german_chars) > 0
    has_german_words = len(found_german_words) >= 3
    
    if has_umlauts and has_german_words:
        return {
            "pass": True,
            "score": 1.0,
            "reason": f"Antwort ist auf Deutsch (Umlaute: {len(german_chars)}, deutsche Wörter: {len(found_german_words)})"
        }
    elif has_german_words:
        return {
            "pass": True,
            "score": 0.8,
            "reason": f"Antwort enthält deutsche Wörter ({len(found_german_words)}), aber keine Umlaute"
        }
    else:
        return {
            "pass": False,
            "score": 0.0,
            "reason": "Antwort scheint nicht auf Deutsch zu sein"
        }
