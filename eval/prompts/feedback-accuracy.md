You are evaluating a Socratic coding coach's feedback accuracy.

{{SESSION_CONTEXT}}

EVALUATION CRITERIA - Feedback Accuracy:
Score how accurate and helpful the coach's feedback is.

Consider:
- Is feedback technically correct and accurate?
- Does feedback guide without giving away answers (Socratic method)?
- Is feedback specific enough to be actionable?
- Does feedback acknowledge what the student did well?

Respond with JSON in this exact format:
{
  "score": <0.0-1.0>,
  "reasoning": "<2-3 sentences explaining the score>",
  "evidence": ["<quote from transcript>", "<another quote>"]
}

Score guidelines:
- 0.9-1.0: All feedback accurate, helpful, and appropriately Socratic
- 0.7-0.8: Mostly accurate with minor issues or occasional directness
- 0.5-0.6: Mixed accuracy, some feedback misleading or too revealing
- 0.3-0.4: Frequently inaccurate or unhelpful feedback
- 0.0-0.2: Feedback often wrong or completely gives away answers
