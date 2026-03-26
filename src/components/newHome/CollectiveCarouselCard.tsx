import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ChevronLeft, ChevronRight, Share2, Settings, Eye, ArrowRight, Users } from 'lucide-react-native';
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

  // 1. Sort collectives: Admin/Founder first, then others
  const sortedCollectives = useMemo(() => {
    if (!collectives) return [];

    // Create a copy [...] to avoid mutating the prop
    return [...collectives].sort((a, b) => {
      const isAAdmin = a.role === 'Admin' || a.role === 'Founder';
      const isBAdmin = b.role === 'Admin' || b.role === 'Founder';

      if (isAAdmin && !isBAdmin) return -1; // a comes first
      if (!isAAdmin && isBAdmin) return 1;  // b comes first
      return 0; // maintain relative order
    });
  }, [collectives]);

  // Reset index if sortedCollectives array changes or becomes empty
  useEffect(() => {
    if (!sortedCollectives || sortedCollectives.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= sortedCollectives.length) {
      setCurrentIndex(0);
    }
  }, [sortedCollectives, currentIndex]);

  if (!sortedCollectives || sortedCollectives.length === 0) {
    return null;
  }

  const totalCollectives = sortedCollectives.length;

  // Ensure currentIndex is within bounds
  const safeIndex = Math.max(0, Math.min(currentIndex, totalCollectives - 1));

  // 2. Use sortedCollectives to get the current item
  const currentCollective = sortedCollectives[safeIndex];

  // If somehow currentCollective is undefined, return null
  if (!currentCollective) {
    return null;
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalCollectives - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < totalCollectives - 1 ? prev + 1 : 0));
  };

  // Get first letter of collective name for icon
  const iconLetter = currentCollective?.name?.charAt(0)?.toUpperCase() || 'C';

  // Priority: 1. Use color (with white text), 2. Use logo (image), 3. Fallback to generated color with letter
  const hasColor = !!currentCollective?.color;
  const logoOrImage = currentCollective?.logo || currentCollective?.image || '';
  const hasLogo = !!logoOrImage &&
    (logoOrImage.startsWith('http') ||
      logoOrImage.startsWith('/') ||
      logoOrImage.startsWith('data:'));
  const iconColor = hasColor ? currentCollective.color : (!hasLogo ? '#14B8A6' : undefined); // Default color if no color/logo
  const showImage = hasLogo && !hasColor; // Show logo only if no color is available

  // Check if user is founder/admin
  const isFounder = currentCollective?.role === 'Admin' || currentCollective?.role === 'Founder';

  // Handle button click - navigate to edit if founder, otherwise view
  const handleButtonClick = () => {
    if (!currentCollective?.id) return;

    if (isFounder) {
      (navigation as any).navigate('ManageCRWD', { collectiveId: currentCollective.id });
    } else {
      (navigation as any).navigate('GroupCRWD', { id: currentCollective.id });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        // style={styles.headerRow}
        onPress={() => {
          if (currentCollective?.id) {
            (navigation as any).navigate('GroupCRWD', { id: currentCollective.id });
          }
        }}
        activeOpacity={0.7}
      >
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
            {/* Icon and Title/Badge Row */}
            <View style={styles.headerRow}>
              {/* Circular Icon */}
              <View style={styles.iconContainer}>
                <Users size={20} color="white" />
              </View>

              {/* Title and Badge */}
              <View style={styles.titleBadgeContainer}>
                <Text style={styles.title}>My Giving Groups</Text>
                {/* {currentCollective?.role === 'Admin' && (
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
                    {currentCollective.role === 'Admin' ? 'Organizer' : currentCollective.role}
                  </Text>
                </View>
              )} */}
              </View>
            </View>

            {/* Content */}
            <View style={styles.textContent}>
              <Text style={styles.description}>
                <Text
                  style={styles.bold}
                  onPress={() => {
                    if (currentCollective?.id) {
                      (navigation as any).navigate('GroupCRWD', { id: currentCollective.id });
                    }
                  }}
                >{currentCollective?.name || 'Unknown Collective'}</Text> has{' '}
                <Text style={styles.bold}>{currentCollective?.memberCount || 0}</Text> {currentCollective?.memberCount === 1 ? 'member' : 'members'} and{' '}
                <Text style={styles.bold}>{currentCollective?.causeCount || 0} {currentCollective?.causeCount === 1 ? 'cause' : 'causes'}</Text>.
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
                      <Text style={[styles.outlineButtonText, { color: '#1600ff' }]}>Manage</Text>
                      <ArrowRight size={14} color="#1600ff" />
                    </>
                  ) : (
                    <>
                      <Text style={[styles.outlineButtonText, { color: '#1600ff' }]}>View</Text>
                      <ArrowRight size={14} color="#1600ff" />
                    </>
                  )}
                </TouchableOpacity>
                {/* <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.7}
                onPress={() => {
                  // TODO: Implement share functionality
                  }}
                  >
                  <Text style={styles.primaryButtonText}>Share</Text>
                  </TouchableOpacity> */}
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
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
    fontSize: 14,
    color: '#374151',
    minWidth: 50,
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
  },
  content: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  titleBadgeContainer: {
    flex: 1,
    minWidth: 0,
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
    fontFamily: 'Outfit-Bold',
  },
  textContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 0,
    alignItems: 'flex-start',
    width: '100%',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'left',
    fontFamily: 'Outfit-Bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  founderBadge: {
    backgroundColor: '#FCE7F3',
  },
  memberBadge: {
    backgroundColor: '#A855F7',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
    fontFamily: 'Outfit-Medium',
  },
  founderBadgeText: {
    color: '#DC2626',
  },
  memberBadgeText: {
    color: '#FFFFFF',
  },
  description: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 16,
    lineHeight: 22,
    textAlign: 'left',
    fontFamily: 'Outfit-Regular',
  },
  bold: {
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    // paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Outfit-Bold',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1600ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Outfit-SemiBold',
  },
});
