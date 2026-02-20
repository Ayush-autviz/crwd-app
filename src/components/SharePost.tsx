import React, { forwardRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Clipboard, Share } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { Link as LinkIcon, Mail, MessageCircle, Camera, MessageSquare } from 'lucide-react-native';
import { useToast } from '../contexts/ToastContext';

interface SharePostProps {
    url: string;
    title: string;
    message: string;
    onClose?: () => void;
}

const SharePost = forwardRef<BottomSheetModal, SharePostProps>(({ url, title, message, onClose }, ref) => {
    const { showToast } = useToast();

    const snapPoints = useMemo(() => ['50%'], []);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    const handleCopyLink = () => {
        Clipboard.setString(url);
        showToast('Link copied to clipboard!');
        handleClose();
    };

    const handleClose = () => {
        onClose?.();
        (ref as any).current?.dismiss();
    };

    const handleEmailShare = async () => {
        const subject = title || 'Check this out';
        const body = message ? `${message}\n\n${url}` : url;
        const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        try {
            await Linking.openURL(emailUrl);
        } catch (err) {
            showToast('Could not open email app');
        }
        handleClose();
    };

    const handleMessengerShare = async () => {
        // Try web link for Messenger as fallback or direct scheme
        // fb-messenger://share?link=
        const messengerUrl = `fb-messenger://share?link=${encodeURIComponent(url)}`;
        // Fallback to generic share if scheme fails or just web
        try {
            await Linking.openURL(messengerUrl);
        } catch {
            // fallback to system share for now as specific messenger web url might not work well on mobile without app
            // But existing generic share is what we are replacing.
            // Let's try opening the web version
            Linking.openURL(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=YOUR_APP_ID`);
        }
        handleClose();
    };

    const handleLinkedInShare = async () => {
        const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        try {
            await Linking.openURL(shareUrl);
        } catch {
            showToast('Could not open LinkedIn');
        }
        handleClose();
    };

    const handleInstagramShare = async () => {
        // Instagram doesn't support direct link sharing via URL scheme easily without image
        // But we can copy to clipboard and open app
        const shareText = title ? `${title}\n\n${url}` : (message ? `${message}\n\n${url}` : url);
        Clipboard.setString(shareText);
        showToast('Copied to clipboard! Paste in Instagram.');

        const instagramUrl = `instagram://app`;
        try {
            await Linking.openURL(instagramUrl);
        } catch {
            Linking.openURL(`https://www.instagram.com/`);
        }
        handleClose();
    };

    const handleTextShare = async () => {
        const textBody = title ? `${title}\n${url}` : (message ? `${message}\n${url}` : url);
        const smsUrl = `sms:?&body=${encodeURIComponent(textBody)}`; // iOS might need '&', android '?'
        // react-native Linking creates platform specific if simpler
        try {
            await Linking.openURL(smsUrl);
        } catch {
            showToast('Could not open messages');
        }
        handleClose();
    };

    const shareOptions = [
        {
            id: 'copy',
            label: 'Copy Link',
            icon: LinkIcon,
            bgColor: '#DBEAFE', // bg-blue-100
            iconColor: '#2563EB', // text-blue-600
            onPress: handleCopyLink,
        },
        {
            id: 'messenger',
            label: 'Messenger',
            icon: MessageCircle,
            bgColor: '#DBEAFE', // bg-blue-100
            iconColor: '#2563EB', // text-blue-600
            onPress: handleMessengerShare,
        },
        {
            id: 'linkedin',
            label: 'LinkedIn',
            icon: LinkIcon,
            bgColor: '#F3F4F6', // bg-gray-100
            iconColor: '#111827', // text-gray-900
            onPress: handleLinkedInShare,
        },
        {
            id: 'email',
            label: 'Email',
            icon: Mail,
            bgColor: '#FEE2E2', // bg-red-100
            iconColor: '#DC2626', // text-red-600
            onPress: handleEmailShare,
        },
        {
            id: 'instagram',
            label: 'Instagram',
            icon: Camera,
            bgColor: '#FCE7F3', // bg-pink-100
            iconColor: '#111827', // text-gray-900
            onPress: handleInstagramShare,
        },
        {
            id: 'text',
            label: 'Text',
            icon: MessageSquare,
            bgColor: '#DCFCE7', // bg-green-100
            iconColor: '#16A34A', // text-green-600
            onPress: handleTextShare,
        },
    ];

    return (
        <BottomSheetModal
            ref={ref}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            enablePanDownToClose
            index={0}
            onDismiss={onClose}
        >
            <BottomSheetView style={styles.container}>
                <View style={styles.header}>
                    {/* <View style={styles.handle} /> */}
                    <Text style={styles.title}>Share</Text>
                    <Text style={styles.subtitle}>Share this with your friends and community</Text>
                </View>

                <View style={styles.gridContainer}>
                    {shareOptions.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={styles.optionItem}
                            onPress={option.onPress}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: option.bgColor }]}>
                                <option.icon size={24} color={option.iconColor} />
                            </View>
                            <Text style={styles.optionLabel}>{option.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </BottomSheetView>
        </BottomSheetModal>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
        width: '100%',
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#D1D5DB', // gray-300
        borderRadius: 2,
        marginBottom: 16,
        alignSelf: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827', // gray-900
        marginBottom: 4,
        textAlign: 'left',
    },
    subtitle: {
        fontSize: 12,
        color: '#4B5563', // gray-600
        textAlign: 'left',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    optionItem: {
        width: '30%', // roughly 3 columns
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    optionLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#111827',
        textAlign: 'center',
    },
});

export default SharePost;
