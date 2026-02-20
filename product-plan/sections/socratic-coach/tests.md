# Socratic Coach - Test Specifications

## User Flows

### Answer Single-Select Question
1. User sees question with A/B/C/D options
2. User clicks one option (radio button style)
3. Submit button becomes enabled
4. User clicks Submit
5. Feedback appears (Correct! or Not quite!)

### Answer Multi-Select Question
1. User sees "Select all that apply" instruction
2. User clicks multiple checkboxes
3. Submit button becomes enabled
4. User clicks Submit
5. Feedback shows result

### Review Completed Phase
1. User clicks on completed phase in progress bar
2. Phase content scrolls into view or modal opens
3. User can see their answers and feedback

### Complete All Phases
1. User answers all questions in all 4 phases
2. "Continue to Code Editor" button appears
3. User clicks button
4. `onProceedToEditor` callback fires

## Component Tests

### SessionHeader
- [ ] Displays problem title
- [ ] Shows difficulty badge with correct color
- [ ] Displays problem summary
- [ ] Timer shows in MM:SS format
- [ ] Pattern tags are visible

### PhaseProgress
- [ ] Desktop shows all 4 phases horizontally
- [ ] Mobile shows compact dots view
- [ ] Completed phases have checkmarks
- [ ] Active phase has pulse animation
- [ ] Locked phases show lock icon
- [ ] Clicking completed phase fires onReviewPhase

### QuestionCard
- [ ] Single-select allows only one selection
- [ ] Multi-select allows multiple selections
- [ ] Submit disabled until selection made
- [ ] Options show A/B/C/D labels
- [ ] Submitted state disables interactions

### MessageBubble
- [ ] Coach messages have emerald avatar
- [ ] Correct feedback has emerald styling
- [ ] Incorrect feedback has amber styling
- [ ] Content text is readable

### SocraticCoach
- [ ] Header is sticky on scroll
- [ ] Messages render in correct order
- [ ] User answers are tracked per question
- [ ] "Continue to Code Editor" appears when all phases complete

## Edge Cases

- [ ] Very long question text wraps correctly
- [ ] Many options scroll correctly
- [ ] Timer handles hours (60+ minutes)
- [ ] Empty phases array handled gracefully
- [ ] Network delays don't break UI state
