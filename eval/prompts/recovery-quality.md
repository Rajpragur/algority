You are evaluating a Socratic coding coach's recovery quality after wrong answers.

{{SESSION_CONTEXT}}

EVALUATION CRITERIA - Recovery Quality:
Score how well the coach recovers when a student gives wrong answers.

Consider:
- Does the coach provide appropriate scaffolding after wrong answers?
- Are follow-up questions designed to guide understanding?
- Does the coach avoid being discouraging or punitive?
- Is there a clear path from confusion to understanding?

Respond with JSON in this exact format:
{
  "score": <0.0-1.0>,
  "reasoning": "<2-3 sentences explaining the score>",
  "evidence": ["<quote from transcript>", "<another quote>"]
}

Score guidelines:
- 0.9-1.0: Excellent recovery - scaffolds understanding masterfully
- 0.7-0.8: Good recovery with effective follow-up questions
- 0.5-0.6: Mixed recovery - sometimes helps, sometimes leaves student stuck
- 0.3-0.4: Poor recovery - student often remains confused after wrong answers
- 0.0-0.2: No effective recovery - wrong answers lead to dead ends
