-- Problem Sets Data Population
-- Maps problems to curated problem sets (Blind 75, Grind 75, NeetCode 150)
-- =============================================================================
-- NOTE: This migration only inserts mappings for problems that exist in your database.
-- Premium LeetCode problems (like 271, 261, 269, 252, 253, 286, 323) are skipped if not present.

-- Insert Problem Sets
INSERT INTO problem_sets (id, name, description, source_url, problem_count) VALUES
  ('blind-75', 'Blind 75', 'The original curated list of 75 essential coding interview questions by Yangshun Tay. A focused set covering the most common patterns.', 'https://www.teamblind.com/post/new-year-gift-curated-list-of-top-75-leetcode-questions-to-save-your-time-oam1oreu', 75),
  ('grind-75', 'Grind 75', 'An updated and improved version of Blind 75 with better problem selection and structured weekly schedule. Created by the same author.', 'https://www.techinterviewhandbook.org/grind75/', 75),
  ('neetcode-150', 'NeetCode 150', 'The Blind 75 plus 75 additional problems for comprehensive interview preparation. Includes video solutions for every problem.', 'https://neetcode.io/practice', 150)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  source_url = EXCLUDED.source_url,
  problem_count = EXCLUDED.problem_count;

-- =============================================================================
-- BLIND 75 PROBLEMS
-- Uses INSERT ... SELECT to only add mappings for problems that exist
-- =============================================================================

