# Progress Dashboard - Test Specifications

## User Flows

### View Overall Progress
1. User navigates to Progress Dashboard
2. Summary stats show at top (problems solved, accuracy, patterns mastered, streak)
3. Pattern mastery grid shows all patterns
4. Recent activity list shows last sessions

## Component Tests

### StatCard
- [ ] Label displays correctly (uppercase)
- [ ] Value displays as large number
- [ ] Percentage type shows % suffix
- [ ] Streak type shows fire emoji
- [ ] Subtext is visible

### PatternCard
- [ ] Progress ring shows correct percentage
- [ ] Ring color matches status (emerald/amber/slate)
- [ ] Success rate in center of ring
- [ ] Pattern name and description visible
- [ ] Problems count (X/Y) is accurate
- [ ] Status label matches data

### SessionRow
- [ ] Solved shows green checkmark
- [ ] Not-solved shows red X
- [ ] Problem name displays
- [ ] Pattern tag is visible
- [ ] Duration in monospace
- [ ] Date shows relative format (Today, Yesterday, X days ago)

### ProgressDashboard
- [ ] Header text displays
- [ ] Stats grid is 2x2 on mobile, 4 columns on desktop
- [ ] Pattern grid is responsive
- [ ] Legend shows status colors
- [ ] Recent activity has dividers between rows

## Edge Cases

- [ ] Zero values display correctly
- [ ] 100% accuracy shows properly
- [ ] Long pattern names truncate
- [ ] Many patterns scroll correctly
- [ ] Old dates format as "Jan 1" style
- [ ] Empty sessions list handled
- [ ] Progress ring handles 0% and 100%
