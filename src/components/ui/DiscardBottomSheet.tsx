import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';

interface DiscardBottomSheetProps {
    onDiscard: () => void;
    onCancel: () => void;
}

const DiscardBottomSheet = forwardRef<BottomSheetModal, DiscardBottomSheetProps>(
    ({ onDiscard, onCancel }, ref) => {
        const snapPoints = useMemo(() => ['32%'], []);

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop
                    {...props}
                    appearsOnIndex={0}
                    disappearsOnIndex={-1}
                    opacity={0.5}
                />
            ),
            []
        );

        return (
            <BottomSheetModal
                ref={ref}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                enablePanDownToClose
                handleIndicatorStyle={styles.indicator}
                backgroundStyle={styles.background}
            >
                <BottomSheetView style={styles.container}>
                    <Text style={styles.title}>Discard changes?</Text>
                    <Text style={styles.message}>
                        If you go back now, your progress will be lost.
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.discardButton}
                            onPress={onDiscard}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.discardText}>Discard</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onCancel}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.cancelText}>Keep Editing</Text>
                        </TouchableOpacity>
                    </View>
                </BottomSheetView>
            </BottomSheetModal>
        );
    }
);

const styles = StyleSheet.create({
    background: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    indicator: {
        backgroundColor: '#E5E7EB',
        width: 40,
    },
    container: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontFamily: 'Outfit-Bold',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        fontFamily: 'Outfit-Regular',
        color: '#6B7280',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    discardButton: {
        backgroundColor: '#EF4444',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
    },
    discardText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Outfit-Bold',
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
    },
    cancelText: {
        color: '#374151',
        fontSize: 16,
        fontFamily: 'Outfit-SemiBold',
    },
});

export default DiscardBottomSheet;