INSERT INTO problem_set_problems (problem_set_id, problem_id, position, category)
SELECT 'blind-75', id, position, category
FROM (VALUES
  -- Arrays & Hashing
  (1, 1, 'Arrays & Hashing'),      -- Two Sum
  (217, 2, 'Arrays & Hashing'),    -- Contains Duplicate
  (242, 3, 'Arrays & Hashing'),    -- Valid Anagram
  (49, 4, 'Arrays & Hashing'),     -- Group Anagrams
  (347, 5, 'Arrays & Hashing'),    -- Top K Frequent Elements
  (238, 6, 'Arrays & Hashing'),    -- Product of Array Except Self
  (128, 7, 'Arrays & Hashing'),    -- Longest Consecutive Sequence
  (271, 8, 'Arrays & Hashing'),    -- Encode and Decode Strings (Premium)
  (36, 9, 'Arrays & Hashing'),     -- Valid Sudoku
  -- Two Pointers
  (125, 10, 'Two Pointers'),       -- Valid Palindrome
  (15, 11, 'Two Pointers'),        -- 3Sum
  (11, 12, 'Two Pointers'),        -- Container With Most Water
  (167, 13, 'Two Pointers'),       -- Two Sum II
  (42, 14, 'Two Pointers'),        -- Trapping Rain Water
  -- Sliding Window
  (121, 15, 'Sliding Window'),     -- Best Time to Buy and Sell Stock
  (3, 16, 'Sliding Window'),       -- Longest Substring Without Repeating Characters
  (424, 17, 'Sliding Window'),     -- Longest Repeating Character Replacement
  (76, 18, 'Sliding Window'),      -- Minimum Window Substring
  -- Stack
  (20, 19, 'Stack'),               -- Valid Parentheses
  (155, 20, 'Stack'),              -- Min Stack
  (150, 21, 'Stack'),              -- Evaluate Reverse Polish Notation
  (84, 22, 'Stack'),               -- Largest Rectangle in Histogram
  -- Binary Search
  (704, 23, 'Binary Search'),      -- Binary Search
  (33, 24, 'Binary Search'),       -- Search in Rotated Sorted Array
  (153, 25, 'Binary Search'),      -- Find Minimum in Rotated Sorted Array
  (981, 26, 'Binary Search'),      -- Time Based Key-Value Store
  (4, 27, 'Binary Search'),        -- Median of Two Sorted Arrays
  -- Linked List
  (206, 28, 'Linked List'),        -- Reverse Linked List
  (21, 29, 'Linked List'),         -- Merge Two Sorted Lists
  (143, 30, 'Linked List'),        -- Reorder List
  (19, 31, 'Linked List'),         -- Remove Nth Node From End of List
  (141, 32, 'Linked List'),        -- Linked List Cycle
  (23, 33, 'Linked List'),         -- Merge k Sorted Lists
  -- Trees
  (226, 34, 'Trees'),              -- Invert Binary Tree
  (104, 35, 'Trees'),              -- Maximum Depth of Binary Tree
  (100, 36, 'Trees'),              -- Same Tree
  (572, 37, 'Trees'),              -- Subtree of Another Tree
  (235, 38, 'Trees'),              -- Lowest Common Ancestor of a BST
  (102, 39, 'Trees'),              -- Binary Tree Level Order Traversal
  (98, 40, 'Trees'),               -- Validate Binary Search Tree
  (230, 41, 'Trees'),              -- Kth Smallest Element in a BST
  (105, 42, 'Trees'),              -- Construct Binary Tree from Preorder and Inorder
  (124, 43, 'Trees'),              -- Binary Tree Maximum Path Sum
  (297, 44, 'Trees'),              -- Serialize and Deserialize Binary Tree
  -- Tries
  (208, 45, 'Tries'),              -- Implement Trie
  (211, 46, 'Tries'),              -- Design Add and Search Words Data Structure
  (212, 47, 'Tries'),              -- Word Search II
  -- Heap
  (295, 48, 'Heap'),               -- Find Median from Data Stream
  -- Backtracking
  (39, 49, 'Backtracking'),        -- Combination Sum
  (79, 50, 'Backtracking'),        -- Word Search
  -- Graphs
  (200, 51, 'Graphs'),             -- Number of Islands
  (133, 52, 'Graphs'),             -- Clone Graph
  (417, 53, 'Graphs'),             -- Pacific Atlantic Water Flow
  (207, 54, 'Graphs'),             -- Course Schedule
  (323, 55, 'Graphs'),             -- Number of Connected Components (Premium)
  (261, 56, 'Graphs'),             -- Graph Valid Tree (Premium)
  (269, 57, 'Graphs'),             -- Alien Dictionary (Premium)
  (127, 58, 'Graphs'),             -- Word Ladder
  -- Dynamic Programming
  (70, 59, 'Dynamic Programming'),    -- Climbing Stairs
  (198, 60, 'Dynamic Programming'),   -- House Robber
  (213, 61, 'Dynamic Programming'),   -- House Robber II
  (5, 62, 'Dynamic Programming'),     -- Longest Palindromic Substring
  (647, 63, 'Dynamic Programming'),   -- Palindromic Substrings
  (91, 64, 'Dynamic Programming'),    -- Decode Ways
  (322, 65, 'Dynamic Programming'),   -- Coin Change
  (152, 66, 'Dynamic Programming'),   -- Maximum Product Subarray
  (139, 67, 'Dynamic Programming'),   -- Word Break
  (300, 68, 'Dynamic Programming'),   -- Longest Increasing Subsequence
  (1143, 69, 'Dynamic Programming'),  -- Longest Common Subsequence
  -- Intervals
  (57, 70, 'Intervals'),           -- Insert Interval
  (56, 71, 'Intervals'),           -- Merge Intervals
  (435, 72, 'Intervals'),          -- Non-overlapping Intervals
  (252, 73, 'Intervals'),          -- Meeting Rooms (Premium)
  (253, 74, 'Intervals'),          -- Meeting Rooms II (Premium)
  -- Math & Geometry
  (48, 75, 'Math & Geometry'),     -- Rotate Image
  (54, 76, 'Math & Geometry'),     -- Spiral Matrix
  (73, 77, 'Math & Geometry')      -- Set Matrix Zeroes
) AS v(id, position, category)
WHERE EXISTS (SELECT 1 FROM problems p WHERE p.id = v.id)
ON CONFLICT (problem_set_id, problem_id) DO NOTHING;

-- =============================================================================
-- GRIND 75 PROBLEMS
-- =============================================================================

