export function buildXaiContract() {
    return {
        output_format: 'json_only',
        schema_version: 'xai-exercises/1.0.0',
        required_top_level: ['schema_version', 'resource_metadata', 'generation_context', 'exercises'],
        required_xai_fields: [
            'why_this_exercise',
            'pedagogical_alignment',
            'content_selection',
            'design_rationale',
            'fairness_and_risk',
            'uncertainty',
            'counterfactual',
            'trace'
        ],
        quality_rules: {
            min_rationale_length: 40,
            confidence_range: [0, 1],
            source_refs_min: 1,
            limitations_min: 1,
            max_critical_failure_rate: 0.2
        }
    };
}
