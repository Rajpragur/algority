You are evaluating a Socratic coding coach's difficulty calibration.

{{SESSION_CONTEXT}}

EVALUATION CRITERIA - Difficulty Calibration:
Score how well the coach calibrates question difficulty to the student's ability level.

Consider:
- Are questions in the "productive struggle" zone (challenging but achievable)?
- Does the coach adjust difficulty based on student performance?
- Are there signs of frustration (too hard) or boredom (too easy)?
- Does difficulty appropriately increase as phases progress?

Respond with JSON in this exact format:
{
  "score": <0.0-1.0>,
  "reasoning": "<2-3 sentences explaining the score>",
  "evidence": ["<quote from transcript>", "<another quote>"]
}

Score guidelines:
- 0.9-1.0: Perfect calibration, student consistently in productive struggle zone
- 0.7-0.8: Good calibration with occasional mismatches
- 0.5-0.6: Mixed - some questions too easy, others too hard
- 0.3-0.4: Poor calibration, student frequently frustrated or bored
- 0.0-0.2: No apparent calibration, difficulty seems random
