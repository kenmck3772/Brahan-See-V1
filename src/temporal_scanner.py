"""
Temporal Scanner: Analyzes N-Tuple history for degradation trends.
Detects recurring anomalies and degradation rates.
"""
from typing import List, Dict, Any
from datetime import datetime

class TemporalScanner:
    
    def analyze_frequency(self, history_tuples: List) -> Dict:
        """
        Analyzes how often a specific event occurs.
        Detects 'Normalisation of Deviance' (recurring issues treated as normal).
        """
        if len(history_tuples) < 2:
            return {"trend": "INSUFFICIENT_DATA", "degradation_rate": 0.0}

        # Sort tuples by timestamp
        # (Assuming timestamp is in ISO format string)
        sorted_history = sorted(history_tuples, key=lambda x: getattr(x, 'timestamp', ''))
        
        # Calculate time deltas
        events = []
        deltas = []
        for i in range(1, len(sorted_history)):
            prev = sorted_history[i-1]
            curr = sorted_history[i]
            
            try:
                # Try to parse ISO format timestamps
                t1 = datetime.fromisoformat(str(getattr(prev, 'timestamp', '')).replace('Z', '+00:00'))
                t2 = datetime.fromisoformat(str(getattr(curr, 'timestamp', '')).replace('Z', '+00:00'))
                delta_days = (t2 - t1).total_seconds() / 86400.0
                if delta_days >= 0:
                    deltas.append(delta_days)
            except (ValueError, AttributeError):
                # Fallback if timestamps are not valid ISO strings
                pass
            
            events.append({
                "from": getattr(prev, 'timestamp', ''),
                "to": getattr(curr, 'timestamp', ''),
                "change": f"{getattr(prev, 'value', 'N/A')} -> {getattr(curr, 'value', 'N/A')}"
            })
            
        if len(deltas) < 1:
            return {"trend": "INSUFFICIENT_DATA", "degradation_rate": 0.0, "details": events}
            
        trend = "RECURRING"
        degradation_rate = 0.0
        
        if len(deltas) >= 2:
            # Check if the time between events is decreasing (accelerating degradation)
            mid = len(deltas) // 2
            first_half = deltas[:mid]
            second_half = deltas[mid:]
            
            first_half_avg = sum(first_half) / len(first_half) if first_half else 0
            second_half_avg = sum(second_half) / len(second_half) if second_half else 0
            
            if second_half_avg < first_half_avg:
                trend = "ACCELERATING_DEGRADATION"
                # Rate of acceleration
                if first_half_avg > 0:
                    degradation_rate = (first_half_avg - second_half_avg) / first_half_avg
            elif second_half_avg > first_half_avg:
                trend = "STABILIZING"
                if second_half_avg > 0:
                    degradation_rate = (first_half_avg - second_half_avg) / second_half_avg
        
        return {
            "trend": trend,
            "frequency": len(events),
            "degradation_rate": round(degradation_rate, 4),
            "average_interval_days": round(sum(deltas)/len(deltas), 2) if deltas else None,
            "details": events
        }

    def detect_degradation_trend(self, history_tuples: List, startDepth: float = None, endDepth: float = None) -> str:
        """
        Detects if a value is trending towards a failure threshold.
        Example: Casing wear increasing over years.
        """
        # Filter for numeric values
        numeric_values = []
        for t in history_tuples:
            if startDepth is not None and hasattr(t, 'depth') and t.depth < startDepth:
                continue
            if endDepth is not None and hasattr(t, 'depth') and t.depth > endDepth:
                continue
                
            try:
                val = float(t.value)
                numeric_values.append(val)
            except (ValueError, TypeError):
                continue
        
        if len(numeric_values) < 2:
            return "STABLE"

        # Simple trend check: Is the last value significantly different from the first?
        first = numeric_values[0]
        last = numeric_values[-1]
        
        # If change > 10%, trend is ACTIVE
        change_percent = abs(last - first) / first if first != 0 else 0
        
        if change_percent > 0.1:
            return "DEGRADING"
        
        return "STABLE"
