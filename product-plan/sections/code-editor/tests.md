# Code Editor - Test Specifications

## User Flows

### Write and Run Code
1. User sees approach summary on left
2. User types code in editor on right
3. User clicks "Run Tests"
4. Test results update (pass/fail for each)

### Add Custom Test Case
1. User clicks "Add Test Case"
2. Form appears with input/expected fields
3. User fills in values and clicks "Add Test"
4. New test appears in list

### Request AI Critique
1. User clicks "Get AI Critique"
2. Critique panel appears with suggestions
3. Panel can be toggled open/closed

### Submit Solution
1. User clicks "Submit Solution"
2. Modal appears with loading state
3. Results show score, pass/fail counts
4. If accepted, "Next Problem" button appears

## Component Tests

### ApproachPanel
- [ ] Shows problem title and difficulty
- [ ] Displays numbered approach steps
- [ ] Shows time/space complexity
- [ ] Scrolls independently

### EditorPanel
- [ ] Line numbers update with content
- [ ] Code is editable
- [ ] Language label shows correctly
- [ ] File extension matches language
- [ ] Tab key works for indentation

### TestCasesPanel
- [ ] Shows pass/fail counts in header
- [ ] Expand/collapse toggle works
- [ ] "Add Test Case" form appears on click
- [ ] Cancel hides form without adding
- [ ] Delete button only on user tests
- [ ] Status icons correct (pending/running/passed/failed)

### CritiquePanel
- [ ] Toggle expands/collapses content
- [ ] Suggestion icons match type
- [ ] Overall assessment is visible
- [ ] Suggestion count in header

### SubmissionModal
- [ ] Correct icon/color for each status
- [ ] Score displays as percentage
- [ ] Test counts are correct
- [ ] Runtime and memory show
- [ ] "Review Code" closes modal
- [ ] "Next Problem" only shows on accepted

### CodeEditor
- [ ] Split panel on desktop
- [ ] Stacked on mobile
- [ ] Action buttons all fire callbacks
- [ ] Modal shows on submit

## Edge Cases

- [ ] Very long code scrolls correctly
- [ ] Empty code submission handled
- [ ] Many test cases scroll in panel
- [ ] Long test inputs truncate gracefully
- [ ] Network errors during submission handled
- [ ] Rapid Run Tests clicks debounced
