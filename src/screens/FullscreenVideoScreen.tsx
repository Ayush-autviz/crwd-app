import React, { useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import VideoFullscreen from '../components/ui/VideoFullscreen';
import { useNavigation, useRoute } from '@react-navigation/native';

const FullscreenVideoScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { 
    src, 
    user, 
    caption, 
    likes, 
    comments, 
    isLiked, 
    onLike, 
    onComment, 
    onShare, 
    onUserPress 
  } = route.params || {};

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  if (!src) return null;

  return (
    <View style={styles.container}>
      <VideoFullscreen
        isOpen={true}
        onClose={() => navigation.goBack()}
        src={src}
        user={user}
        caption={caption}
        likes={likes}
        comments={comments}
        isLiked={isLiked}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onUserPress={onUserPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});

export default FullscreenVideoScreen;
