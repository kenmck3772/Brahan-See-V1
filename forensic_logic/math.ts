export function calculateLinearRegression(data: number[]): { slope: number; intercept: number; rSquared: number } {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0, rSquared: 0 };
  const x = Array.from({ length: n }, (_, i) => i);
  const y = data;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const num = (n * sumXY - sumX * sumY);
  const den = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  const rValue = den === 0 ? 0 : num / den;
  const rSquared = rValue * rValue;

  return { slope, intercept, rSquared };
}

export function diagnoseSawtooth(rSquared: number, slope: number): { status: string; color: string; diagnosis: string } {
  const absSlope = Math.abs(slope);
  
  // High confidence linear behavior (Consistent recharge/leak)
  if (rSquared > 0.98) {
    if (absSlope > 15) {
      return {
        status: "🔴 CRITICAL: RAPID FLOW BREACH",
        color: "#ef4444", 
        diagnosis: `Extreme linear recharge at ${absSlope.toFixed(2)} PSI/unit. Direct high-pressure conduit confirmed. Immediate shutdown of parent well advised.`
      };
    } else if (absSlope > 5) {
      return {
        status: "🟠 WARNING: STEADY RECHARGE",
        color: "#f97316", 
        diagnosis: `Steady linear build-up (${absSlope.toFixed(2)} PSI/unit). High-flow micro-annulus or valve bypass. Monitor for escalation.`
      };
    } else {
      return {
        status: "🟡 CAUTION: PERSISTENT INGRESS",
        color: "#fbbf24", 
        diagnosis: `Slow but highly consistent linear ingress (${absSlope.toFixed(3)} PSI/unit). Likely gas migration from lower reservoir. Potential for gas-cap formation.`
      };
    }
  } 
  
  // Moderate confidence (Unstable or transient effects)
  else if (rSquared > 0.85) {
    if (absSlope > 2) {
      return {
        status: "🔵 UNSTABLE: HYDRAULIC TRANSIENT",
        color: "#3b82f6",
        diagnosis: `Fluctuating pressure shift. Signature suggests thermal expansion or fluid cooling combined with minor seepage.`
      };
    } else {
      return {
        status: "🟢 STABLE: NORMAL OPERATIONS",
        color: "#10b981",
        diagnosis: "Minimal pressure delta. Residual fluctuations consistent with diurnal thermal cycling."
      };
    }
  } 
  
  // Low confidence (Erratic/Non-linear)
  else {
    return {
      status: "🟢 SYSTEM_IDLE: STATIC ANNULUS",
      color: "#10b981",
      diagnosis: "Non-linear pressure behavior detected. Typical of closed-system thermal normalization or localized fluid compression."
    };
  }
}
