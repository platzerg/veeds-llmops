"""
Custom Python Assertion: Prüft ob die Antwort professionell ist
Verwendung in promptfooconfig.yaml:
  assert:
    - type: python
      value: file://assertions/check_professional.py
"""

import re

def get_assert(output: str, context: dict) -> dict:
    """
    Prüft ob die Antwort professionell formuliert ist.
    
    Kriterien:
    - Keine umgangssprachlichen Ausdrücke
    - Keine Emojis
    - Keine übermäßige Verwendung von Ausrufezeichen
    - Höfliche Anrede
    
    Args:
        output: Die LLM-Antwort
        context: Kontext mit vars, prompt, etc.
    
    Returns:
        dict mit pass, score, reason
    """
    issues = []
    score = 1.0
    
    # Umgangssprachliche Ausdrücke
    informal_words = [
        'lol', 'haha', 'omg', 'wtf', 'krass', 'geil', 'mega', 'voll',
        'echt jetzt', 'alter', 'digga', 'bro', 'dude', 'yo', 'hey',
        'cool', 'nice', 'super geil', 'hammer'
    ]
    
    output_lower = output.lower()
    found_informal = [w for w in informal_words if w in output_lower]
    
    if found_informal:
        issues.append(f"Umgangssprachlich: {', '.join(found_informal)}")
        score -= 0.3
    
    # Emojis
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "]+", 
        flags=re.UNICODE
    )
    
    emojis = emoji_pattern.findall(output)
    if emojis:
        issues.append(f"Emojis gefunden: {len(emojis)}")
        score -= 0.2
    
    # Übermäßige Ausrufezeichen
    exclamation_count = output.count('!')
    if exclamation_count > 3:
        issues.append(f"Zu viele Ausrufezeichen: {exclamation_count}")
        score -= 0.1
    
    # Großbuchstaben-Wörter (SCHREIEN)
    caps_words = re.findall(r'\b[A-ZÄÖÜ]{4,}\b', output)
    # Ausnahmen: Abkürzungen wie VIN, WMI, LKW, MAN, TGX
    allowed_caps = ['VIN', 'WMI', 'LKW', 'MAN', 'TGX', 'TGS', 'TGM', 'TGL', 'EURO', 'ISO', 'DIN']
    caps_words = [w for w in caps_words if w not in allowed_caps]
    
    if caps_words:
        issues.append(f"Großbuchstaben-Wörter: {', '.join(caps_words[:3])}")
        score -= 0.1
    
    # Ergebnis
    score = max(0, score)
    passed = score >= 0.7
    
    if passed:
        if issues:
            reason = f"Professionell mit kleinen Mängeln: {'; '.join(issues)}"
        else:
            reason = "Antwort ist professionell formuliert"
    else:
        reason = f"Nicht professionell: {'; '.join(issues)}"
    
    return {
        "pass": passed,
        "score": score,
        "reason": reason
    }
