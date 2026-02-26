import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';

interface DeletePostBottomSheetProps {
    onDelete: () => void;
    onCancel: () => void;
    isDeleting?: boolean;
}

const DeletePostBottomSheet = forwardRef<BottomSheetModal, DeletePostBottomSheetProps>(
    ({ onDelete, onCancel, isDeleting = false }, ref) => {
        const snapPoints = useMemo(() => ['35%'], []);

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
                    <Text style={styles.title}>Delete Post?</Text>
                    <Text style={styles.message}>
                        This action cannot be undone. Are you sure you want to delete this post from the community?
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={onDelete}
                            activeOpacity={0.8}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.deleteText}>Delete</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onCancel}
                            activeOpacity={0.8}
                            disabled={isDeleting}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
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
        paddingHorizontal: 20,
        paddingBottom: 30,
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
    deleteButton: {
        backgroundColor: '#EF4444',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
        height: 50,
        justifyContent: 'center',
    },
    deleteText: {
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
        height: 50,
        justifyContent: 'center',
    },
    cancelText: {
        color: '#374151',
        fontSize: 16,
        fontFamily: 'Outfit-SemiBold',
    },
});

export default DeletePostBottomSheet;
