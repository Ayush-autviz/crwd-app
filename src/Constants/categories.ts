// Old categories with muted colors - commented out
// export const categories = [
//     { id: "", name: "All", text: "#000000", background: "#f5f5f5" }, // no match in CATEGORIES
//     { id: "D", name: "Animals", text: "#E36414", background: "#FFE9DC" }, // "Animal" -> "Animals"
//     { id: "A", name: "Arts", text: "#FF6B6B", background: "#FFECEC" }, // "Arts & Culture"
//     { id: "S", name: "Community", text: "#06D6A0", background: "#D6FAF0" },
//     { id: "B", name: "Education", text: "#FFB84D", background: "#FFF3E0" },
//     { id: "C", name: "Environment", text: "#6A994E", background: "#E8F4E4" },
//     { id: "K", name: "Food", text: "#FF9F1C", background: "#FFF0D9" }, // "Food & Agriculture" shortened
//     { id: "Z", name: "General", text: "#ADB5BD", background: "#F3F4F6" }, // no clear match — possibly "Unknown" (Z)
//     { id: "Q", name: "Global", text: "#48CAE4", background: "#D7F0FB" },
//     { id: "E", name: "Health", text: "#D62828", background: "#FFE5E5" }, // "Health Care" shortened
//     { id: "L", name: "Housing", text: "#8D6E63", background: "#F5E9E3" }, // "Housing & Shelter"
//     { id: "J", name: "Jobs", text: "#6C757D", background: "#ECEFF1" }, // "Employment" shortened
//     { id: "I", name: "Legal", text: "#FFBE0B", background: "#FFF7D6" }, // "Legal & Reform"
//     { id: "Y", name: "Membership", text: "#5E6472", background: "#EBEDF1" }, // "Mutual & Membership Benefit"
//     { id: "F", name: "Mental", text: "#9D4EDD", background: "#F3E8FA" }, // "Mental Health"
//     { id: "T", name: "Philanthropy", text: "#FF006E", background: "#FFE0ED" },
//     { id: "W", name: "Public", text: "#2A9D8F", background: "#D6F4F1" }, // ambiguous — maybe "Human Services (P)" or "Community (S)"
//     { id: "M", name: "Relief", text: "#F94144", background: "#FFE3E3" },
//     { id: "X", name: "Religion", text: "#E9C46A", background: "#FFF7E0" },
//     { id: "H", name: "Research", text: "#3A86FF", background: "#DDE8FF" }, // "Medical Research"
//     { id: "R", name: "Rights", text: "#780000", background: "#FFDADA" }, // "Civil Rights & Advocacy"
//     { id: "U", name: "Science", text: "#023E8A", background: "#D7E3FF" }, // "Science & Technology"
//     { id: "P", name: "Services", text: "#3F37C9", background: "#E2E0FA" }, // "Human Services"
//     { id: "V", name: "Society", text: "#577590", background: "#EAF0F5" }, // "Social Science" loosely matches
//     { id: "N", name: "Sports", text: "#90BE6D", background: "#EBF6E2" }, // "Recreation and Sports"
//     { id: "G", name: "Wellness", text: "#F28482", background: "#FFEAEA" },
//     { id: "O", name: "Youth", text: "#4CC9F0", background: "#E0F7FF" }, // "Youth Development"
//   ];

