// Comprehensive Bingo Pattern System supporting all 50+ patterns

export interface BingoPattern {
  code: string;
  name: string;
  altNames: string[];
  category: 'line' | 'letter' | 'shape' | 'special' | 'holiday' | 'block' | 'crazy';
  requiredCells: number[]; // 0-24 for 5x5 grid (12 = FREE space)
  difficulty: 1 | 2 | 3 | 4 | 5;
  canRotate?: boolean; // For "crazy" patterns
  canMirror?: boolean; // For patterns that can be mirrored left-right
  description: string;
  isActive?: boolean; // Whether the pattern is available for use
  animationDelay?: number; // Delay in milliseconds between rotations (for crazy patterns)
  excludedRanges?: string[]; // Array of BINGO letters to exclude: ["B", "I", "N", "G", "O"]
}

export const PATTERNS: Record<string, BingoPattern> = {
  // Traditional Line Patterns (1-9)
  single_line: {
    code: 'single_line',
    name: 'Single Line',
    altNames: ['Straight Line', 'Line Bingo'],
    category: 'line',
    requiredCells: [10, 11, 12, 13, 14], // Any line - this is middle row example
    difficulty: 1,
    description: 'Complete any single line horizontally, vertically, or diagonally'
  },
  
  two_lines: {
    code: 'two_lines',
    name: 'Two Lines',
    altNames: ['Double Line', 'Double Bingo'],
    category: 'line',
    requiredCells: [5,6,7,8,9, 15,16,17,18,19], // Any two lines
    difficulty: 2,
    description: 'Complete any two separate lines'
  },
  
  diagonal: {
    code: 'diagonal',
    name: 'Diagonal',
    altNames: ['Diagonal Line'],
    category: 'line',
    requiredCells: [0, 6, 12, 18, 24], // Top-left to bottom-right
    difficulty: 1,
    description: 'Complete either diagonal line'
  },
  
  four_corners: {
    code: 'four_corners',
    name: 'Four Corners',
    altNames: ['Corners'],
    category: 'shape',
    requiredCells: [0, 4, 20, 24],
    difficulty: 1,
    description: 'Mark all four corner squares'
  },
  
  full_house: {
    code: 'full_house',
    name: 'Full House',
    altNames: ['Blackout', 'Cover All', 'Full Card'],
    category: 'special',
    requiredCells: Array.from({ length: 25 }, (_, i) => i),
    difficulty: 5,
    description: 'Mark every square on the card'
  },
  
  // Letter Patterns (10-17)
  letter_x: {
    code: 'letter_x',
    name: 'Letter X',
    altNames: ['X Pattern'],
    category: 'letter',
    requiredCells: [0, 4, 6, 8, 12, 16, 18, 20, 24],
    difficulty: 3,
    description: 'Form the letter X by marking both diagonals'
  },
  
  letter_t: {
    code: 'letter_t',
    name: 'Letter T',
    altNames: ['T Pattern'],
    category: 'letter',
    requiredCells: [0, 1, 2, 3, 4, 7, 12, 17, 22],
    difficulty: 3,
    canRotate: true,
    animationDelay: 1800,
    description: 'Form the letter T with top row and middle column'
  },
  
  letter_l: {
    code: 'letter_l',
    name: 'Letter L',
    altNames: ['L Pattern'],
    category: 'letter',
    requiredCells: [0, 5, 10, 15, 20, 21, 22, 23, 24],
    difficulty: 3,
    canRotate: true,
    animationDelay: 1800,
    description: 'Form the letter L with left column and bottom row'
  },
  
  letter_u: {
    code: 'letter_u',
    name: 'Letter U',
    altNames: ['U Pattern'],
    category: 'letter',
    requiredCells: [0, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24],
    difficulty: 4,
    description: 'Form the letter U with left and right columns plus bottom row'
  },
  
  letter_z: {
    code: 'letter_z',
    name: 'Letter Z',
    altNames: ['Z Pattern'],
    category: 'letter',
    requiredCells: [0, 1, 2, 3, 4, 8, 12, 16, 20, 21, 22, 23, 24],
    difficulty: 4,
    canRotate: true,
    animationDelay: 1800,
    description: 'Form the letter Z with top row, diagonal, and bottom row'
  },
  
  letter_h: {
    code: 'letter_h',
    name: 'Letter H',
    altNames: ['H Pattern'],
    category: 'letter',
    requiredCells: [0, 4, 5, 9, 10, 11, 13, 14, 15, 19, 20, 24],
    difficulty: 4,
    description: 'Form the letter H with left column, right column, and middle row (no N column)'
  },
  
  letter_n: {
    code: 'letter_n',
    name: 'Letter N',
    altNames: ['N Pattern'],
    category: 'letter',
    requiredCells: [0, 4, 5, 6, 9, 10, 12, 14, 15, 18, 19, 20, 24],
    difficulty: 4,
    description: 'Form the letter N with left column, right column, and diagonal'
  },
  
  letter_c: {
    code: 'letter_c',
    name: 'Letter C',
    altNames: ['C Pattern'],
    category: 'letter',
    requiredCells: [0, 1, 2, 3, 4, 5, 10, 15, 20, 21, 22, 23, 24],
    difficulty: 4,
    canRotate: true,
    animationDelay: 1800,
    description: 'Form the letter C with top row, left column, and bottom row'
  },
  
  // Shape Patterns (18-35)
  small_diamond: {
    code: 'small_diamond',
    name: 'Small Diamond',
    altNames: ['Diamond', 'Small Plus'],
    category: 'shape',
    requiredCells: [7, 11, 12, 13, 17],
    difficulty: 2,
    description: 'Form a small diamond shape around the center'
  },
  
  large_diamond: {
    code: 'large_diamond',
    name: 'Large Diamond',
    altNames: ['Big Diamond'],
    category: 'shape',
    requiredCells: [2, 6, 8, 10, 11, 12, 13, 14, 16, 18, 22],
    difficulty: 3,
    description: 'Form a large diamond shape covering most of the card'
  },
  
  small_cross: {
    code: 'small_cross',
    name: 'Small Cross',
    altNames: ['Plus Sign', 'Small Plus'],
    category: 'shape',
    requiredCells: [2, 7, 11, 12, 13, 17, 22],
    difficulty: 2,
    description: 'Form a small cross through the center'
  },
  
  large_cross: {
    code: 'large_cross',
    name: 'Large Plus',
    altNames: ['Big Cross', 'Large Cross'],
    category: 'shape',
    requiredCells: [2, 7, 10, 11, 12, 13, 14, 17, 22],
    difficulty: 3,
    description: 'Form a large plus covering middle row and column'
  },
  
  kite: {
    code: 'kite',
    name: 'Kite',
    altNames: ['Kite Pattern'],
    category: 'shape',
    requiredCells: [2, 7, 11, 12, 13, 16, 18],
    difficulty: 3,
    canRotate: true,
    animationDelay: 1600,
    description: 'Form a kite shape pointing upward'
  },
  
  hourglass: {
    code: 'hourglass',
    name: 'Hourglass',
    altNames: ['Bow Tie'],
    category: 'shape',
    requiredCells: [0, 1, 2, 3, 4, 6, 8, 12, 16, 18, 20, 21, 22, 23, 24],
    difficulty: 4,
    description: 'Form an hourglass with top row, bottom row, and both diagonals'
  },
  
  butterfly: {
    code: 'butterfly',
    name: 'Butterfly',
    altNames: ['Wings'],
    category: 'shape',
    requiredCells: [0, 2, 4, 5, 9, 12, 15, 19, 20, 22, 24],
    difficulty: 4,
    description: 'Form a butterfly with wings on both sides'
  },
  
  top_hat: {
    code: 'top_hat',
    name: 'Top Hat',
    altNames: ['Hat Pattern'],
    category: 'shape',
    requiredCells: [0, 1, 2, 3, 4, 6, 8, 11, 13, 16, 18],
    difficulty: 3,
    canRotate: true,
    animationDelay: 1700,
    description: 'Form a top hat shape'
  },
  
  champagne_glass: {
    code: 'champagne_glass',
    name: 'Champagne Glass',
    altNames: ['Wine Glass', 'Martini Glass'],
    category: 'shape',
    requiredCells: [0, 1, 2, 3, 4, 6, 7, 8, 17, 21, 22, 23],
    difficulty: 4,
    description: 'Form a champagne glass shape with full top, narrow bowl, and long stem'
  },
  
  arrow_up: {
    code: 'arrow_up',
    name: 'Arrow Up',
    altNames: ['Up Arrow'],
    category: 'shape',
    requiredCells: [2, 7, 11, 12, 13, 17, 22],
    difficulty: 3,
    canRotate: true,
    animationDelay: 1500,
    description: 'Form an arrow pointing upward'
  },

  arrow_down: {
    code: 'arrow_down',
    name: 'Arrow Down',
    altNames: ['Down Arrow'],
    category: 'shape',
    requiredCells: [2, 7, 11, 12, 13, 17, 22],
    difficulty: 3,
    canRotate: true,
    animationDelay: 1500,
    description: 'Form an arrow pointing downward'
  },
  
  // Block Patterns (36-45)
  small_block: {
    code: 'small_block',
    name: 'Small Block',
    altNames: ['2x2 Block', 'Small Square'],
    category: 'block',
    requiredCells: [6, 7, 11, 12],
    difficulty: 2,
    canRotate: true,
    animationDelay: 1400,
    description: 'Form a small 2x2 block anywhere on the card'
  },
  
  medium_block: {
    code: 'medium_block',
    name: 'Medium Block',
    altNames: ['3x3 Block'],
    category: 'block',
    requiredCells: [6, 7, 8, 11, 12, 13, 16, 17, 18],
    difficulty: 3,
    canRotate: true,
    animationDelay: 1400,
    description: 'Form a medium 3x3 block in the center'
  },
  
  large_block: {
    code: 'large_block',
    name: 'Large Block',
    altNames: ['4x4 Block'],
    category: 'block',
    requiredCells: [5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18, 20, 21, 22, 23],
    difficulty: 4,
    description: 'Form a large 4x4 block'
  },
  
  checkerboard: {
    code: 'checkerboard',
    name: 'Checkerboard',
    altNames: ['Chess Board'],
    category: 'block',
    requiredCells: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24],
    difficulty: 4,
    description: 'Form a checkerboard pattern'
  },
  
  // Holiday/Seasonal Patterns (46-50)
  christmas_tree: {
    code: 'christmas_tree',
    name: 'Christmas Tree',
    altNames: ['Tree', 'Xmas Tree'],
    category: 'holiday',
    requiredCells: [2, 6, 7, 8, 10, 11, 12, 13, 14, 17, 22],
    difficulty: 4,
    description: 'Form a Christmas tree shape'
  },
  
  pumpkin: {
    code: 'pumpkin',
    name: 'Pumpkin',
    altNames: ['Jack-o-lantern', 'Halloween'],
    category: 'holiday',
    requiredCells: [1, 2, 3, 5, 7, 9, 10, 11, 12, 13, 14, 15, 19, 21, 22, 23],
    difficulty: 4,
    description: 'Form a jack-o\'-lantern outline with face holes for Halloween'
  },
  
  heart: {
    code: 'heart',
    name: 'Heart',
    altNames: ['Valentine Heart'],
    category: 'holiday',
    requiredCells: [1, 3, 5, 6, 7, 8, 9, 11, 12, 13, 17, 22],
    difficulty: 4,
    description: 'Form a heart shape for Valentine\'s Day'
  },
  
  easter_egg: {
    code: 'easter_egg',
    name: 'Easter Egg',
    altNames: ['Egg'],
    category: 'holiday',
    requiredCells: [2, 6, 7, 8, 10, 11, 12, 13, 14, 16, 17, 18, 22],
    difficulty: 3,
    description: 'Form an Easter egg shape'
  },
  
  // Special/Crazy Patterns (51-60)
  lucky_seven: {
    code: 'lucky_seven',
    name: 'Lucky Seven',
    altNames: ['Number 7', 'Seven'],
    category: 'crazy',
    requiredCells: [0, 1, 2, 3, 4, 8, 12, 16, 20],
    difficulty: 3,
    canRotate: true,
    animationDelay: 2000,
    description: 'Form the number 7 pattern'
  },
  
  crazy_l: {
    code: 'crazy_l',
    name: 'Crazy L',
    altNames: ['Any L'],
    category: 'crazy',
    requiredCells: [0, 5, 10, 15, 20, 21, 22, 23, 24],
    difficulty: 3,
    canRotate: true,
    animationDelay: 2000,
    description: 'Form an L in any orientation'
  },
  
  six_pack: {
    code: 'six_pack',
    name: 'Six Pack',
    altNames: ['6-Pack'],
    category: 'special',
    requiredCells: [0, 1, 3, 4, 20, 21, 23, 24], // Any 6 squares
    difficulty: 2,
    description: 'Mark any 6 squares on the card'
  },
  
  nine_pack: {
    code: 'nine_pack',
    name: 'Nine Pack',
    altNames: ['9-Pack'],
    category: 'special',
    requiredCells: [6, 7, 8, 11, 12, 13, 16, 17, 18], // Center 3x3
    difficulty: 3,
    description: 'Mark the center 3x3 grid'
  },
  
  railroad_tracks: {
    code: 'railroad_tracks',
    name: 'Railroad Tracks',
    altNames: ['Train Tracks', 'Parallel Lines'],
    category: 'special',
    requiredCells: [1, 3, 6, 8, 11, 13, 16, 18, 21, 23],
    difficulty: 3,
    description: 'Form parallel lines like railroad tracks'
  },
  
  airplane: {
    code: 'airplane',
    name: 'Airplane',
    altNames: ['Plane'],
    category: 'shape',
    requiredCells: [2, 6, 7, 8, 10, 11, 12, 13, 14, 17, 22],
    difficulty: 4,
    description: 'Form an airplane shape'
  },
  
  inside_square: {
    code: 'inside_square',
    name: 'Inside Square',
    altNames: ['Inner Square', 'Picture Frame'],
    category: 'shape',
    requiredCells: [6, 7, 8, 11, 13, 16, 17, 18],
    difficulty: 3,
    description: 'Form a square inside the card (excluding center)'
  },
  
  outside_square: {
    code: 'outside_square',
    name: 'Outside Square',
    altNames: ['Outer Square', 'Border'],
    category: 'shape',
    requiredCells: [0, 1, 2, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24],
    difficulty: 4,
    description: 'Mark all squares around the outside edge'
  },
  
  postage_stamp: {
    code: 'postage_stamp',
    name: 'Postage Stamp',
    altNames: ['Stamp', 'Corner Block'],
    category: 'block',
    requiredCells: [0, 1, 5, 6], // Any 2x2 corner
    difficulty: 2,
    description: 'Mark a 2x2 block in any corner'
  },
  
  hardway_bingo: {
    code: 'hardway_bingo',
    name: 'Hardway Bingo',
    altNames: ['No Free Space'],
    category: 'special',
    requiredCells: [10, 11, 13, 14], // Any line without using center
    difficulty: 2,
    description: 'Complete any line without using the FREE space'
  },

  coverall: {
    code: 'coverall',
    name: 'Coverall',
    altNames: ['Cover All Except Free', 'Almost Blackout'],
    category: 'special',
    requiredCells: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], // All squares except center (12)
    difficulty: 5,
    description: 'Mark all spaces on the bingo card except for the free space'
  },

  double_bingo: {
    code: 'double_bingo',
    name: 'Double Bingo',
    altNames: ['Two Lines No Free', 'Double Line Hard Way'],
    category: 'line',
    requiredCells: [0, 1, 2, 3, 4, 15, 16, 17, 18, 19], // Two lines that don't use center
    difficulty: 3,
    description: 'Complete two lines (vertical or horizontal, or one of each) without using the free space'
  }
};

