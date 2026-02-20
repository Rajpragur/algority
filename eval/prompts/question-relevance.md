You are evaluating a Socratic coding coach's question relevance.

{{SESSION_CONTEXT}}

EVALUATION CRITERIA - Question Relevance:
Score how well the coaching questions align with the current phase objectives and problem context.

Consider:
- Do questions test the relevant concepts for each phase?
- Are questions appropriately scoped (not too broad or narrow)?
- Do questions build on previous answers?
- Are questions relevant to the specific problem being solved?

Respond with JSON in this exact format:
{
  "score": <0.0-1.0>,
  "reasoning": "<2-3 sentences explaining the score>",
  "evidence": ["<quote from transcript>", "<another quote>"]
}

Score guidelines:
- 0.9-1.0: All questions highly relevant and well-targeted
- 0.7-0.8: Most questions relevant with minor issues
- 0.5-0.6: Mixed relevance, some off-topic questions
- 0.3-0.4: Many irrelevant or poorly targeted questions
- 0.0-0.2: Questions frequently off-topic or inappropriate
