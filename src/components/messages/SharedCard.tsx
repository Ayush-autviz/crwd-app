import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Heart, MessageCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ChatMessage } from './types';
import { PrimaryBlue } from '../../Constants/Colors';

interface SharedCardProps {
  cardData: NonNullable<ChatMessage['cardData']>;
  isMe?: boolean;
}

export function SharedCard({ cardData, isMe }: SharedCardProps) {
  const navigation = useNavigation<any>();

  const handleNavigation = () => {
    if (!cardData?.id) return;
    
    if (cardData.type === 'cause' || cardData.type === 'nonprofit') {
      navigation.navigate('CauseScreen', { id: cardData.id });
    } else if (cardData.type === 'collective') {
      navigation.navigate('GroupCRWD', { id: cardData.id });
    } else if (cardData.type === 'fundraiser') {
      navigation.navigate('FundraiserDetail', { id: cardData.id });
    } else if (cardData.type === 'post') {
      navigation.navigate('PostDetail', { postId: cardData.id });
    } else if (cardData.type === 'profile') {
      navigation.navigate('UserProfile', { userId: cardData.id });
    }
  };

  const isSimplifiedCard =
    cardData.type === 'cause' ||
    cardData.type === 'nonprofit' ||
    cardData.type === 'collective' ||
    cardData.type === 'profile' ||
    cardData.type === 'fundraiser';

  if (isSimplifiedCard) {
    return (
      <TouchableOpacity
        onPress={handleNavigation}
        style={[
          styles.simplifiedContainer,
          isMe ? styles.myCardBg : styles.otherCardBg
        ]}
        activeOpacity={0.85}
      >
        <View style={[styles.innerRow, isMe ? styles.myInnerBg : styles.otherInnerBg]}>
          {cardData.image ? (
            <Image source={{ uri: cardData.image }} style={styles.cardThumb} />
          ) : (
            <View
              style={[
                styles.fallbackThumb,
                { backgroundColor: cardData.color || (isMe ? 'rgba(255,255,255,0.2)' : '#9CA3AF') }
              ]}
            >
              <Text style={styles.fallbackLetter}>
                {cardData.title?.charAt(0)?.toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.textContent}>
            <Text
              style={[styles.titleText, isMe ? styles.whiteText : styles.darkText]}
              numberOfLines={1}
            >
              {cardData.title}
            </Text>
            {cardData.description ? (
              <Text
                style={[styles.descText, isMe ? styles.lightWhiteText : styles.greyText]}
                numberOfLines={2}
              >
                {cardData.description}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Standard Post or customized detailed Shared Card
  return (
    <TouchableOpacity
      onPress={handleNavigation}
      style={[
        styles.detailedContainer,
        isMe ? styles.myCardBg : styles.otherCardBg
      ]}
      activeOpacity={0.85}
    >
      <View style={[styles.detailedInner, isMe ? styles.myInnerBg : styles.otherInnerBg]}>
        {/* Header Bar */}
        <View style={styles.detailHeaderRow}>
          {cardData.avatar ? (
            <Image source={{ uri: cardData.avatar }} style={styles.userAvatar} />
          ) : (
            <Text style={styles.iconThumb}>{cardData.icon || '🔗'}</Text>
          )}
          <Text
            style={[styles.detailTitleText, isMe ? styles.whiteText : styles.darkText]}
            numberOfLines={1}
          >
            {cardData.title}
          </Text>
        </View>

        {/* Text Snippet */}
        {cardData.description ? (
          <Text
            style={[styles.detailDescText, isMe ? styles.lightWhiteText : styles.darkGreyText]}
            numberOfLines={3}
          >
            {cardData.description}
          </Text>
        ) : null}

        {/* Rich Embedded Media */}
        {cardData.image ? (
          <Image source={{ uri: cardData.image }} style={styles.detailCoverImage} />
        ) : null}

        {/* Metrics Bar */}
        {cardData.type === 'post' ? (
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Heart size={14} color={isMe ? '#FFFFFF' : '#4B5563'} />
              <Text style={[styles.metricText, isMe ? styles.whiteText : styles.darkGreyText]}>
                {cardData.likesCount || 0}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <MessageCircle size={14} color={isMe ? '#FFFFFF' : '#4B5563'} />
              <Text style={[styles.metricText, isMe ? styles.whiteText : styles.darkGreyText]}>
                {cardData.commentsCount || 0}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  simplifiedContainer: {
    borderRadius: 16,
    padding: 6,
    maxWidth: 280,
    marginTop: 4,
  },
  myCardBg: {
    backgroundColor: PrimaryBlue,
  },
  otherCardBg: {
    backgroundColor: '#F3F4F6',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    gap: 10,
  },
  myInnerBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  otherInnerBg: {
    backgroundColor: 'rgba(229, 231, 235, 0.6)',
  },
  cardThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  fallbackThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLetter: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#FFFFFF',
  },
  textContent: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
  },
  whiteText: {
    color: '#FFFFFF',
  },
  darkText: {
    color: '#111827',
  },
  descText: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    marginTop: 2,
  },
  lightWhiteText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  greyText: {
    color: '#6B7280',
  },
  detailedContainer: {
    borderRadius: 16,
    padding: 6,
    maxWidth: 300,
    marginTop: 4,
  },
  detailedInner: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  iconThumb: {
    fontSize: 14,
  },
  detailTitleText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    flex: 1,
  },
  detailDescText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    lineHeight: 18,
  },
  darkGreyText: {
    color: '#4B5563',
  },
  detailCoverImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold',
  },
});
