/**
 * Generates a consistent color pair for a nonprofit based on its ID or name
 * This ensures the same nonprofit always gets the same color
 */

// Predefined color pairs: [backgroundColor, textColor]
const COLOR_PAIRS = [
  ['#dbeafe', '#1e40af'], // blue
  ['#fef3c7', '#92400e'], // amber
  ['#d1fae5', '#065f46'], // green
  ['#fce7f3', '#831843'], // pink
  ['#e9d5ff', '#6b21a8'], // purple
  ['#fed7aa', '#9a3412'], // orange
  ['#dbeafe', '#1e3a8a'], // blue-2
  ['#fef3c7', '#78350f'], // amber-2
  ['#d1fae5', '#047857'], // green-2
  ['#fce7f3', '#9f1239'], // pink-2
  ['#e9d5ff', '#7c3aed'], // purple-2
  ['#fed7aa', '#c2410c'], // orange-2
  ['#f0f9ff', '#0c4a6e'], // sky
  ['#fef2f2', '#991b1b'], // red
  ['#f0fdf4', '#166534'], // emerald
];

/**
 * Simple hash function to convert string to number
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get color pair for a nonprofit
 * @param id - Nonprofit ID (preferred) or name
 * @returns Object with bgColor and textColor
 */
export function getNonprofitColor(id: string | number): { bgColor: string; textColor: string } {
  const idString = String(id);
  const hash = hashString(idString);
  const colorIndex = hash % COLOR_PAIRS.length;
  const [bgColor, textColor] = COLOR_PAIRS[colorIndex];
  
  return { bgColor, textColor };
}

