import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Text,
  StatusBar,
  Image,
} from 'react-native';
import { X, Heart, MessageCircle, Share2 } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ImageFullscreenProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  user?: {
    name: string;
    username?: string;
    avatar: string;
    isVerified?: boolean;
  };
  caption?: string;
  likes?: number | string;
  comments?: number | string;
  isLiked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onUserPress?: (username: string) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ImageFullscreen: React.FC<ImageFullscreenProps> = ({
  isOpen,
  onClose,
  src,
  user,
  caption,
  likes = 0,
  comments = 0,
  isLiked = false,
  onLike,
  onComment,
  onShare,
  onUserPress,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const [isLikedState, setIsLikedState] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(Number(likes));
  const [forceUpdate, setForceUpdate] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Force a re-render after a short delay to ensure onTextLayout fires
    const timer = setTimeout(() => {
      setForceUpdate(prev => prev + 1);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLike = () => {
    const newLikedState = !isLikedState;
    setIsLikedState(newLikedState);
    setLikesCount(prev => newLikedState ? Number(prev) + 1 : Number(prev) - 1);
    if (onLike) {
      onLike();
    }
  };

  const handleUserPress = () => {
    if (user?.username && onUserPress) {
      onUserPress(user.username);
    }
  };

  if (!isOpen) return null;

  return (
    <View style={styles.overlayContainer}>
      <StatusBar barStyle="light-content" backgroundColor="black" translucent />

      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: src }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Close Button */}
      <TouchableOpacity
        style={[styles.closeButton, { top: insets.top + 20 }]}
        onPress={onClose}
      >
        <X size={32} color="rgba(255, 255, 255, 0.7)" />
      </TouchableOpacity>

      {/* Interaction Bar (Right Side) */}
      <View style={styles.interactionBar}>
        <TouchableOpacity
          style={styles.interactionButton}
          onPress={handleLike}
          activeOpacity={0.7}
        >
          <Heart
            size={28}
            color={isLikedState ? "#EF4444" : "white"}
            fill={isLikedState ? "#EF4444" : "transparent"}
            style={styles.iconShadow}
          />
          <Text style={styles.interactionText}>{likesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.interactionButton}
          onPress={onComment}
          activeOpacity={0.7}
        >
          <MessageCircle size={28} color="white" fill="transparent" style={styles.iconShadow} />
          <Text style={styles.interactionText}>{comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.interactionButton}
          onPress={onShare}
          activeOpacity={0.7}
        >
          <Share2 size={28} color="white" style={styles.iconShadow} />
        </TouchableOpacity>
      </View>

      {/* Metadata Overlay (Bottom) */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
        style={styles.metadataGradient}
        pointerEvents="box-none"
      >
        <View style={[styles.metadataContent, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={handleUserPress}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: '#3B82F6' }]} />
              )}
            </View>
            <View style={styles.userNameContainer}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
            </View>
          </TouchableOpacity>

          <View>
            {!isExpanded && (
              <Text
                style={[styles.caption, { position: 'absolute', left: -SCREEN_WIDTH, width: SCREEN_WIDTH - 40 }]}
                onTextLayout={(e) => {
                  if (e.nativeEvent.lines.length > 3) {
                    setCanExpand(true);
                  }
                }}
              >
                {caption}
              </Text>
            )}
            <Text
              style={styles.caption}
              numberOfLines={isExpanded ? undefined : 3}
            >
              {caption}
            </Text>
            {canExpand && (
              <TouchableOpacity
                onPress={() => setIsExpanded(!isExpanded)}
                style={styles.moreButton}
              >
                <Text style={styles.moreButtonText}>
                  {isExpanded ? 'Show less' : 'more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    zIndex: 100,
    padding: 8,
  },
  interactionBar: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    alignItems: 'center',
    gap: 20,
    zIndex: 50,
  },
  interactionButton: {
    alignItems: 'center',
    gap: 6,
  },
  iconShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  interactionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  metadataGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
  },
  metadataContent: {
    gap: 12,
    maxWidth: '85%',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'white',
    padding: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  caption: {
    color: 'white',
    fontSize: 15,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  moreButton: {
    marginTop: 4,
  },
  moreButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.8,
  },
});

export default ImageFullscreen;
