// export const truncateAtFirstPeriod = (text: string): string => {
//     if (!text) return text;
//     if (text.length < 30) return text;
//     const periodIndex = text.indexOf('.');
//     const newText = periodIndex !== -1 ? text.substring(0, periodIndex + 1) : text;
//     if (newText.length < 30) return text;
//     else return newText
//   };



export const truncateAtFirstPeriod = (
  text: string,
  minChars = 50,
  maxChars = 100
): string => {
  if (!text) return text;

  // If text is already short
  if (text.length <= minChars) {
    return text;
  }

  // Limit search range to maxChars
  const limitedText = text.slice(0, maxChars);

  // Find first period AFTER minChars (but before maxChars)
  const periodIndex = limitedText.indexOf('.', minChars);

  // If a valid period is found in range, cut there
  if (periodIndex !== -1) {
    return limitedText.slice(0, periodIndex + 1);
  }

  // Otherwise hard cut at maxChars
  if (text.length > maxChars) {
    return limitedText + '...';
  }

  return text;
};

