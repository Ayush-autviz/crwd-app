import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable, Share, Platform, Linking } from 'react-native';
import { Share2, MessageCircle } from 'lucide-react-native';
import { PrimaryBlue, PrimaryGrey, LightGrey } from '../Constants/Colors';
import { useToast } from '../contexts/ToastContext';

interface SocialShareProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  url?: string;
}

interface ShareButtonProps {
  icon: React.ElementType;
  label: string;
  color: string;
  onPress: () => void;
}

export default function SocialShare({ visible, onClose, title = '', message, url = '' }: SocialShareProps) {
  const { showToast } = useToast();

  const handleShare = async (platform?: string) => {
    try {
      let shareMessage = message;
      let shareUrl = url || '';

      if (platform) {
        // Platform specific sharing
        switch (platform) {
          case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url || '')}&quote=${encodeURIComponent(message)}`;
            await Linking.openURL(shareUrl);
            break;
          case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url || '')}`;
            await Linking.openURL(shareUrl);
            break;
          case 'linkedin':
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url || '')}&summary=${encodeURIComponent(message)}`;
            await Linking.openURL(shareUrl);
            break;
          case 'whatsapp':
            shareUrl = `whatsapp://send?text=${encodeURIComponent(message + (url ? '\n' + url : ''))}`;
            await Linking.openURL(shareUrl);
            break;
          case 'telegram':
            shareUrl = `tg://msg?text=${encodeURIComponent(message + (url ? '\n' + url : ''))}`;
            await Linking.openURL(shareUrl);
            break;
          case 'email':
            shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message + (url ? '\n\n' + url : ''))}`;
            await Linking.openURL(shareUrl);
            break;
          case 'sms':
            shareUrl = `sms:${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(message + (url ? '\n' + url : ''))}`;
            await Linking.openURL(shareUrl);
            break;
          default:
            // Use native share for default case
            const result = await Share.share({
              message: shareMessage + (url ? '\n' + url : ''),
              title: title,
              url: url, // iOS only
            });

            if (result.action === Share.sharedAction) {
              showToast('Shared successfully!');
              onClose();
            }
        }
        showToast('Opening share option...');
        onClose();
      } else {
        // Use native share dialog
        const result = await Share.share({
          message: shareMessage + (url ? '\n' + url : ''),
          title: title,
          url: url, // iOS only
        });

        if (result.action === Share.sharedAction) {
          showToast('Shared successfully!');
          onClose();
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      showToast('Error sharing content');
    }
  };

  const ShareButton = ({ icon: Icon, label, color, onPress }: ShareButtonProps) => (
    <TouchableOpacity 
      style={styles.shareButton} 
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Icon size={24} color="white" />
      </View>
      <Text style={styles.shareLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Share via</Text>
            <TouchableOpacity onPress={onClose}>
              <Share2 size={24} color={PrimaryGrey} />
            </TouchableOpacity>
          </View>

          <View style={styles.shareButtons}>
            <ShareButton 
              icon={Share2} 
              label="Facebook" 
              color="#1877F2"
              onPress={() => handleShare('facebook')}
            />
            <ShareButton 
              icon={Share2} 
              label="Twitter" 
              color="#1DA1F2"
              onPress={() => handleShare('twitter')}
            />
            <ShareButton 
              icon={Share2} 
              label="LinkedIn" 
              color="#0A66C2"
              onPress={() => handleShare('linkedin')}
            />
            <ShareButton 
              icon={Share2} 
              label="WhatsApp" 
              color="#25D366"
              onPress={() => handleShare('whatsapp')}
            />
            <ShareButton 
              icon={Share2} 
              label="Telegram" 
              color="#0088cc"
              onPress={() => handleShare('telegram')}
            />
            <ShareButton 
              icon={Share2} 
              label="Email" 
              color="#EA4335"
              onPress={() => handleShare('email')}
            />
            <ShareButton 
              icon={MessageCircle} 
              label="SMS" 
              color="#63B3ED"
              onPress={() => handleShare('sms')}
            />
            <ShareButton 
              icon={Share2} 
              label="More" 
              color={PrimaryBlue}
              onPress={() => handleShare()}
            />
          </View>

          <TouchableOpacity 
            style={styles.copyButton}
            onPress={() => {
              if (url) {
                Linking.openURL(url);
                showToast('Opening link...');
                onClose();
              }
            }}
          >
            <Text style={styles.copyButtonText}>Open Link</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  shareButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  shareButton: {
    alignItems: 'center',
    width: '21%',
    marginBottom: 10,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareLabel: {
    fontSize: 12,
    color: PrimaryGrey,
    textAlign: 'center',
  },
  copyButton: {
    backgroundColor: LightGrey,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  copyButtonText: {
    color: PrimaryGrey,
    fontWeight: '500',
  },
}); 