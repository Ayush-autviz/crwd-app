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

  const buttonWidth = (width - 48) / 2 - 8;

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

      {/* <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      > */}
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
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  logo: {
    width: 80,
    height: 80,
    // marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  categoryContainer: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 12,
  },
  categoryLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  interestsGrid: {
    width: '100%',
  },
  interestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  interestButton: {
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 36,
  },
  interestButtonSelected: {
    backgroundColor: Colors.PrimaryBlue,
    borderColor: Colors.PrimaryBlue,
  },
  interestButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
  },
  interestButtonTextSelected: {
    color: '#ffffff',
  },
  footer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCount: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: Colors.PrimaryBlue,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default InterestsScreen; 