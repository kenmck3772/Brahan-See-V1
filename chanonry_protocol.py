
import sys

def execute_chanonry_protocol(saturates, aromatics, resins, asphaltenes, treatment_fluid, pressure):
    """
    BRAHAN_SEER INDUSTRIAL ENGINE: ASPHALTENE_STABILITY_V4
    Predicts precipitation risk using the Colloidal Instability Index (CII).
    
    Formula: CII = (Saturates + Asphaltenes) / (Aromatics + Resins)
    Stability Constraint: CII < 0.9
    """
    
    # Header
    print("\n" + "="*50)
    print(">>> INITIATING CHANONRY_PROTOCOL_V4.1")
    print(">>> AUTHOR: BRAHAN_SEER_ENGINE")
    print(">>> CORPORATE_AUTH: WELLTEGRA_LTD_SC876023")
    print("="*50)

    # Calculate Colloidal Instability Index (CII)
    cii = (saturates + asphaltenes) / (aromatics + resins)
    is_acid = any(acid in treatment_fluid.upper() for acid in ["ACID", "HCL", "HF"])
    
    # Telemetry Output
    print(f"\n[TELEMETRY_STREAM]")
    print(f"> SATURATES:    {saturates:>6.2f} %")
    print(f"> AROMATICS:    {aromatics:>6.2f} %")
    print(f"> RESINS:       {resins:>6.2f} %")
    print(f"> ASPHALTENES:  {asphaltenes:>6.2f} %")
    print(f"> PUMP_FLUID:   {treatment_fluid.upper()}")
    print(f"> BHP_PRESSURE: {pressure:>6.2f} PSI")
    print("-" * 30)
    print(f"CII_CALCULATED: {cii:>6.4f}")
    print("-" * 30)

    # Diagnostic Logic
    if cii > 0.9:
        print("\n!!! CRITICAL_STABILITY_ALERT: UNSTABLE_COLLOIDAL_STRUCTURE !!!")
        if is_acid:
            print("!!! WARNING: ACID_INDUCTION_WILL_TRIGGER_SLUDGE_FORMATION !!!")
            print("!!! RIBBONS OF BLACK DETECTED !!!")
            print("!!! PREVENT THE BARREL. EXECUTE EMERGENCY_VETO. !!!")
            sys.exit(1) # Mechanical Veto
        else:
            print(">>> WARNING: OIL_UNSTABLE. BITUMEN_FLOC_POSSIBLE.")
            print(">>> RECOMMEND: RE-EVALUATE_STIMULATION_CHEMISTRY.")
    else:
        print("\n>>> STATUS: STABLE. COLLOIDAL_STRUCTURE_WITHIN_TOLERANCE.")
        print(">>> NO_BITUMEN_RISK_DETECTED. PROCEED_WITH_PUMP.")

if __name__ == "__main__":
    # Example invocation with unstable oil + acid treatment
    # SARA: 35.5, 25.0, 20.0, 19.5 -> CII = (35.5 + 19.5) / (25 + 20) = 1.22 (UNSTABLE)
    execute_chanonry_protocol(
        saturates=35.5, 
        aromatics=25.0, 
        resins=20.0, 
        asphaltenes=19.5, 
        treatment_fluid="15% HCl Acid", 
        pressure=4200.0
    )