// New categories with bright colors and white text
export const categories = [
  { id: "", name: "All", text: "#FFFFFF", background: "#6B7280" },
  { id: "D", name: "Animals", text: "#FFFFFF", background: "#F97316" }, // Bright Orange
  { id: "A", name: "Arts", text: "#FFFFFF", background: "#EC4899" }, // Bright Pink
  { id: "S", name: "Community", text: "#FFFFFF", background: "#10B981" }, // Bright Green
  { id: "B", name: "Education", text: "#FFFFFF", background: "#F59E0B" }, // Bright Amber
  { id: "C", name: "Climate", text: "#FFFFFF", background: "#22C55E" }, // Bright Emerald
  { id: "K", name: "Hunger", text: "#FFFFFF", background: "#F97316" }, // Bright Orange
  { id: "Z", name: "General", text: "#FFFFFF", background: "#6B7280" }, // Gray
  { id: "Q", name: "Global", text: "#FFFFFF", background: "#06B6D4" }, // Bright Cyan
  { id: "E", name: "Health", text: "#FFFFFF", background: "#EF4444" }, // Bright Red
  { id: "L", name: "Housing", text: "#FFFFFF", background: "#8B5CF6" }, // Bright Purple
  { id: "J", name: "Jobs", text: "#FFFFFF", background: "#6366F1" }, // Bright Indigo
  { id: "I", name: "Legal", text: "#FFFFFF", background: "#EAB308" }, // Bright Yellow
  { id: "Y", name: "Membership", text: "#FFFFFF", background: "#64748B" }, // Slate
  { id: "F", name: "Mental Health", text: "#FFFFFF", background: "#A855F7" }, // Bright Violet
  { id: "T", name: "Philanthropy", text: "#FFFFFF", background: "#F43F5E" }, // Bright Rose
  { id: "W", name: "Public", text: "#FFFFFF", background: "#14B8A6" }, // Bright Teal
  { id: "M", name: "Disaster", text: "#FFFFFF", background: "#DC2626" }, // Bright Red
  { id: "X", name: "Faith", text: "#FFFFFF", background: "#F59E0B" }, // Bright Amber
  { id: "H", name: "Research", text: "#FFFFFF", background: "#3B82F6" }, // Bright Blue
  { id: "R", name: "Justice", text: "#FFFFFF", background: "#DC2626" }, // Bright Red
  { id: "U", name: "Science", text: "#FFFFFF", background: "#10B981" }, // Bright Green
  { id: "P", name: "Services", text: "#FFFFFF", background: "#6366F1" }, // Bright Indigo
  { id: "V", name: "Society", text: "#FFFFFF", background: "#475569" }, // Slate
  { id: "N", name: "Sports", text: "#FFFFFF", background: "#22C55E" }, // Bright Emerald
  { id: "G", name: "Wellness", text: "#FFFFFF", background: "#EC4899" }, // Bright Pink (like the image)
  { id: "O", name: "Kids", text: "#FFFFFF", background: "#06B6D4" }, // Bright Cyan
  { id: "a", name: "Veterans", text: "#FFFFFF", background: "#10B981" }, // Bright Cyan
  { id: "b", name: "Homelessness", text: "#FFFFFF", background: "#06B6D4" }, // Bright Cyan
  { id: "c", name: "Cancer", text: "#FFFFFF", background: "#F97316" }, // Bright Orange
  { id: "d", name: "Jewish", text: "#FFFFFF", background: "#10B981" }, // Bright Cyan
  { id: "e", name: "Asian", text: "#FFFFFF", background: "#06B6D4" }, // Bright Cyan
  { id: "f", name: "Seniors", text: "#FFFFFF", background: "#DC2626" }, // Bright Cyan
  { id: "g", name: "African American", text: "#FFFFFF", background: "#64748B" }, // Bright Cyan
  { id: "h", name: "Domestic", text: "#FFFFFF", background: "#EC4899" }, // Bright Cyan
  { id: "i", name: "Violence", text: "#FFFFFF", background: "#06B6D4" }, // Bright Cyan
  { id: "j", name: "Crisis", text: "#FFFFFF", background: "#DC2626" }, // Bright Cyan
  { id: "k", name: "Emergency", text: "#FFFFFF", background: "#A855F7" }, // Bright Cyan
  { id: "l", name: "Rights", text: "#FFFFFF", background: "#10B981" }, // Bright Cyan
  { id: "m", name: "Human Rights", text: "#FFFFFF", background: "#EC4899" }, // Bright Cyan
  { id: "n", name: "Breast Cancer", text: "#FFFFFF", background: "#10B981" }, // Bright Cyan
  { id: "o", name: "Abuse", text: "#FFFFFF", background: "#06B6D4" }, // Bright Cyan
  { id: "p", name: "Wilderness", text: "#FFFFFF", background: "#DC2626" }, // Bright Cyan
  { id: "q", name: "Politics", text: "#FFFFFF", background: "#A855F7" }, // Bright Cyan
  { id: "r", name: "Relief", text: "#FFFFFF", background: "#10B981" }, // Bright Cyan
  { id: "s", name: "Environment", text: "#FFFFFF", background: "#06B6D4" }, // Bright Cyan
  { id: "t", name: "Wildlife", text: "#FFFFFF", background: "#EC4899" }, // Bright Cyan
  { id: "u", name: "LGBTQ+", text: "#FFFFFF", background: "#DC2626" }, // Bright Cyan
  { id: "v", name: "Poverty", text: "#FFFFFF", background: "#10B981" }, // Bright Cyan
  { id: "w", name: "Women's Health", text: "#FFFFFF", background: "#A855F7" }, // Bright Cyan
  { id: "x", name: "Training", text: "#FFFFFF", background: "#10B981" }, // Bright Cyan
  { id: "y", name: "Women", text: "#FFFFFF", background: "#06B6D4" }, // Bright Cyan
  { id: "z", name: "Men's Health", text: "#FFFFFF", background: "#EC4899" }, // Bright Cyan
  { id: "1", name: "Equality", text: "#FFFFFF", background: "#DC2626" }, // Bright Cyan
  { id: "2", name: "Marine", text: "#FFFFFF", background: "#10B981" }, // Bright Cyan
  { id: "3", name: "Latin", text: "#FFFFFF", background: "#06B6D4" }, // Bright Cyan
];
