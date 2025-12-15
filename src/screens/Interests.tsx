import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Define categories and their interests
const CATEGORIES = [
  {
    label: "Technology & Science",
    interests: [
      "Technology", "Science", "Programming", "AI", "Gadgets", "Space", "Engineering"
    ]
  },
  {
    label: "Arts & Entertainment",
    interests: [
      "Music", "Movies", "Books", "Art", "Photography", "Theater", "TV Shows"
    ]
  },
  {
    label: "Lifestyle & Wellness",
    interests: [
      "Travel", "Food", "Fashion", "Fitness", "Health", "DIY", "Home Decor"
    ]
  },
  {
    label: "Sports & Outdoors",
    interests: [
      "Sports", "Hiking", "Cycling", "Running", "Camping", "Fishing", "Yoga"
    ]
  },
  {
    label: "Society & Learning",
    interests: [
      "News", "Finance", "Education", "History", "Politics", "Philosophy", "Languages"
    ]
  }
];

const InterestsScreen = () => {
  const navigation = useNavigation();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleContinue = () => {
    // Save interests and navigate to home
    navigation.reset({
      index: 0,
      routes: [{ name: 'DrawerNav' as never }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image 
            source={require('../assets/logo/logo3.webp')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>What interests you?</Text>
          <Text style={styles.subtitle}>
            Select topics you'd like to see in your feed. You can always change these later.
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {CATEGORIES.map((category) => (
          <View key={category.label} style={styles.categoryCard}>
            <Text style={styles.categoryLabel}>{category.label}</Text>
            <View style={styles.interestsGrid}>
              {category.interests.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  onPress={() => toggleInterest(interest)}
                  style={[
                    styles.interestButton,
                    selected.includes(interest) && styles.interestButtonSelected
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.interestButtonText,
                      selected.includes(interest) && styles.interestButtonTextSelected
                    ]}
                  >
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.selectedCount}>
          {selected.length} interest{selected.length !== 1 ? 's' : ''} selected
        </Text>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={selected.length === 0}
          style={[
            styles.continueButton,
            selected.length === 0 && styles.continueButtonDisabled
          ]}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <ArrowRight size={16} color="white" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  headerContent: {
    maxWidth: 672,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    maxWidth: 672,
    alignSelf: 'center',
    width: '100%',
    gap: 24,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 24,
  },
  categoryLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  interestButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    minWidth: (width - 64 - 24) / 3, // 3 columns with gaps
    maxWidth: (width - 64 - 24) / 3,
  },
  interestButtonSelected: {
    backgroundColor: '#111827',
  },
  interestButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  interestButtonTextSelected: {
    color: 'white',
  },
  footer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  continueButton: {
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default InterestsScreen;
