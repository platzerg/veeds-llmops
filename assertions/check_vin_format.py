"""
Custom Python Assertion: Prüft ob eine VIN im Output korrekt formatiert ist
Verwendung in promptfooconfig.yaml:
  assert:
    - type: python
      value: file://assertions/check_vin_format.py
"""

import re

def get_assert(output: str, context: dict) -> dict:
    """
    Prüft ob VINs im Output korrekt formatiert sind.
    
    VIN-Regeln:
    - Genau 17 Zeichen
    - Nur Großbuchstaben und Zahlen
    - Keine I, O, Q (Verwechslungsgefahr)
    
    Args:
        output: Die LLM-Antwort
        context: Kontext mit vars, prompt, etc.
    
    Returns:
        dict mit pass, score, reason
    """
    # VIN-Pattern: 17 alphanumerische Zeichen
    vin_pattern = r'\b[A-HJ-NPR-Z0-9]{17}\b'
    
    found_vins = re.findall(vin_pattern, output.upper())
    
    if not found_vins:
        # Keine VIN im Output - das ist OK, wenn keine erwartet wird
        return {
            "pass": True,
            "score": 1.0,
            "reason": "Keine VIN im Output gefunden (neutral)"
        }
    
    valid_vins = []
    invalid_vins = []
    
    for vin in found_vins:
        # Prüfe auf verbotene Zeichen
        if re.search(r'[IOQ]', vin):
            invalid_vins.append(f"{vin} (enthält I, O oder Q)")
        else:
            valid_vins.append(vin)
    
    if invalid_vins:
        return {
            "pass": False,
            "score": 0.0,
            "reason": f"Ungültige VINs gefunden: {', '.join(invalid_vins)}"
        }
    
    return {
        "pass": True,
        "score": 1.0,
        "reason": f"Alle VINs korrekt formatiert: {', '.join(valid_vins)}"
    }
