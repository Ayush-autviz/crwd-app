import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { CheckCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ChatMessage } from './types';
import { SharedCard } from './SharedCard';
import { PrimaryBlue } from '../../Constants/Colors';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const navigation = useNavigation<any>();
  const isMe = message.senderId === 'me';

  const handleMediaPress = () => {
    if (!message.mediaUrl) return;
    
    const isVideo = message.type === 'video' || message.mediaUrl.match(/\.(mp4|mov|webm)($|\?)/i);
    if (isVideo) {
      navigation.navigate('FullscreenVideo', { src: message.mediaUrl });
    } else {
      navigation.navigate('FullscreenImage', { src: message.mediaUrl });
    }
  };

  return (
    <View style={[styles.bubbleWrapper, isMe ? styles.alignRight : styles.alignLeft]}>
      {message.type === 'card' && message.cardData ? (
        <View style={styles.cardBubbleContainer}>
          {message.text ? (
            <View style={[styles.textContainer, isMe ? styles.myBubbleBg : styles.otherBubbleBg]}>
              <Text style={[styles.msgText, isMe ? styles.whiteText : styles.darkText]}>
                {message.text}
              </Text>
            </View>
          ) : null}
          <SharedCard cardData={message.cardData} isMe={isMe} />
        </View>
      ) : (
        <View
          style={[
            styles.bubbleContainer,
            message.text && !message.text.startsWith('http')
              ? (isMe ? styles.myBubbleBg : styles.otherBubbleBg)
              : styles.transparentBg
          ]}
        >
          {message.mediaUrl ? (
            <TouchableOpacity activeOpacity={0.9} onPress={handleMediaPress} style={styles.mediaWrap}>
              <Image source={{ uri: message.mediaUrl }} style={styles.mediaImage} />
              {(message.type === 'video' || message.mediaUrl.match(/\.(mp4|mov|webm)($|\?)/i)) && (
                <View style={styles.videoOverlayOverlay}>
                  <View style={styles.playButtonCircle}>
                    <Text style={styles.playIconText}>▶</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ) : null}

          {message.text && !message.text.startsWith('http') ? (
            <View style={styles.innerPadding}>
              <Text style={[styles.msgText, isMe ? styles.whiteText : styles.darkText]}>
                {message.text}
              </Text>
            </View>
          ) : null}

          {message.text && message.text.startsWith('http') ? (
            <View style={[styles.innerPadding, styles.linkBubbleBg]}>
              <Text style={styles.linkText} selectable={true}>
                {message.text}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Timestamp Row */}
      <View style={[styles.timestampRow, isMe ? styles.rowRight : styles.rowLeft]}>
        <Text style={styles.timestampText}>{message.timestamp}</Text>
        {isMe ? (
          <CheckCheck
            size={14}
            color={message.isRead ? PrimaryBlue : '#9CA3AF'}
            style={styles.checkIcon}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleWrapper: {
    marginVertical: 4,
    maxWidth: '82%',
  },
  alignRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  alignLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  cardBubbleContainer: {
    gap: 4,
  },
  bubbleContainer: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  myBubbleBg: {
    backgroundColor: PrimaryBlue,
  },
  otherBubbleBg: {
    backgroundColor: '#F3F4F6',
  },
  transparentBg: {
    backgroundColor: 'transparent',
  },
  linkBubbleBg: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  textContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  innerPadding: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  msgText: {
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
    lineHeight: 20,
  },
  linkText: {
    fontSize: 15,
    fontFamily: 'Outfit-Medium',
    color: PrimaryBlue,
    textDecorationLine: 'underline',
  },
  whiteText: {
    color: '#FFFFFF',
  },
  darkText: {
    color: '#111827',
  },
  mediaWrap: {
    width: 240,
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoOverlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3, // slightly offset triangle visually
  },
  playIconText: {
    color: '#FFFFFF',
    fontSize: 22,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
    gap: 4,
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  timestampText: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  checkIcon: {
    marginLeft: 2,
  },
});
