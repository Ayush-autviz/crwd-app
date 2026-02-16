/**
 * Normalizes search text by converting curly apostrophes and quotes to straight ones,
 * trimming whitespace, and converting to lowercase.
 */
export const normalizeSearchText = (text: string): string => {
    if (!text) return '';
    return text
        .replace(/[’‘]/g, "'")   // convert curly single quotes to normal
        .replace(/[“”]/g, '"')   // convert curly double quotes to normal
        .trim();
};
