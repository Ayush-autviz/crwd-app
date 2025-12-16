import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ChevronLeft, ChevronRight, Share2, Settings, Eye } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface Collective {
  id: string | number;
  name: string;
  memberCount: number;
  yearlyAmount: number;
  causeCount: number;
  role?: string; // "Member", "Admin", etc.
  image?: string; // Collective cover image or avatar
  logo?: string; // Collective logo
  color?: string; // Collective color
}

interface CollectiveCarouselCardProps {
  collectives?: Collective[];
}

export default function CollectiveCarouselCard({
  collectives = [],
}: CollectiveCarouselCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigation = useNavigation();

  if (!collectives || collectives.length === 0) {
    return null;
  }

  const currentCollective = collectives[currentIndex];
  const totalCollectives = collectives.length;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalCollectives - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < totalCollectives - 1 ? prev + 1 : 0));
  };

  // Get first letter of collective name for icon
  const iconLetter = currentCollective.name?.charAt(0).toUpperCase() || 'C';

  // Priority: 1. Use color (with white text), 2. Use logo (image), 3. Fallback to generated color with letter
  const hasColor = currentCollective.color;
  const hasLogo = (currentCollective.logo || currentCollective.image) && 
    ((currentCollective.logo || currentCollective.image || '').startsWith('http') ||
     (currentCollective.logo || currentCollective.image || '').startsWith('/') ||
     (currentCollective.logo || currentCollective.image || '').startsWith('data:'));
  const iconColor = hasColor || (!hasLogo ? '#14B8A6' : undefined); // Default color if no color/logo
  const showImage = hasLogo && !hasColor; // Show logo only if no color is available

  // Check if user is founder/admin
  const isFounder = currentCollective.role === 'Admin' || currentCollective.role === 'Founder';

  // Handle button click - navigate to edit if founder, otherwise view
  const handleButtonClick = () => {
    if (isFounder) {
      navigation.navigate('ManageCRWD' as never, { collectiveId: currentCollective.id } as never);
    } else {
      navigation.navigate('GroupCRWD' as never, { id: currentCollective.id } as never);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Carousel Navigation */}
        {totalCollectives > 1 && (
          <View style={styles.navigation}>
            <TouchableOpacity
              onPress={handlePrevious}
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <ChevronLeft size={20} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.navText}>
              {currentIndex + 1} of {totalCollectives}
            </Text>
            <TouchableOpacity
              onPress={handleNext}
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <ChevronRight size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.content}>
          {/* Circular Icon */}
          <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
            {showImage ? (
              <Image
                source={{ uri: currentCollective.logo || currentCollective.image }}
                style={styles.iconImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.iconLetter}>{iconLetter}</Text>
            )}
          </View>

          {/* Content */}
          <View style={styles.textContent}>
            <Text style={styles.title}>{currentCollective.name}</Text>
            {currentCollective.role && (
              <View
                style={[
                  styles.badge,
                  currentCollective.role === 'Admin'
                    ? styles.founderBadge
                    : styles.memberBadge,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    currentCollective.role === 'Admin' && styles.founderBadgeText,
                    currentCollective.role !== 'Admin' && styles.memberBadgeText,
                  ]}
                >
                  {currentCollective.role === 'Admin' ? 'Founder' : currentCollective.role}
                </Text>
              </View>
            )}
            <Text style={styles.description}>
              <Text style={styles.bold}>{currentCollective.memberCount}</Text> members are
              currently donating to{' '}
              <Text style={styles.bold}>{currentCollective.causeCount} causes</Text>.
            </Text>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.outlineButton}
                onPress={handleButtonClick}
                activeOpacity={0.7}
              >
                {isFounder ? (
                  <>
                    <Settings size={16} color="#111827" />
                    <Text style={styles.outlineButtonText}>Manage</Text>
                  </>
                ) : (
                  <>
                    <Eye size={16} color="#111827" />
                    <Text style={styles.outlineButtonText}>View</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.7}
                onPress={() => {
                  // TODO: Implement share functionality
                }}
              >
                <Share2 size={16} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
    // maxWidth: '95%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    position: 'relative',
  },
  navigation: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  navButton: {
    padding: 4,
    borderRadius: 4,
  },
  navText: {
    fontSize: 12,
    color: '#374151',
    minWidth: 50,
    textAlign: 'center',
    fontWeight: '500',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  iconLetter: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 20,
  },
  textContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 60,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  founderBadge: {
    backgroundColor: '#FCE7F3',
  },
  memberBadge: {
    backgroundColor: '#A855F7',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#DC2626',
  },
  founderBadgeText: {
    color: '#DC2626',
  },
  memberBadgeText: {
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 16,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: '#111827',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  outlineButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1600ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