INSERT INTO problem_set_problems (problem_set_id, problem_id, position, category)
SELECT 'grind-75', id, position, category
FROM (VALUES
  -- Week 1-2: Easy problems
  (1, 1, 'Week 1'),                -- Two Sum
  (20, 2, 'Week 1'),               -- Valid Parentheses
  (21, 3, 'Week 1'),               -- Merge Two Sorted Lists
  (121, 4, 'Week 1'),              -- Best Time to Buy and Sell Stock
  (125, 5, 'Week 1'),              -- Valid Palindrome
  (226, 6, 'Week 1'),              -- Invert Binary Tree
  (242, 7, 'Week 1'),              -- Valid Anagram
  (704, 8, 'Week 1'),              -- Binary Search
  (733, 9, 'Week 1'),              -- Flood Fill
  (235, 10, 'Week 1'),             -- Lowest Common Ancestor of BST
  (110, 11, 'Week 1'),             -- Balanced Binary Tree
  (141, 12, 'Week 1'),             -- Linked List Cycle
  (232, 13, 'Week 1'),             -- Implement Queue using Stacks
  (278, 14, 'Week 2'),             -- First Bad Version
  (383, 15, 'Week 2'),             -- Ransom Note
  (70, 16, 'Week 2'),              -- Climbing Stairs
  (409, 17, 'Week 2'),             -- Longest Palindrome
  (206, 18, 'Week 2'),             -- Reverse Linked List
  (169, 19, 'Week 2'),             -- Majority Element
  (67, 20, 'Week 2'),              -- Add Binary
  (543, 21, 'Week 2'),             -- Diameter of Binary Tree
  (876, 22, 'Week 2'),             -- Middle of the Linked List
  (104, 23, 'Week 2'),             -- Maximum Depth of Binary Tree
  (217, 24, 'Week 2'),             -- Contains Duplicate
  (53, 25, 'Week 2'),              -- Maximum Subarray
  -- Week 3-4: Medium problems
  (57, 26, 'Week 3'),              -- Insert Interval
  (542, 27, 'Week 3'),             -- 01 Matrix
  (973, 28, 'Week 3'),             -- K Closest Points to Origin
  (3, 29, 'Week 3'),               -- Longest Substring Without Repeating Characters
  (15, 30, 'Week 3'),              -- 3Sum
  (102, 31, 'Week 3'),             -- Binary Tree Level Order Traversal
  (133, 32, 'Week 3'),             -- Clone Graph
  (150, 33, 'Week 3'),             -- Evaluate Reverse Polish Notation
  (207, 34, 'Week 3'),             -- Course Schedule
  (208, 35, 'Week 3'),             -- Implement Trie
  (322, 36, 'Week 4'),             -- Coin Change
  (238, 37, 'Week 4'),             -- Product of Array Except Self
  (155, 38, 'Week 4'),             -- Min Stack
  (98, 39, 'Week 4'),              -- Validate Binary Search Tree
  (200, 40, 'Week 4'),             -- Number of Islands
  (994, 41, 'Week 4'),             -- Rotting Oranges
  (33, 42, 'Week 4'),              -- Search in Rotated Sorted Array
  (39, 43, 'Week 4'),              -- Combination Sum
  (46, 44, 'Week 4'),              -- Permutations
  (56, 45, 'Week 4'),              -- Merge Intervals
  (236, 46, 'Week 4'),             -- Lowest Common Ancestor of Binary Tree
  (981, 47, 'Week 4'),             -- Time Based Key-Value Store
  (721, 48, 'Week 4'),             -- Accounts Merge
  (75, 49, 'Week 4'),              -- Sort Colors
  (139, 50, 'Week 4'),             -- Word Break
  -- Week 5-6: More Medium problems
  (416, 51, 'Week 5'),             -- Partition Equal Subset Sum
  (8, 52, 'Week 5'),               -- String to Integer (atoi)
  (54, 53, 'Week 5'),              -- Spiral Matrix
  (78, 54, 'Week 5'),              -- Subsets
  (199, 55, 'Week 5'),             -- Binary Tree Right Side View
  (5, 56, 'Week 5'),               -- Longest Palindromic Substring
  (62, 57, 'Week 5'),              -- Unique Paths
  (105, 58, 'Week 5'),             -- Construct Binary Tree from Preorder and Inorder
  (11, 59, 'Week 6'),              -- Container With Most Water
  (17, 60, 'Week 6'),              -- Letter Combinations of a Phone Number
  (79, 61, 'Week 6'),              -- Word Search
  (438, 62, 'Week 6'),             -- Find All Anagrams in a String
  (310, 63, 'Week 6'),             -- Minimum Height Trees
  (621, 64, 'Week 6'),             -- Task Scheduler
  (146, 65, 'Week 6'),             -- LRU Cache
  -- Week 7-8: Hard problems
  (230, 66, 'Week 7'),             -- Kth Smallest Element in a BST
  (76, 67, 'Week 7'),              -- Minimum Window Substring
  (297, 68, 'Week 7'),             -- Serialize and Deserialize Binary Tree
  (42, 69, 'Week 7'),              -- Trapping Rain Water
  (295, 70, 'Week 8'),             -- Find Median from Data Stream
  (127, 71, 'Week 8'),             -- Word Ladder
  (224, 72, 'Week 8'),             -- Basic Calculator
  (1235, 73, 'Week 8'),            -- Maximum Profit in Job Scheduling
  (23, 74, 'Week 8'),              -- Merge k Sorted Lists
  (84, 75, 'Week 8')               -- Largest Rectangle in Histogram
) AS v(id, position, category)
WHERE EXISTS (SELECT 1 FROM problems p WHERE p.id = v.id)
ON CONFLICT (problem_set_id, problem_id) DO NOTHING;

