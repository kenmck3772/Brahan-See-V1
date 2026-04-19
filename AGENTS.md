# Sovereign Terminal: Project Instructions & Conventions

This document contains persistent rules, architectural patterns, and design guidelines for the Brahan Sovereign Terminal development.

## 1. Visual Identity & Aesthetic
- **Mood**: Cyber-forensic, high-trust, technical, mission-critical.
- **Aesthetic Ref**: Technical Dashboard / Specialist Tool.
- **Color Palette**:
    - **Primary**: Emerald Green (`#10b981`) for nominal states, data markers, and holographic lines.
    - **Anomaly/Alert**: Crimson Red (`#ef4444`) for datum shift issues, critical stresses, and diagnostic warnings.
    - **Warning/Status**: Amber (`#f59e0b`) for pending release or caution states.
    - **Background**: Deep Slate / Black (`#020617` / `#000000`).
- **UI Elements**:
    - Use "Glass" panels (backdrop blur + subtle borders).
    - Prefer monospace fonts (`Fira Code`, `JetBrains Mono`) for data values and terminal labels.
    - Icons must be from `lucide-react`.

## 2. Terminology (The "Forensic Tone")
Always use technical/forensic descriptors in the UI for immersion:
- **File Upload** -> *Forensic Artifact Ingestion*
- **Downloading** -> *Harvesting Registry Records*
- **Loading** -> *Synthesizing Data Fields*
- **Error** -> *Logic Fault / Integrity Compromised*
- **Search** -> *Crawl Registry / Scan Graph*

## 3. 3D Visualization Patterns (TraumaNode)
- **Engine**: Plotly.js (`scatter3d`, `mesh3d`, `surface`).
- **Interaction**:
    - **Hover**: Subtle pulsing rings at the hovered depth (`hoverPulseScale`).
    - **Selection**: "Breathing" pulse on the 3D surface + a holographic selection orb with a vertical ring at the specific node coordinate.
    - **Scanning**: Automated sweep rings (`SCAN_SWEEP_RING`) that distort the mesh radius slightly as they pass.
- **Lighting**: High specular (`specular: 3.5`), low roughness (`roughness: 0.05`), and strong Fresnel effects (`fresnel: 2.5`) to create a "glass/liquid" holographic feel.

## 4. Coding Conventions
- **State Management**: Use React hooks. Stabilize animation scales (`requestAnimationFrame`) within `useEffect` or `useMemo` to prevent infinite re-renders.
- **Component Structure**: Keep business logic in services (e.g., `ndrService.ts`, `geminiService.ts`) and UI in functional components.
- **Styling**: Tailwind CSS exclusively. No separate CSS files.
- **Error Handling**: Use the forensic tone for error messages. Log critical failures to the `Black Box` forensic log system when applicable.

## 5. Metadata & Permissions
- Ensure `metadata.json` is updated if new app-level permissions (camera, etc.) are required.
- Maintain `requestFramePermissions` accurately.