// Utility functions for pattern validation and manipulation
export function validatePattern(markedCells: number[], pattern: BingoPattern): boolean {
  const required = new Set(pattern.requiredCells);
  const marked = new Set(markedCells);
  
  if (pattern.canRotate) {
    // Check all 4 rotations for crazy patterns
    for (let rotation = 0; rotation < 4; rotation++) {
      const rotated = rotatePattern(pattern.requiredCells, rotation);
      if (rotated.every(cell => marked.has(cell))) {
        return true;
      }
    }
    return false;
  }
  
  return pattern.requiredCells.every(cell => marked.has(cell));
}

export function rotatePattern(cells: number[], rotations: number): number[] {
  let rotated = [...cells];
  for (let r = 0; r < rotations; r++) {
    rotated = rotated.map(cell => {
      const row = Math.floor(cell / 5);
      const col = cell % 5;
      const newRow = col;
      const newCol = 4 - row;
      return newRow * 5 + newCol;
    });
  }
  return rotated;
}

export function mirrorPattern(cells: number[]): number[] {
  return cells.map(cell => {
    const row = Math.floor(cell / 5);
    const col = cell % 5;
    // Mirror left-right: B(0)↔O(4), I(1)↔G(3), N(2) stays same
    const newCol = 4 - col;
    return row * 5 + newCol;
  });
}

