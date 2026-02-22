# EduXAI Suite Changelog

This changelog tracks key milestones for **EduXAI Studio** and **EduXAI-Visor**.

## v0.11.0-beta (2026-02-22)

1. Added **SCORM 1.2 export** from EduXAI Studio as a zipped LMS-ready package.
2. SCORM export now embeds the selected student bundle (`package-bundle.json`) and `imsmanifest.xml`.
3. EduXAI-Visor can auto-load package bundles from URL parameters (`bundle=...`) for LMS launch flows.
4. Added SCORM runtime hooks in Visor to set completion and score in LMS (`cmi.core.lesson_status`, `cmi.core.score.raw`).
5. Added public version links in app footer (Changelog and Roadmap) and centralized app version metadata.

## v0.10.0-beta (2026-02-22)

1. Rebranding completed: `Exe Builder XAI` migrated to **EduXAI Studio** and viewer renamed to **EduXAI-Visor**.
2. Progressive review UX stabilized with clear panels/tabs: Exercise design, preview, pedagogical summary, technical XAI detail, and validation.
3. UDL workflow restructured around core + up to 3 variants, with stricter type-policy controls (`locked` / `equivalent`) and per-core export options.
4. Manual AI mode added: teachers can generate prompts, paste model JSON, validate/import, and continue working without direct API calls.
5. Project ecosystem improved: export/import for teacher project, export for students (visor package), and student results re-import into Studio insights.
