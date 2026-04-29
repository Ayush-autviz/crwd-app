import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  StatusBar,
  Image,
} from 'react-native';
import Video, { VideoRef, ResizeMode } from 'react-native-video';
import { X, Heart, MessageCircle, Share2, Volume2, VolumeX, Play } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface VideoFullscreenProps {
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

const VideoFullscreen: React.FC<VideoFullscreenProps> = ({
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
  const videoRef = useRef<VideoRef>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (isOpen) {
      setIsPlaying(true);
    }
  }, [isOpen]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleProgress = (data: { currentTime: number; playableDuration: number; seekableDuration: number }) => {
    if (data.seekableDuration > 0) {
      setProgress(data.currentTime / data.seekableDuration);
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

      {/* Video Player */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={togglePlay}
        style={styles.videoContainer}
      >
        <Video
          ref={videoRef}
          source={{ uri: src }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          paused={!isPlaying}
          muted={isMuted}
          onProgress={handleProgress}
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => setIsLoading(false)}
          onBuffer={({ isBuffering }) => setIsLoading(isBuffering)}
          repeat={true}
          playsInline={true}
        />

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
          </View>
        )}

        {/* Play Icon Overlay */}
        {!isPlaying && !isLoading && (
          <View style={styles.playOverlay}>
            <View style={styles.playButtonCircle}>
              <Play size={40} color="white" fill="white" style={{ marginLeft: 4 }} />
            </View>
          </View>
        )}
      </TouchableOpacity>

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
            onPress={onLike}
            activeOpacity={0.7}
          >
            <Heart
              size={28}
              color={isLiked ? "#EF4444" : "white"}
              fill={isLiked ? "#EF4444" : "transparent"}
              style={styles.iconShadow}
            />
            <Text style={styles.interactionText}>{likes}</Text>
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

          <TouchableOpacity
            style={styles.interactionButton}
            onPress={toggleMute}
            activeOpacity={0.7}
          >
            {isMuted ? <VolumeX size={28} color="white" style={styles.iconShadow} /> : <Volume2 size={28} color="white" style={styles.iconShadow} />}
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
              {/* {user?.isVerified && (
                <Image
                  source={require('../../assets/icons/verified.png')}
                  style={{ width: 14, height: 14 }}
                />
              )} */}
            </View>
          </TouchableOpacity>

          <Text style={styles.caption} numberOfLines={3}>
            {caption}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
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
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
  progressBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 60,
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    shadowColor: 'white',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
});

export default VideoFullscreen;
