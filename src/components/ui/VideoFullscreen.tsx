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
import { X, Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Pause, SkipBack, SkipForward } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, runOnJS } from 'react-native-reanimated';

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
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [barWidth, setBarWidth] = useState(SCREEN_WIDTH - 32);
  const [seekFeedback, setSeekFeedback] = useState<{ type: 'forward' | 'backward', visible: boolean }>({ type: 'forward', visible: false });
  const [isLikedState, setIsLikedState] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(Number(likes));

  const progressSV = useSharedValue(0);
  const progressBarRef = useRef<View>(null);
  const barLayout = useRef({ x: 0, width: SCREEN_WIDTH - 32 });
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    return () => {
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
      if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    };
  }, []);

  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      runOnJS(setIsDragging)(true);
    })
    .onUpdate((e) => {
      const x = e.absoluteX - barLayout.current.x;
      const value = Math.max(0, Math.min(1, x / barLayout.current.width));

      progressSV.value = value;

      runOnJS(setProgress)(value);
      runOnJS(setCurrentTime)(value * duration);

      if (videoRef.current) {
        runOnJS(videoRef.current.seek)(value * duration);
      }
    })
    .onEnd(() => {
      runOnJS(setIsDragging)(false);
    });

  useEffect(() => {
    if (isOpen) {
      setIsPlaying(true);
    }
  }, [isOpen]);

  useEffect(() => {
    setIsLikedState(isLiked);
  }, [isLiked]);

  useEffect(() => {
    setLikesCount(Number(likes));
  }, [likes]);

  const handleLike = () => {
    const newLikedState = !isLikedState;
    setIsLikedState(newLikedState);
    setLikesCount(prev => newLikedState ? Number(prev) + 1 : Number(prev) - 1);
    if (onLike) {
      onLike();
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleProgress = (data: { currentTime: number; playableDuration: number; seekableDuration: number }) => {
    if (!isDragging) {
      setCurrentTime(data.currentTime);
      if (data.seekableDuration > 0) {
        setProgress(data.currentTime / data.seekableDuration);
      }
    }
  };

  const handleLoad = (data: { duration: number }) => {
    setDuration(data.duration);
    setIsLoading(false);
  };

  const handleSeek = (amount: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + amount));
      videoRef.current.seek(newTime);
      setCurrentTime(newTime);
    }
  };

  const handleVideoPress = (e: any) => {
    const { locationX } = e.nativeEvent;
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
        tapTimeout.current = null;
      }

      const isRightSide = locationX > SCREEN_WIDTH / 2;
      handleSeek(isRightSide ? 5 : -5);

      if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
      setSeekFeedback({ type: isRightSide ? 'forward' : 'backward', visible: true });
      feedbackTimeout.current = setTimeout(() => setSeekFeedback(prev => ({ ...prev, visible: false })), 500);

      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      tapTimeout.current = setTimeout(() => {
        togglePlay();
        tapTimeout.current = null;
      }, DOUBLE_TAP_DELAY);
    }
  };

  const formatRemainingTime = (current: number, total: number) => {
    const remaining = Math.max(0, total - current);
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    return `-${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
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
        onPress={handleVideoPress}
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
          onLoad={handleLoad}
          onBuffer={({ isBuffering }) => setIsBuffering(isBuffering)}
          repeat={true}
          playsInline={true}
          progressUpdateInterval={100}
          ignoreSilentSwitch="ignore"
          playInBackground={false}
          playWhenInactive={false}
          bufferConfig={{ minBufferMs: 15000, maxBufferMs: 50000, bufferForPlaybackMs: 2500, bufferForPlaybackAfterRebufferMs: 5000 }}
        />

        {/* Buffering Indicator */}
        {isBuffering && !isLoading && (
          <View style={styles.bufferingContainer}>
            <ActivityIndicator size="small" color="white" />
          </View>
        )}

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

        {/* <TouchableOpacity
          style={styles.interactionButton}
          onPress={toggleMute}
          activeOpacity={0.7}
        >
          {isMuted ? <VolumeX size={28} color="white" style={styles.iconShadow} /> : <Volume2 size={28} color="white" style={styles.iconShadow} />}
        </TouchableOpacity> */}
      </View>

      {/* Metadata Overlay (Bottom) */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
        style={styles.metadataGradient}
        pointerEvents="box-none"
      >
        <View style={[styles.metadataContent, { paddingBottom: 0 }]}>
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
                style={[styles.caption, { position: 'absolute', opacity: 0 }]}
                onTextLayout={(e) => {
                  if (e.nativeEvent.lines.length > 2) {
                    setCanExpand(true);
                  }
                }}
              >
                {caption}
              </Text>
            )}
            <Text
              style={styles.caption}
              numberOfLines={isExpanded ? undefined : 2}
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

        {/* New Interactive Footer */}
        <View style={[styles.footerContainer, { paddingBottom: insets.bottom + 10 }]} pointerEvents="box-none">
          {/* Interactive Progress Bar with GestureDetector for Dragging */}
          <GestureDetector gesture={panGesture}>
            <View
              ref={progressBarRef}
              onLayout={() => {
                progressBarRef.current?.measureInWindow((x, y, width) => {
                  barLayout.current = { x, width };
                });
              }}
              style={[styles.progressBarWrapper, { zIndex: 100 }]}
            >
              <View style={styles.progressBarBg} pointerEvents="none">
                <View style={[styles.progressBarActive, { width: `${progress * 100}%` }]}>
                  <View style={[
                    styles.scrubberThumb,
                    isDragging && { transform: [{ scale: 1.5 }] }
                  ]} />
                </View>
              </View>
            </View>
          </GestureDetector>

          <View style={styles.footerControls}>
            <View style={styles.footerLeft}>
              <TouchableOpacity onPress={togglePlay} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                {isPlaying ? <Pause size={24} color="white" fill="white" /> : <Play size={24} color="white" fill="white" />}
              </TouchableOpacity>
              <Text style={styles.timestampText}>{formatRemainingTime(currentTime, duration)}</Text>
            </View>

            <TouchableOpacity onPress={toggleMute} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              {isMuted ? <VolumeX size={24} color="white" /> : <Volume2 size={24} color="white" />}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      {/* Seek Feedback Overlays - Centered on screen */}
      {seekFeedback.visible && (
        <View style={styles.seekFeedbackOverlay} pointerEvents="none">
          <View style={[
            styles.seekFeedbackContent,
            seekFeedback.type === 'backward' ? { marginRight: 'auto', marginLeft: '2%' } : { marginLeft: 'auto', marginRight: '2%' }
          ]}>
            {seekFeedback.type === 'forward' ? (
              <SkipForward size={40} color="white" fill="white" />
            ) : (
              <SkipBack size={40} color="white" fill="white" />
            )}
            <Text style={styles.seekFeedbackText}>5s</Text>
          </View>
        </View>
      )}
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
  footerContainer: {
    paddingHorizontal: 16,
  },
  progressBarWrapper: {
    height: 30,
    justifyContent: 'center',
    zIndex: 100,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 1.5,
    width: '100%',
    overflow: 'visible',
  },
  progressBarActive: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 1.5,
    position: 'relative',
  },
  scrubberThumb: {
    position: 'absolute',
    right: -6,
    top: -4.5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  footerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  timestampText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
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
  bufferingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekFeedbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  seekFeedbackContent: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  seekFeedbackText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default VideoFullscreen;
