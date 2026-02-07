"""
Custom Python Assertion: Prüft technische Genauigkeit für LKW-Informationen
Verwendung in promptfooconfig.yaml:
  assert:
    - type: python
      value: file://assertions/check_technical_accuracy.py
"""

import re

# Bekannte technische Fakten
TECHNICAL_FACTS = {
    "vin_length": 17,
    "wmi_length": 3,
    "forbidden_vin_chars": ["I", "O", "Q"],
    "man_wmi_codes": ["WMA", "WMH", "XMC"],
    "euro_norms": ["Euro 5", "Euro 6", "Euro 6c", "Euro 6d", "Euro 6e"],
    "man_models": ["TGL", "TGM", "TGS", "TGX", "eTGM", "eTGS", "eTGX", "Lion's City"],
    "axle_configs": ["4x2", "4x4", "6x2", "6x4", "8x4", "8x8"],
}


def get_assert(output: str, context: dict) -> dict:
    """
    Prüft technische Genauigkeit der Antwort.
    
    Args:
        output: Die LLM-Antwort
        context: Kontext mit vars, prompt, etc.
    
    Returns:
        dict mit pass, score, reason
    """
    errors = []
    warnings = []
    
    output_lower = output.lower()
    
    # Prüfe VIN-Länge wenn erwähnt
    vin_length_match = re.search(r'vin.*?(\d+)[\s-]*(stellig|zeichen|character)', output_lower)
    if vin_length_match:
        mentioned_length = int(vin_length_match.group(1))
        if mentioned_length != TECHNICAL_FACTS["vin_length"]:
            errors.append(f"VIN-Länge falsch: {mentioned_length} statt 17")
    
    # Prüfe WMI-Länge wenn erwähnt
    wmi_length_match = re.search(r'wmi.*?(\d+)[\s-]*(stellig|zeichen|stellen)', output_lower)
    if wmi_length_match:
        mentioned_length = int(wmi_length_match.group(1))
        if mentioned_length != TECHNICAL_FACTS["wmi_length"]:
            errors.append(f"WMI-Länge falsch: {mentioned_length} statt 3")
    
    # Prüfe ob verbotene VIN-Zeichen korrekt genannt werden
    if "vin" in output_lower and ("buchstabe" in output_lower or "zeichen" in output_lower):
        if "i" in output_lower and "o" in output_lower:
            # Gut - beide verbotenen Buchstaben erwähnt
            pass
        elif "verwechsl" in output_lower:
            # Erwähnt Verwechslungsgefahr - auch OK
            pass
    
    # Prüfe Euro-Normen
    for norm in ["euro 7", "euro 8"]:
        if norm in output_lower:
            warnings.append(f"'{norm}' erwähnt - existiert noch nicht für LKW")
    
    # Prüfe auf offensichtlich falsche Zahlen
    # z.B. "VIN hat 15 Zeichen" oder "WMI hat 5 Stellen"
    
    # Berechne Score
    if errors:
        score = 0.0
        passed = False
        reason = f"Technische Fehler: {'; '.join(errors)}"
    elif warnings:
        score = 0.7
        passed = True
        reason = f"Technisch korrekt mit Warnungen: {'; '.join(warnings)}"
    else:
        score = 1.0
        passed = True
        reason = "Technisch korrekt"
    
    return {
        "pass": passed,
        "score": score,
        "reason": reason
    }
