import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { categories } from '../../Constants/categories';

interface CauseDetailsProps {
  causeData: any;
}

export default function CauseDetails({ causeData }: CauseDetailsProps) {
  const category = categories.find((cat) => cat.id === causeData?.category);

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

      {/* Related Causes */}
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
      )}

      {/* Main Focus */}
      {category && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MAIN FOCUS</Text>
          <Text style={styles.mainFocus}>{category.name}</Text>
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
    fontSize: 10,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: 12,
    color: '#374151',
    textTransform: 'uppercase',
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
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  mainFocus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1600ff',
    marginTop: 4,
  },
  taxId: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
  },
});

