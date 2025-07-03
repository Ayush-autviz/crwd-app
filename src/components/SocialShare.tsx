import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable, Share, Platform, Linking } from 'react-native';
import { Share2, MessageCircle, Mail, Phone, Globe, ArrowDown } from 'lucide-react-native';
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

const SHARE_OPTIONS = [
  {
    label: 'Facebook',
    color: '#1877F2',
    icon: Share2,
    platform: 'facebook'
  },
  {
    label: 'Twitter',
    color: '#1DA1F2',
    icon: Share2,
    platform: 'twitter'
  },
  {
    label: 'LinkedIn',
    color: '#0A66C2',
    icon: Share2,
    platform: 'linkedin'
  },
  {
    label: 'WhatsApp',
    color: '#25D366',
    icon: MessageCircle,
    platform: 'whatsapp'
  },
  {
    label: 'Telegram',
    color: '#0088cc',
    icon: MessageCircle,
    platform: 'telegram'
  },
  {
    label: 'Email',
    color: '#EA4335',
    icon: Mail,
    platform: 'email'
  },
  {
    label: 'SMS',
    color: '#63B3ED',
    icon: Phone,
    platform: 'sms'
  },
  {
    label: 'More',
    color: PrimaryBlue,
    icon: Share2,
    platform: undefined
  }
];

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
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Icon size={24} color="white" strokeWidth={2.5} />
      </View>
      <Text style={styles.shareLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.content}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>Share via</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ArrowDown size={20} color={PrimaryGrey} />
            </TouchableOpacity>
          </View>

          <View style={styles.shareButtons}>
            {SHARE_OPTIONS.map((option, index) => (
              <ShareButton 
                key={index}
                icon={option.icon}
                label={option.label}
                color={option.color}
                onPress={() => handleShare(option.platform)}
              />
            ))}
          </View>

          {url && (
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={() => {
                Linking.openURL(url);
                showToast('Opening link...');
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Globe size={20} color={PrimaryGrey} style={styles.linkIcon} />
              <Text style={styles.copyButtonText}>Open Link</Text>
            </TouchableOpacity>
          )}
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
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: LightGrey,
  },
  shareButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  shareButton: {
    alignItems: 'center',
    width: '25%',
    marginBottom: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shareLabel: {
    fontSize: 12,
    color: '#4a4a4a',
    textAlign: 'center',
    fontWeight: '500',
  },
  copyButton: {
    backgroundColor: LightGrey,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  linkIcon: {
    marginRight: 8,
  },
  copyButtonText: {
    color: '#1a1a1a',
    fontWeight: '600',
    fontSize: 16,
  },
}); 