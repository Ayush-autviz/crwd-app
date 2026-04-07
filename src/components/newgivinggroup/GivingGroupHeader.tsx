import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, MoreHorizontal } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';

interface GivingGroupHeaderProps {
  color?: string;
  title: string;
  memberCount?: number;
  avatar?: string;
  collectiveId?: string;
  isFavorite?: boolean;
  isAdmin?: boolean;
  isJoined?: boolean;
  onShare?: () => void;
  onManageCollective?: () => void;
  onDonate?: () => void;
  onLeave?: () => void;
  onBack?: () => void;
  onJoin?: () => void;
  onMore?: () => void;
}

const getInitials = (name: string) => {
  if (!name) return 'G';
  return name
    .split(' ')
    .filter(word => word.length > 0)
    .map((word) => word[0])
    .join('')
    .substring(0, 1)
    .toUpperCase();
};

export default function GivingGroupHeader({
  title = "Giving Group",
  color,
  memberCount = 0,
  avatar,
  isJoined = false,
  onShare,
  onBack,
  onJoin,
  onMore,
}: GivingGroupHeaderProps) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#374151" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.profileSection}
          onPress={onMore}
          activeOpacity={0.7}
        >
          <Avatar size={40} style={styles.avatar}>
            <AvatarImage src={avatar} />
            <AvatarFallback 
              style={[styles.avatarFallback, { backgroundColor: color || '#1600ff' }]} 
              textStyle={styles.avatarFallbackText}
            >
              {getInitials(title)}
            </AvatarFallback>
          </Avatar>

          <View style={styles.titleSection}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.rightSection}>
        {isJoined ? (
          <TouchableOpacity
            onPress={onShare}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>Invite</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onJoin}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>Join</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onMore}
          style={styles.moreButton}
          activeOpacity={0.7}
        >
          <MoreHorizontal size={24} color="#4b5563" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 64,
    width: '100%',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  backButton: {
    padding: 4,
    borderRadius: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    borderRadius: 8,
  },
  avatarFallback: {
    borderRadius: 8,
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit-Bold',
    fontSize: 18,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#111827',
  },
  moreButton: {
    padding: 4,
    borderRadius: 20,
  },
});
