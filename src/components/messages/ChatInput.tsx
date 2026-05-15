import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Keyboard, Image, ScrollView, Text } from 'react-native';
import { Image as ImageIcon, Camera, Send, X } from 'lucide-react-native';
import * as ImagePicker from 'react-native-image-picker';
import Video from 'react-native-video';
import { PrimaryBlue } from '../../Constants/Colors';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (images?: any[]) => void;
}

export function ChatInput({ value, onChange, onSend }: ChatInputProps) {
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);

  const handleSendText = () => {
    if (!value.trim() && selectedFiles.length === 0) return;
    onSend(selectedFiles);
    setSelectedFiles([]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGalleryPress = () => {
    Keyboard.dismiss();
    const options: ImagePicker.ImageLibraryOptions = {
      mediaType: 'mixed',
      selectionLimit: 1,
      includeBase64: false,
      quality: 0.8,
    };

    ImagePicker.launchImageLibrary(options, response => {
      if (response.didCancel || response.errorMessage) {
        return;
      }
      if (response.assets) {
        const newFiles = response.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type || (asset.uri?.match(/\.(mp4|mov|webm)$/i) ? 'video/mp4' : 'image/jpeg'),
          name: asset.fileName || asset.uri?.split('/').pop() || 'upload.jpg',
        })).filter(f => !!f.uri);

        setSelectedFiles(newFiles);
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
          setSelectedFiles([fileObj]);
        }
      }
    });
  };

  const hasContent = value.trim().length > 0 || selectedFiles.length > 0;

  return (
    <View style={styles.outerContainer}>
      {selectedFiles.length > 0 && (
        <View style={styles.previewContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewScrollContent}>
            {selectedFiles.map((file, index) => {
              const isVideo = file.type?.startsWith('video/');
              return (
                <View key={`${file.uri}-${index}`} style={styles.previewItemWrapper}>
                  <View style={styles.previewItem}>
                    {isVideo ? (
                      <Video
                        source={{ uri: file.uri }}
                        style={styles.previewImage}
                        paused={true}
                        muted={true}
                        resizeMode="cover"
                      />
                    ) : (
                      <Image source={{ uri: file.uri }} style={styles.previewImage} />
                    )}

                    {isVideo && (
                      <View style={styles.videoBadge}>
                        <Text style={styles.videoBadgeText}>VIDEO</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => removeFile(index)}
                    style={styles.removeButton}
                    activeOpacity={0.7}
                  >
                    <X size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

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
          style={[styles.sendButton, !hasContent ? styles.sendDisabled : null]}
          disabled={!hasContent}
          activeOpacity={0.8}
        >
          <Send size={18} color="#FFFFFF" style={styles.sendIconOffset} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  previewContainer: {
    height: 90,
    backgroundColor: '#FFFFFF',
  },
  previewScrollContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 10,
  },
  previewItemWrapper: {
    position: 'relative',
    width: 66,
    height: 66,
    marginRight: 6, // space for the X button overlap
    marginTop: 6,
    borderRadius: 12   // space for the X button overlap
  },
  previewItem: {
    width: 66,
    height: 66,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#111827',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Outfit-Bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
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
