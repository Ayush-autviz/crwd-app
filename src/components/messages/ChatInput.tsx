import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Keyboard } from 'react-native';
import { Image as ImageIcon, Camera, Send } from 'lucide-react-native';
import * as ImagePicker from 'react-native-image-picker';
import { PrimaryBlue } from '../../Constants/Colors';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (images?: any[]) => void;
}

export function ChatInput({ value, onChange, onSend }: ChatInputProps) {
  const handleSendText = () => {
    if (!value.trim()) return;
    onSend();
  };

  const handleGalleryPress = () => {
    Keyboard.dismiss();
    const options: ImagePicker.ImageLibraryOptions = {
      mediaType: 'mixed',
      includeBase64: false,
      quality: 0.8,
    };

    ImagePicker.launchImageLibrary(options, response => {
      if (response.didCancel || response.errorMessage) {
        return;
      }
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          const fileObj = {
            uri: asset.uri,
            type: asset.type || (asset.uri.match(/\.(mp4|mov|webm)$/i) ? 'video/mp4' : 'image/jpeg'),
            name: asset.fileName || asset.uri.split('/').pop() || 'upload.jpg',
          };
          onSend([fileObj]);
        }
      }
    });
  };

  const handleCameraPress = () => {
    Keyboard.dismiss();
    const options: ImagePicker.CameraOptions = {
      mediaType: 'photo',
      includeBase64: false,
      quality: 0.8,
    };

    ImagePicker.launchCamera(options, response => {
      if (response.didCancel || response.errorMessage) {
        return;
      }
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          const fileObj = {
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || asset.uri.split('/').pop() || 'capture.jpg',
          };
          onSend([fileObj]);
        }
      }
    });
  };

  return (
    <View style={styles.inputContainer}>
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity onPress={handleGalleryPress} style={styles.iconButton} activeOpacity={0.7}>
          <ImageIcon size={24} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCameraPress} style={styles.iconButton} activeOpacity={0.7}>
          <Camera size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.textInputWrapper}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChange}
          multiline={true}
          maxHeight={100}
          returnKeyType="default"
        />
      </View>

      <TouchableOpacity
        onPress={handleSendText}
        style={[styles.sendButton, !value.trim() ? styles.sendDisabled : null]}
        disabled={!value.trim()}
        activeOpacity={0.8}
      >
        <Send size={18} color="#FFFFFF" style={styles.sendIconOffset} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    gap: 4,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },
  textInputWrapper: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 15,
    fontFamily: 'Outfit-Medium',
    color: '#111827',
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PrimaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendDisabled: {
    opacity: 0.5,
  },
  sendIconOffset: {
    marginLeft: 2, // optical balance for send arrow
  },
});
