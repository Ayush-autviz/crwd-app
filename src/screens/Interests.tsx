import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Colors from '../Constants/Colors';

type RootStackParamList = {
  Home: undefined;
  Interests: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Interests'>;

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
  const navigation = useNavigation<NavigationProp>();
  const { width } = useWindowDimensions();
  const [selected, setSelected] = useState<string[]>([]);

  const buttonWidth = (width - 76) / 2 - 8;

  const toggleInterest = (interest: string) => {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleContinue = () => {
    navigation.navigate('DrawerNav' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Image
            source={require('../assets/logo/logo3.webp')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>What interests you?</Text>
          <Text style={styles.subtitle}>
            Select topics you'd like to see in your feed.
          </Text>
        </View>

        {CATEGORIES.map((category) => (
          <View key={category.label} style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>{category.label}</Text>
            <View style={styles.interestsGrid}>
              {category.interests.map((interest, index) => (
                index % 2 === 0 ? (
                  <View key={interest} style={styles.interestRow}>
                    <TouchableOpacity
                      onPress={() => toggleInterest(interest)}
                      style={[
                        styles.interestButton,
                        selected.includes(interest) && styles.interestButtonSelected,
                        { width: buttonWidth }
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.interestButtonText,
                          selected.includes(interest) && styles.interestButtonTextSelected
                        ]}
                        numberOfLines={1}
                      >
                        {interest}
                      </Text>
                    </TouchableOpacity>
                    {index + 1 < category.interests.length && (
                      <TouchableOpacity
                        onPress={() => toggleInterest(category.interests[index + 1])}
                        style={[
                          styles.interestButton,
                          selected.includes(category.interests[index + 1]) && styles.interestButtonSelected,
                          { width: buttonWidth }
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.interestButtonText,
                            selected.includes(category.interests[index + 1]) && styles.interestButtonTextSelected
                          ]}
                          numberOfLines={1}
                        >
                          {category.interests[index + 1]}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

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
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: 'white',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.PrimaryGrey,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  categoryContainer: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  interestsGrid: {
    width: '100%',
  },
  interestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  interestButton: {
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    minHeight: 44,
  },
  interestButtonSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  interestButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  interestButtonTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  footer: {
    backgroundColor: 'white',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCount: {
    fontSize: 14,
    color: Colors.PrimaryGrey,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InterestsScreen; 