-- =============================================================================
-- NEETCODE 150 PROBLEMS
-- =============================================================================

INSERT INTO problem_set_problems (problem_set_id, problem_id, position, category)
SELECT 'neetcode-150', id, position, category
FROM (VALUES
  -- Arrays & Hashing
  (217, 1, 'Arrays & Hashing'),    -- Contains Duplicate
  (242, 2, 'Arrays & Hashing'),    -- Valid Anagram
  (1, 3, 'Arrays & Hashing'),      -- Two Sum
  (49, 4, 'Arrays & Hashing'),     -- Group Anagrams
  (347, 5, 'Arrays & Hashing'),    -- Top K Frequent Elements
  (238, 6, 'Arrays & Hashing'),    -- Product of Array Except Self
  (36, 7, 'Arrays & Hashing'),     -- Valid Sudoku
  (271, 8, 'Arrays & Hashing'),    -- Encode and Decode Strings (Premium)
  (128, 9, 'Arrays & Hashing'),    -- Longest Consecutive Sequence
  -- Two Pointers
  (125, 10, 'Two Pointers'),       -- Valid Palindrome
  (167, 11, 'Two Pointers'),       -- Two Sum II
  (15, 12, 'Two Pointers'),        -- 3Sum
  (11, 13, 'Two Pointers'),        -- Container With Most Water
  (42, 14, 'Two Pointers'),        -- Trapping Rain Water
  -- Sliding Window
  (121, 15, 'Sliding Window'),     -- Best Time to Buy and Sell Stock
  (3, 16, 'Sliding Window'),       -- Longest Substring Without Repeating Characters
  (424, 17, 'Sliding Window'),     -- Longest Repeating Character Replacement
  (567, 18, 'Sliding Window'),     -- Permutation in String
  (76, 19, 'Sliding Window'),      -- Minimum Window Substring
  (239, 20, 'Sliding Window'),     -- Sliding Window Maximum
  -- Stack
  (20, 21, 'Stack'),               -- Valid Parentheses
  (155, 22, 'Stack'),              -- Min Stack
  (150, 23, 'Stack'),              -- Evaluate Reverse Polish Notation
  (22, 24, 'Stack'),               -- Generate Parentheses
  (739, 25, 'Stack'),              -- Daily Temperatures
  (853, 26, 'Stack'),              -- Car Fleet
  (84, 27, 'Stack'),               -- Largest Rectangle in Histogram
  -- Binary Search
  (704, 28, 'Binary Search'),      -- Binary Search
  (74, 29, 'Binary Search'),       -- Search a 2D Matrix
  (875, 30, 'Binary Search'),      -- Koko Eating Bananas
  (33, 31, 'Binary Search'),       -- Search in Rotated Sorted Array
  (153, 32, 'Binary Search'),      -- Find Minimum in Rotated Sorted Array
  (981, 33, 'Binary Search'),      -- Time Based Key-Value Store
  (4, 34, 'Binary Search'),        -- Median of Two Sorted Arrays
  -- Linked List
  (206, 35, 'Linked List'),        -- Reverse Linked List
  (21, 36, 'Linked List'),         -- Merge Two Sorted Lists
  (143, 37, 'Linked List'),        -- Reorder List
  (19, 38, 'Linked List'),         -- Remove Nth Node From End of List
  (138, 39, 'Linked List'),        -- Copy List with Random Pointer
  (2, 40, 'Linked List'),          -- Add Two Numbers
  (141, 41, 'Linked List'),        -- Linked List Cycle
  (287, 42, 'Linked List'),        -- Find the Duplicate Number
  (146, 43, 'Linked List'),        -- LRU Cache
  (23, 44, 'Linked List'),         -- Merge k Sorted Lists
  (25, 45, 'Linked List'),         -- Reverse Nodes in k-Group
  -- Trees
  (226, 46, 'Trees'),              -- Invert Binary Tree
  (104, 47, 'Trees'),              -- Maximum Depth of Binary Tree
  (543, 48, 'Trees'),              -- Diameter of Binary Tree
  (110, 49, 'Trees'),              -- Balanced Binary Tree
  (100, 50, 'Trees'),              -- Same Tree
  (572, 51, 'Trees'),              -- Subtree of Another Tree
  (235, 52, 'Trees'),              -- Lowest Common Ancestor of a BST
  (102, 53, 'Trees'),              -- Binary Tree Level Order Traversal
  (199, 54, 'Trees'),              -- Binary Tree Right Side View
  (1448, 55, 'Trees'),             -- Count Good Nodes in Binary Tree
  (98, 56, 'Trees'),               -- Validate Binary Search Tree
  (230, 57, 'Trees'),              -- Kth Smallest Element in a BST
  (105, 58, 'Trees'),              -- Construct Binary Tree from Preorder and Inorder
  (124, 59, 'Trees'),              -- Binary Tree Maximum Path Sum
  (297, 60, 'Trees'),              -- Serialize and Deserialize Binary Tree
  -- Heap / Priority Queue
  (703, 61, 'Heap'),               -- Kth Largest Element in a Stream
  (1046, 62, 'Heap'),              -- Last Stone Weight
  (973, 63, 'Heap'),               -- K Closest Points to Origin
  (215, 64, 'Heap'),               -- Kth Largest Element in an Array
  (621, 65, 'Heap'),               -- Task Scheduler
  (355, 66, 'Heap'),               -- Design Twitter
  (295, 67, 'Heap'),               -- Find Median from Data Stream
  -- Backtracking
  (78, 68, 'Backtracking'),        -- Subsets
  (39, 69, 'Backtracking'),        -- Combination Sum
  (46, 70, 'Backtracking'),        -- Permutations
  (90, 71, 'Backtracking'),        -- Subsets II
  (40, 72, 'Backtracking'),        -- Combination Sum II
  (79, 73, 'Backtracking'),        -- Word Search
  (131, 74, 'Backtracking'),       -- Palindrome Partitioning
  (17, 75, 'Backtracking'),        -- Letter Combinations of a Phone Number
  (51, 76, 'Backtracking'),        -- N-Queens
  -- Tries
  (208, 77, 'Tries'),              -- Implement Trie
  (211, 78, 'Tries'),              -- Design Add and Search Words Data Structure
  (212, 79, 'Tries'),              -- Word Search II
  -- Graphs
  (200, 80, 'Graphs'),             -- Number of Islands
  (133, 81, 'Graphs'),             -- Clone Graph
  (695, 82, 'Graphs'),             -- Max Area of Island
  (417, 83, 'Graphs'),             -- Pacific Atlantic Water Flow
  (130, 84, 'Graphs'),             -- Surrounded Regions
  (994, 85, 'Graphs'),             -- Rotting Oranges
  (286, 86, 'Graphs'),             -- Walls and Gates (Premium)
  (207, 87, 'Graphs'),             -- Course Schedule
  (210, 88, 'Graphs'),             -- Course Schedule II
  (684, 89, 'Graphs'),             -- Redundant Connection
  (323, 90, 'Graphs'),             -- Number of Connected Components (Premium)
  (261, 91, 'Graphs'),             -- Graph Valid Tree (Premium)
  (127, 92, 'Graphs'),             -- Word Ladder
  -- Advanced Graphs
  (332, 93, 'Advanced Graphs'),    -- Reconstruct Itinerary
  (1584, 94, 'Advanced Graphs'),   -- Min Cost to Connect All Points
  (743, 95, 'Advanced Graphs'),    -- Network Delay Time
  (778, 96, 'Advanced Graphs'),    -- Swim in Rising Water
  (269, 97, 'Advanced Graphs'),    -- Alien Dictionary (Premium)
  (787, 98, 'Advanced Graphs'),    -- Cheapest Flights Within K Stops
  -- 1-D Dynamic Programming
  (70, 99, '1-D DP'),              -- Climbing Stairs
  (746, 100, '1-D DP'),            -- Min Cost Climbing Stairs
  (198, 101, '1-D DP'),            -- House Robber
  (213, 102, '1-D DP'),            -- House Robber II
  (5, 103, '1-D DP'),              -- Longest Palindromic Substring
  (647, 104, '1-D DP'),            -- Palindromic Substrings
  (91, 105, '1-D DP'),             -- Decode Ways
  (322, 106, '1-D DP'),            -- Coin Change
  (152, 107, '1-D DP'),            -- Maximum Product Subarray
  (139, 108, '1-D DP'),            -- Word Break
  (300, 109, '1-D DP'),            -- Longest Increasing Subsequence
  (416, 110, '1-D DP'),            -- Partition Equal Subset Sum
  -- 2-D Dynamic Programming
  (62, 111, '2-D DP'),             -- Unique Paths
  (1143, 112, '2-D DP'),           -- Longest Common Subsequence
  (309, 113, '2-D DP'),            -- Best Time to Buy and Sell Stock with Cooldown
  (518, 114, '2-D DP'),            -- Coin Change II
  (494, 115, '2-D DP'),            -- Target Sum
  (97, 116, '2-D DP'),             -- Interleaving String
  (329, 117, '2-D DP'),            -- Longest Increasing Path in a Matrix
  (115, 118, '2-D DP'),            -- Distinct Subsequences
  (72, 119, '2-D DP'),             -- Edit Distance
  (312, 120, '2-D DP'),            -- Burst Balloons
  (10, 121, '2-D DP'),             -- Regular Expression Matching
  -- Greedy
  (53, 122, 'Greedy'),             -- Maximum Subarray
  (55, 123, 'Greedy'),             -- Jump Game
  (45, 124, 'Greedy'),             -- Jump Game II
  (134, 125, 'Greedy'),            -- Gas Station
  (846, 126, 'Greedy'),            -- Hand of Straights
  (1899, 127, 'Greedy'),           -- Merge Triplets to Form Target Triplet
  (763, 128, 'Greedy'),            -- Partition Labels
  (678, 129, 'Greedy'),            -- Valid Parenthesis String
  -- Intervals
  (57, 130, 'Intervals'),          -- Insert Interval
  (56, 131, 'Intervals'),          -- Merge Intervals
  (435, 132, 'Intervals'),         -- Non-overlapping Intervals
  (252, 133, 'Intervals'),         -- Meeting Rooms (Premium)
  (253, 134, 'Intervals'),         -- Meeting Rooms II (Premium)
  (1851, 135, 'Intervals'),        -- Minimum Interval to Include Each Query
  -- Math & Geometry
  (48, 136, 'Math & Geometry'),    -- Rotate Image
  (54, 137, 'Math & Geometry'),    -- Spiral Matrix
  (73, 138, 'Math & Geometry'),    -- Set Matrix Zeroes
  (202, 139, 'Math & Geometry'),   -- Happy Number
  (66, 140, 'Math & Geometry'),    -- Plus One
  (50, 141, 'Math & Geometry'),    -- Pow(x, n)
  (43, 142, 'Math & Geometry'),    -- Multiply Strings
  (2013, 143, 'Math & Geometry'),  -- Detect Squares
  -- Bit Manipulation
  (136, 144, 'Bit Manipulation'),  -- Single Number
  (191, 145, 'Bit Manipulation'),  -- Number of 1 Bits
  (338, 146, 'Bit Manipulation'),  -- Counting Bits
  (190, 147, 'Bit Manipulation'),  -- Reverse Bits
  (268, 148, 'Bit Manipulation'),  -- Missing Number
  (371, 149, 'Bit Manipulation'),  -- Sum of Two Integers
  (7, 150, 'Bit Manipulation')     -- Reverse Integer
) AS v(id, position, category)
WHERE EXISTS (SELECT 1 FROM problems p WHERE p.id = v.id)
ON CONFLICT (problem_set_id, problem_id) DO NOTHING;

-- =============================================================================
-- Update problem counts based on actual mappings
-- =============================================================================

UPDATE problem_sets SET problem_count = (
  SELECT COUNT(*) FROM problem_set_problems WHERE problem_set_id = problem_sets.id
);
