import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { useAuth } from '../context/AuthContext';
import { Project } from '../db/models/project';
import { getProjectsByUser } from '../db/services';

import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProjectsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProjects = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const userProjects = await getProjectsByUser(user.id);
            setProjects(userProjects);
        } catch (error) {
            console.error('Failed to fetch projects', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            fetchProjects();
        }, [fetchProjects])
    );

    const renderItem = ({ item }: { item: Project }) => (
        <TouchableOpacity style={styles.projectItem}>
            <View style={[styles.projectColor, { backgroundColor: item.color }]} />
            <Text style={styles.projectName}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.subtle} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Projects',
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
                        <TouchableOpacity onPress={() => router.push('/create-project')} style={styles.headerButton}>
                            <Ionicons name="add" size={24} color={Colors.text.base} />
                        </TouchableOpacity>
                    ),
                }}
            />
            
            {projects.length === 0 && !loading ? (
                <View style={styles.emptyState}>
                    <Ionicons name="folder-outline" size={64} color={Colors.text.subtle} />
                    <Text style={styles.title}>No Projects</Text>
                    <Text style={styles.subtitle}>
                        Create a project to organize your cards.
                    </Text>
                    <TouchableOpacity 
                        style={styles.createButton}
                        onPress={() => router.push('/create-project')}
                    >
                        <Text style={styles.createButtonText}>Create Project</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={projects}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.base,
    },
    headerButton: {
        padding: Spacing['2'],
    },
    listContent: {
        padding: Spacing['4'],
    },
    projectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background.card,
        padding: Spacing['4'],
        borderRadius: Spacing['3'],
        marginBottom: Spacing['3'],
        borderWidth: 1,
        borderColor: Colors.border.subtle,
    },
    projectColor: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: Spacing['3'],
    },
    projectName: {
        fontSize: Typography.base.fontSize,
        fontFamily: FontFamily.regular,
        color: Colors.text.base,
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
        marginBottom: Spacing['6'],
    },
    createButton: {
        backgroundColor: Colors.text.base,
        paddingHorizontal: Spacing['6'],
        paddingVertical: Spacing['3'],
        borderRadius: Spacing['2'],
    },
    createButtonText: {
        color: Colors.background.card,
        fontSize: Typography.base.fontSize,
        fontFamily: FontFamily.bold,
    }
});
