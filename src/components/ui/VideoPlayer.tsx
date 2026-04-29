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

interface VideoPlayerProps {
  src: string;
  poster?: string;
  style?: any;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, style }) => {
  const videoRef = useRef<VideoRef>(null);
  const bgVideoRef = useRef<VideoRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const screenWidth = Dimensions.get('window').width;

  // Format time (e.g., 0:00)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const [isFinished, setIsFinished] = useState(false);

  const togglePlay = () => {
    if (isFinished || progress >= 0.99) {
      videoRef.current?.seek(0);
      bgVideoRef.current?.seek(0);
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

  const onSeek = (value: number) => {
    videoRef.current?.seek(value * duration);
    setProgress(value);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      videoRef.current?.dismissFullscreenPlayer();
    } else {
      videoRef.current?.presentFullscreenPlayer();
    }
    setIsFullscreen(!isFullscreen);
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
      // Horizontal video - match image post height
      return {
        height: 200,
        aspectRatio: naturalAspectRatio,
      };
    } else {
      // Vertical or Square video - allow more height
      return {
        maxHeight: 350,
        aspectRatio: naturalAspectRatio,
      };
    }
  }, [naturalAspectRatio]);

  return (
    <View style={[styles.container, containerStyle, style]}>
      {/* Background Blur Effect (Ambient) */}
      {/* Ambient background removed for actual video width */}
      {/* <View style={styles.ambientContainer}>
        <Video
          ref={bgVideoRef}
          source={{ uri: src }}
          style={styles.ambientVideo}
          resizeMode={ResizeMode.COVER}
          muted={true}
          paused={!isPlaying}
          repeat={true}
          blurRadius={Platform.OS === 'ios' ? 50 : 0}
        />
        <View style={styles.ambientOverlay} />
      </View> */}

      {/* Main Video */}
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
          volume={volume}
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

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
          </View>
        )}

        {/* Play Button Overlay (when paused or controls shown) */}
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

        {/* Controls Bar */}
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

        {/* Controls Bar Commented Out */}
        {/* {showControls && (
          <View style={styles.controlsBar}>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={progress}
                onSlidingComplete={onSeek}
                minimumTrackTintColor="#3B82F6"
                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                thumbTintColor="white"
              />
            </View>

            <View style={styles.bottomControls}>
              <View style={styles.leftControls}>
                <TouchableOpacity onPress={togglePlay} style={styles.controlButton}>
                  {isPlaying ? (
                    <Pause size={20} color="white" fill="white" />
                  ) : (
                    <Play size={20} color="white" fill="white" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleMute} style={styles.controlButton}>
                  {isMuted ? (
                    <VolumeX size={20} color="white" />
                  ) : (
                    <Volume2 size={20} color="white" />
                  )}
                </TouchableOpacity>

                <Text style={styles.timeText}>
                  {formatTime(progress * duration)} / {formatTime(duration)}
                </Text>
              </View>

              <TouchableOpacity onPress={toggleFullscreen} style={styles.controlButton}>
                {isFullscreen ? (
                  <Minimize size={20} color="white" />
                ) : (
                  <Maximize size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )} */}
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
  ambientContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    opacity: 0.5,
  },
  ambientVideo: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.2 }],
  },
  ambientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
  controlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    // backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 30,
  },
  sliderContainer: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
  },
  slider: {
    width: '166.6%',
    height: 20,
    alignSelf: 'center',
    transform: [{ scale: 0.6 }],
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -5,
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  controlButton: {
    padding: 5,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
    fontVariant: ['tabular-nums'],
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
