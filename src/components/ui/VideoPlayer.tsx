import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  Platform,
} from 'react-native';
import Video, { VideoRef, ResizeMode } from 'react-native-video';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Loader2,
} from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  style?: any;
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

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  style,
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const navigation = useNavigation<any>();

  const screenWidth = Dimensions.get('window').width;

  // Format time (e.g., 0:00)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const togglePlay = () => {
    if (isFinished || progress >= 0.99) {
      videoRef.current?.seek(0);
      setProgress(0);
      setIsFinished(false);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
    hideControlsDelayed();
  };

  const onProgress = (data: { currentTime: number; playableDuration: number }) => {
    if (duration > 0) {
      setProgress(data.currentTime / duration);
    }
  };

  const [naturalAspectRatio, setNaturalAspectRatio] = useState(16 / 9);

  const onLoad = (data: { duration: number; naturalSize?: { width: number; height: number } }) => {
    setDuration(data.duration);
    if (data.naturalSize && data.naturalSize.height > 0) {
      setNaturalAspectRatio(data.naturalSize.width / data.naturalSize.height);
    }
    setIsLoading(false);
    setHasLoaded(true);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    setIsPlaying(false);
    navigation.navigate('FullscreenVideo', {
      src,
      user,
      caption,
      likes,
      comments,
      isLiked,
      onLike,
      onComment,
      onShare,
      onUserPress,
    });
  };

  const hideControlsDelayed = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleContainerPress = () => {
    setShowControls(true);
    hideControlsDelayed();
  };

  useEffect(() => {
    hideControlsDelayed();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  const containerStyle = useMemo(() => {
    if (naturalAspectRatio > 1.1) {
      return {
        height: 200,
        aspectRatio: naturalAspectRatio,
      };
    } else {
      return {
        maxHeight: 350,
        aspectRatio: naturalAspectRatio,
      };
    }
  }, [naturalAspectRatio]);

  return (
    <View style={[styles.container, containerStyle, style]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleContainerPress}
        style={styles.videoWrapper}
      >
        <Video
          ref={videoRef}
          source={{ uri: src }}
          poster={poster}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          paused={!isPlaying}
          muted={isMuted}
          onProgress={onProgress}
          onLoad={onLoad}
          onBuffer={({ isBuffering }) => setIsLoading(isBuffering)}
          onEnd={() => {
            setIsPlaying(false);
            setProgress(1);
            setIsFinished(true);
          }}
          playsInline={true}
        />

        {/* Top Right Fullscreen Button */}
        {!isLoading && hasLoaded && (
          <TouchableOpacity
            style={styles.fullscreenButton}
            onPress={toggleFullscreen}
          >
            <Maximize size={16} color="white" />
          </TouchableOpacity>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
          </View>
        )}

        {/* Play Button Overlay */}
        {(!isPlaying || showControls) && !isLoading && (
          <TouchableOpacity
            style={styles.playOverlay}
            onPress={togglePlay}
          >
            {!isPlaying && (
              <View style={styles.playButtonCircle}>
                <Play size={32} color="white" fill="white" style={{ marginLeft: 4 }} />
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Minimal Overlay Controls */}
        {!isLoading && hasLoaded && (
          <View style={styles.minimalControls}>
            <View style={styles.minimalTimeBadge}>
              <Text style={styles.minimalTimeText}>
                {formatTime(progress * duration)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleMute}
              style={styles.minimalMuteButton}
              activeOpacity={0.7}
            >
              {isMuted ? (
                <VolumeX size={14} color="white" />
              ) : (
                <Volume2 size={14} color="white" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  playButtonCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 6,
    borderRadius: 20,
    zIndex: 30,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  minimalControls: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 25,
  },
  minimalTimeBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  minimalTimeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  minimalMuteButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default VideoPlayer;
