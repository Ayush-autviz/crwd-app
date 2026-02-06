import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MapPin } from 'lucide-react-native';
import { categories } from '../../Constants/categories';

interface CauseDetailsProps {
  causeData: any;
}

// Get category info - handles combined category IDs like "MK"
const getCategoryInfo = (categoryId: string) => {
  // If categoryId is a combination like "MK", split it and return multiple categories
  if (categoryId && categoryId.length > 1) {
    const categoryIds = categoryId.split('');
    const foundCategories = categoryIds
      .map((id) => categories.find((cat) => cat.id === id))
      .filter((cat: any) => cat !== undefined);

    // If we found multiple categories, return them as an array
    if (foundCategories.length > 0) {
      return foundCategories;
    }
  }

  // Single category or default - return as array for consistency
  const category = categories.find((cat) => cat.id === categoryId) || categories[0];
  return [category];
};

export default function CauseDetails({ causeData }: CauseDetailsProps) {
  const navigation = useNavigation();
  const categoryInfo = getCategoryInfo(causeData?.category || '');
  const category = categoryInfo[0]; // Use first category for related categories logic

  // Get related categories - show related categories based on the main category
  const getRelatedCategories = () => {
    if (!category) return [];

    // Map of category IDs to related category IDs
    const relatedMap: Record<string, string[]> = {
      G: ['E', 'F', 'H', 'U'], // Wellness -> Health, Mental, Research, Science
      E: ['G', 'F', 'H', 'U'], // Health -> Wellness, Mental, Research, Science
      F: ['E', 'G', 'H'], // Mental -> Health, Wellness, Research
      H: ['E', 'F', 'U', 'G'], // Research -> Health, Mental, Science, Wellness
      U: ['H', 'E', 'G'], // Science -> Research, Health, Wellness
    };

    const relatedIds = relatedMap[category.id] || [];
    return relatedIds
      .map((id) => categories.find((cat) => cat.id === id))
      .filter(Boolean) as typeof categories;
  };

  const relatedCategories = getRelatedCategories();

  return (
    <View style={styles.container}>
      {/* Address */}
      {causeData?.street && (
        <View style={styles.section}>
          <View style={styles.addressRow}>
            <MapPin size={16} color="#4B5563" />
            <View style={styles.addressContent}>
              <Text style={styles.sectionTitle}>ADDRESS</Text>
              <Text style={styles.addressText}>
                {causeData.street}
                {causeData.city && `, ${causeData.city}`}
                {causeData.state && `, ${causeData.state}`}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Related Causes
      {relatedCategories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RELATED CAUSES</Text>
          <View style={styles.categoriesContainer}>
            {relatedCategories.map((cat) => (
              <View
                key={cat.id}
                style={[styles.categoryTag, { backgroundColor: cat.text }]}
              >
                <Text style={styles.categoryText}>{cat.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )} */}

      {/* Main Focus */}
      {categoryInfo.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MAIN FOCUS</Text>
          <View style={styles.mainFocusContainer}>
            {categoryInfo.map((cat: any, index: number) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  (navigation as any).navigate('SearchResults', {
                    categoryId: cat.id,
                    categoryName: cat.name,
                    searchQuery: cat.name,
                    tab: 'Causes'
                  });
                }}
                style={styles.mainFocusBadge}
                activeOpacity={0.7}
              >
                <Text style={styles.mainFocusText}>
                  {cat.name}
                  {index < categoryInfo.length - 1 && <Text style={styles.commaText}>,</Text>}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Tax ID */}
      {causeData?.tax_id_number && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TAX ID</Text>
          <Text style={styles.taxId}>{causeData.tax_id_number}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
  },
  section: {
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: 15,
    color: '#374151',
    textTransform: 'uppercase',
    fontFamily: 'Outfit-Regular',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    color: '#FFFFFF',
  },
  mainFocusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    // marginTop: 4,
  },
  mainFocusBadge: {
    paddingEnd: 5,
    // paddingVertical: 4,
    borderRadius: 20,
  },
  mainFocusText: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    color: '#1600ff',
  },
  taxId: {
    fontSize: 15,
    color: '#374151',
    fontFamily: 'Outfit-Regular',
    // marginTop: 4,
  },
});

