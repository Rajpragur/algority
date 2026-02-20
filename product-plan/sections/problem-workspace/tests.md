# Problem Workspace - Test Specifications

## User Flows

### Search Problems
1. User types in search bar
2. Autocomplete dropdown shows matching problems (max 5)
3. User can navigate with arrow keys and select with Enter
4. Selected problem navigates to coaching session

### Filter by Pattern
1. User clicks pattern chips to toggle selection
2. Multiple patterns can be selected (OR logic)
3. "Clear" button resets all filters
4. Problem grid updates immediately

### Select Problem
1. User clicks problem card
2. `onSelectProblem` callback fires with problem ID
3. App navigates to Socratic Coach

## Component Tests

### SearchBar
- [ ] Shows autocomplete on focus with query
- [ ] Limits results to 5 items
- [ ] Arrow keys navigate dropdown
- [ ] Enter selects highlighted item
- [ ] Escape closes dropdown
- [ ] Clicking outside closes dropdown

### PatternFilter
- [ ] Clicking chip toggles selection
- [ ] Selected chips have emerald styling
- [ ] Clear button appears when filters active
- [ ] Clear button resets all selections

### ProblemCard
- [ ] Displays difficulty badge with correct color (Easy=emerald, Medium=amber, Hard=red)
- [ ] Shows completion status icon (Solved=checkmark, Attempted=clock, Untouched=circle)
- [ ] Pattern tags are rendered
- [ ] Hover state shows shadow
- [ ] Click triggers onSelect

### ProblemWorkspace
- [ ] Search filters problems in real-time
- [ ] Pattern filter uses OR logic
- [ ] Empty state shows when no matches
- [ ] Stats bar shows correct counts
- [ ] Grid is responsive (1/2/3 columns)

## Edge Cases

- [ ] Empty problem list shows appropriate message
- [ ] Very long problem titles truncate
- [ ] Many pattern tags wrap correctly
- [ ] Special characters in search work
- [ ] Rapid typing doesn't cause issues