export function getPatternsByCategory(category: string): BingoPattern[] {
  return Object.values(PATTERNS).filter(pattern => pattern.category === category);
}

export function getPatternsByDifficulty(difficulty: number): BingoPattern[] {
  return Object.values(PATTERNS).filter(pattern => pattern.difficulty === difficulty);
}

export function getAllPatterns(): BingoPattern[] {
  return Object.values(PATTERNS);
}

export function getActivePatterns(): BingoPattern[] {
  return Object.values(PATTERNS).filter(pattern => pattern.isActive !== false);
}

export function getInactivePatterns(): BingoPattern[] {
  return Object.values(PATTERNS).filter(pattern => pattern.isActive === false);
}

export function getPatternByCode(code: string): BingoPattern | undefined {
  return PATTERNS[code];
}

export function searchPatterns(query: string): BingoPattern[] {
  const lowercaseQuery = query.toLowerCase();
  return Object.values(PATTERNS).filter(pattern => 
    pattern.name.toLowerCase().includes(lowercaseQuery) ||
    pattern.altNames.some(altName => altName.toLowerCase().includes(lowercaseQuery)) ||
    pattern.description.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Analyze which BINGO columns are used by a pattern
 * Returns array of column indices (0=B, 1=I, 2=N, 3=G, 4=O)
 */
export function getUsedColumns(pattern: BingoPattern): number[] {
  const usedColumns = new Set<number>()
  
  pattern.requiredCells.forEach(cellIndex => {
    const column = cellIndex % 5
    usedColumns.add(column)
  })
  
  return Array.from(usedColumns).sort()
}

/**
 * Get the valid number ranges for a pattern based on which columns are used
 * Returns array of number ranges: [{min: 1, max: 15}, {min: 16, max: 30}, etc.]
 */
export function getValidNumberRanges(pattern: BingoPattern): Array<{min: number, max: number, letter: string}> {
  const usedColumns = getUsedColumns(pattern)
  const columnRanges = [
    {min: 1, max: 15, letter: 'B'},   // Column 0
    {min: 16, max: 30, letter: 'I'},  // Column 1
    {min: 31, max: 45, letter: 'N'},  // Column 2
    {min: 46, max: 60, letter: 'G'},  // Column 3
    {min: 61, max: 75, letter: 'O'}   // Column 4
  ]
  
  return usedColumns.map(columnIndex => columnRanges[columnIndex])
}

/**
 * Check if a number should be included for a specific pattern
 * Returns true if the number's column is used by the pattern and not excluded
 */
export function isNumberValidForPattern(number: number, pattern: BingoPattern): boolean {
  const column = getColumnForNumber(number)

  // First check if the number is in an excluded range
  if (pattern.excludedRanges && pattern.excludedRanges.length > 0) {
    const letters = ['B', 'I', 'N', 'G', 'O']
    const letter = letters[column]
    if (pattern.excludedRanges.includes(letter)) {
      return false
    }
  }

  // Then check if the number's column is used by the pattern
  const usedColumns = getUsedColumns(pattern)
  return usedColumns.includes(column)
}

/**
 * Get the column index (0-4) for a bingo number (1-75)
 */
export function getColumnForNumber(number: number): number {
  if (number >= 1 && number <= 15) return 0  // B
  if (number >= 16 && number <= 30) return 1 // I
  if (number >= 31 && number <= 45) return 2 // N
  if (number >= 46 && number <= 60) return 3 // G
  if (number >= 61 && number <= 75) return 4 // O
  throw new Error(`Invalid bingo number: ${number}`)
}

// Pattern validation for line patterns (special handling)
export function validateLinePattern(markedCells: number[], patternCode: string): boolean {
  const marked = new Set(markedCells);
  
  if (patternCode === 'single_line') {
    // Check all possible lines
    const lines = [
      // Horizontal lines
      [0, 1, 2, 3, 4],
      [5, 6, 7, 8, 9],
      [10, 11, 12, 13, 14],
      [15, 16, 17, 18, 19],
      [20, 21, 22, 23, 24],
      // Vertical lines
      [0, 5, 10, 15, 20],
      [1, 6, 11, 16, 21],
      [2, 7, 12, 17, 22],
      [3, 8, 13, 18, 23],
      [4, 9, 14, 19, 24],
      // Diagonal lines
      [0, 6, 12, 18, 24],
      [4, 8, 12, 16, 20]
    ];
    
    return lines.some(line => line.every(cell => marked.has(cell)));
  }
  
  if (patternCode === 'diagonal') {
    const diagonals = [
      [0, 6, 12, 18, 24],
      [4, 8, 12, 16, 20]
    ];
    
    return diagonals.some(diagonal => diagonal.every(cell => marked.has(cell)));
  }

  if (patternCode === 'double_bingo') {
    // Lines that don't use the free space (center cell 12)
    const linesWithoutFree = [
      // Horizontal lines (excluding middle row)
      [0, 1, 2, 3, 4],
      [5, 6, 7, 8, 9],
      [15, 16, 17, 18, 19],
      [20, 21, 22, 23, 24],
      // Vertical lines (excluding middle column)
      [0, 5, 10, 15, 20],
      [1, 6, 11, 16, 21],
      [3, 8, 13, 18, 23],
      [4, 9, 14, 19, 24]
      // Note: Diagonal lines are excluded since they would use the free space
    ];
    
    // Count how many complete lines we have
    let completeLines = 0;
    for (const line of linesWithoutFree) {
      if (line.every(cell => marked.has(cell))) {
        completeLines++;
        if (completeLines >= 2) return true;
      }
    }
    
    return false;
  }
  
  // Use regular pattern validation for other patterns
  const pattern = PATTERNS[patternCode];
  return pattern ? validatePattern(markedCells, pattern) : false;
}

// Get all available pattern categories
export const PATTERN_CATEGORIES = ['line', 'letter', 'shape', 'special', 'holiday', 'block', 'crazy'] as const;

// Get difficulty levels
export const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5] as const;

/**
 * Get the BINGO letter for a number (1-75)
 */
export function getBingoLetter(num: number): string {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  if (num >= 61 && num <= 75) return 'O';
  throw new Error(`Invalid bingo number: ${num}`);
}

/**
 * Get the number range for a BINGO letter
 */
export function getNumberRangeForLetter(letter: string): [number, number] {
  switch (letter.toUpperCase()) {
    case 'B': return [1, 15];
    case 'I': return [16, 30];
    case 'N': return [31, 45];
    case 'G': return [46, 60];
    case 'O': return [61, 75];
    default: throw new Error(`Invalid BINGO letter: ${letter}`);
  }
}

/**
 * Get the used column letters for a pattern
 * Returns array of BINGO letters that are used by the pattern
 */
export function getUsedColumnLetters(pattern: BingoPattern): string[] {
  const usedColumns = new Set<string>();
  const letters = ['B', 'I', 'N', 'G', 'O'];

  pattern.requiredCells.forEach(cellIndex => {
    const column = cellIndex % 5;
    usedColumns.add(letters[column]);
  });

  return Array.from(usedColumns).sort();
}

/**
 * Suggest which columns can be excluded for a pattern
 * Returns columns NOT used by the pattern
 */
export function suggestExcludedRanges(pattern: BingoPattern): string[] {
  const usedColumns = getUsedColumnLetters(pattern);
  const allColumns = ['B', 'I', 'N', 'G', 'O'];
  return allColumns.filter(col => !usedColumns.includes(col));
}