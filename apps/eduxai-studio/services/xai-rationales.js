// XAI rationale blocks (unique, research-aligned)
// 1. Purpose of the exercise
const rationale_purpose = `
  <b>Why this exercise?</b><br>
  This activity was selected to support your learning goals, based on evidence from educational research and your personal learning profile.
`;

// 2. Evidence-based justification
const rationale_evidence = `
  <b>Evidence-based selection</b><br>
  The recommendation is grounded in research from educational psychology and cognitive science, prioritizing activities with demonstrated positive outcomes.
`;

// 3. Personalization and transparency
const rationale_personalization = `
  <b>Personalization & Transparency</b><br>
  The system adapts recommendations to your prior knowledge, interests, and progress. The main factors influencing this choice are visible to you for review.
`;

// 4. Limitations
const rationale_limitations = `
  <b>Limitations</b><br>
  Recommendations are based on current evidence and available data, but may not be perfect. Please use your own judgment and context.
`;

// Export only unique, research-aligned rationale blocks
export const XAI_RATIONALES = [
  rationale_purpose,
  rationale_evidence,
  rationale_personalization,
  rationale_limitations
];
