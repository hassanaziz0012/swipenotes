import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { type Tag } from '../db/models/tag';
import { deleteUnusedTags, findUnusedTags, getTagsForUser, getTagUsageCount } from '../utils/tagsCleanup';

// Fixed user ID for now (matching other screens)
const USER_ID = 1;

interface TagWithUsage extends Tag {
    usageCount: number | null; // null means loading
}

function TagListItem({ tag, userId }: { tag: TagWithUsage; userId: number }) {
    const [usageCount, setUsageCount] = useState<number | null>(tag.usageCount);

    useEffect(() => {
        if (usageCount === null) {
            getTagUsageCount(tag.id, userId)
                .then(count => setUsageCount(count))
                .catch(error => {
                    console.error('Failed to get usage count for tag:', tag.name, error);
                    setUsageCount(0);
                });
        }
    }, [tag.id, userId, usageCount]);

    return (
        <View style={styles.tagItem}>
            <Text style={styles.tagName}>{tag.name}</Text>
            {usageCount === null ? (
                <ActivityIndicator size="small" color={Colors.text.subtle} />
            ) : (
                <Text style={styles.usageCount}>{usageCount} {usageCount === 1 ? 'card' : 'cards'}</Text>
            )}
        </View>
    );
}

export default function TagsScreen() {
    const router = useRouter();
    const [tags, setTags] = useState<TagWithUsage[]>([]);
    const [loading, setLoading] = useState(true);
    const [unusedTags, setUnusedTags] = useState<Tag[]>([]);
    const [showUnusedModal, setShowUnusedModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = async () => {
        try {
            setLoading(true);
            const fetchedTags = await getTagsForUser(USER_ID);
            // Initialize with null usage counts (will be loaded individually)
            const tagsWithUsage: TagWithUsage[] = fetchedTags.map(tag => ({
                ...tag,
                usageCount: null,
            }));
            setTags(tagsWithUsage);
        } catch (error) {
            console.error('Failed to load tags:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFindUnusedTags = async () => {
        try {
            const unused = await findUnusedTags(USER_ID);
            setUnusedTags(unused);
            setShowUnusedModal(true);
        } catch (error) {
            console.error('Failed to find unused tags:', error);
        }
    };

    const handleDeleteUnusedTags = async () => {
        try {
            setIsDeleting(true);
            await deleteUnusedTags(USER_ID);
            setShowUnusedModal(false);
            setUnusedTags([]);
            // Reload tags list after deletion
            loadTags();
        } catch (error) {
            console.error('Failed to delete unused tags:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="pricetags-outline" size={64} color={Colors.text.subtle} />
            <Text style={styles.title}>No Tags</Text>
            <Text style={styles.subtitle}>
                Tags will appear here once you have cards with tags.
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Tags',
                    headerTitleAlign: 'center',
                    headerStyle: { backgroundColor: Colors.background.card },
                    headerTintColor: Colors.text.base,
                    headerTitleStyle: { fontFamily: FontFamily.regular },
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                            <Ionicons name="arrow-back" size={24} color={Colors.text.base} />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity onPress={handleFindUnusedTags} style={styles.headerButton}>
                            <Ionicons name="trash-outline" size={24} color={Colors.text.base} />
                        </TouchableOpacity>
                    ),
                }}
            />

            {/* Unused Tags Modal */}
            <Modal
                visible={showUnusedModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowUnusedModal(false)}
            >
                <Pressable 
                    style={styles.modalOverlay} 
                    onPress={() => setShowUnusedModal(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Unused Tags</Text>
                        
                        {unusedTags.length === 0 ? (
                            <Text style={styles.modalEmptyText}>No unused tags found.</Text>
                        ) : (
                            <>
                                <Text style={styles.modalSubtitle}>
                                    The following {unusedTags.length} tag{unusedTags.length !== 1 ? 's are' : ' is'} not associated with any cards:
                                </Text>
                                <FlatList
                                    data={unusedTags}
                                    keyExtractor={(item) => item.id.toString()}
                                    renderItem={({ item }) => (
                                        <View style={styles.unusedTagItem}>
                                            <Text style={styles.unusedTagName}>{item.name}</Text>
                                        </View>
                                    )}
                                    style={styles.unusedTagsScrollView}
                                    contentContainerStyle={styles.unusedTagsList}
                                    showsVerticalScrollIndicator={true}
                                    nestedScrollEnabled={true}
                                />
                                <Text style={styles.modalConfirmText}>
                                    Do you want to delete these tags?
                                </Text>
                            </>
                        )}
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={styles.modalCancelButton}
                                onPress={() => setShowUnusedModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            
                            {unusedTags.length > 0 && (
                                <TouchableOpacity 
                                    style={styles.modalDeleteButton}
                                    onPress={handleDeleteUnusedTags}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <ActivityIndicator size="small" color={Colors.background.card} />
                                    ) : (
                                        <Text style={styles.modalDeleteText}>Delete</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </Pressable>
            </Modal>
            <View style={styles.innerContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary.base} />
                    </View>
                ) : tags.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <FlatList
                        data={tags}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TagListItem tag={item} userId={USER_ID} />
                        )}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.base,
    },
    innerContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing['6'],
    },
    title: {
        fontSize: Typography['2xl'].fontSize,
        fontFamily: FontFamily.bold,
        color: Colors.text.base,
        marginTop: Spacing['4'],
        marginBottom: Spacing['2'],
    },
    subtitle: {
        fontSize: Typography.base.fontSize,
        fontFamily: FontFamily.regular,
        color: Colors.text.subtle,
        textAlign: 'center',
    },
    listContent: {
        padding: Spacing['4'],
    },
    tagItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.background.card,
        padding: Spacing['4'],
        marginBottom: Spacing['2'],
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border.subtle,
    },
    tagName: {
        fontSize: Typography.base.fontSize,
        fontFamily: FontFamily.regular,
        color: Colors.text.base,
    },
    usageCount: {
        fontSize: Typography.sm.fontSize,
        fontFamily: FontFamily.regular,
        color: Colors.text.subtle,
    },
    headerButton: {
        padding: Spacing['2'],
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: Colors.background.card,
        borderRadius: 12,
        padding: Spacing['5'],
        width: '85%',
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: Typography.xl.fontSize,
        fontFamily: FontFamily.bold,
        color: Colors.text.base,
        marginBottom: Spacing['3'],
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: Typography.sm.fontSize,
        fontFamily: FontFamily.regular,
        color: Colors.text.subtle,
        marginBottom: Spacing['3'],
    },
    modalEmptyText: {
        fontSize: Typography.base.fontSize,
        fontFamily: FontFamily.regular,
        color: Colors.text.subtle,
        textAlign: 'center',
        marginVertical: Spacing['4'],
    },
    modalConfirmText: {
        fontSize: Typography.base.fontSize,
        fontFamily: FontFamily.regular,
        color: Colors.text.base,
        marginTop: Spacing['3'],
    },
    unusedTagsScrollView: {
        maxHeight: 200,
        marginVertical: Spacing['2'],
    },
    unusedTagsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing['2'],
    },
    unusedTagItem: {
        backgroundColor: Colors.background.base,
        paddingHorizontal: Spacing['3'],
        paddingVertical: Spacing['1'],
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border.subtle,
    },
    unusedTagName: {
        fontSize: Typography.sm.fontSize,
        fontFamily: FontFamily.regular,
        color: Colors.text.base,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Spacing['3'],
        marginTop: Spacing['4'],
    },
    modalCancelButton: {
        paddingHorizontal: Spacing['4'],
        paddingVertical: Spacing['2'],
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border.subtle,
    },
    modalCancelText: {
        fontSize: Typography.base.fontSize,
        fontFamily: FontFamily.regular,
        color: Colors.text.base,
    },
    modalDeleteButton: {
        paddingHorizontal: Spacing['4'],
        paddingVertical: Spacing['2'],
        borderRadius: 8,
        backgroundColor: '#ef4444',
    },
    modalDeleteText: {
        fontSize: Typography.base.fontSize,
        fontFamily: FontFamily.bold,
        color: Colors.background.card,
    },
});
