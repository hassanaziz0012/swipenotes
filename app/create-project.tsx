import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProjectForm } from '../components/ProjectForm';
import { Colors, FontFamily, Spacing } from '../constants/styles';
import { useAuth } from '../context/AuthContext';
import { createProject } from '../db/services';

export default function CreateProjectScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (data: { name: string; color: string }) => {
        if (!user) {
            Alert.alert('Error', 'You must be logged in to create a project');
            return;
        }

        try {
            setLoading(true);
            await createProject({
                name: data.name,
                color: data.color,
                userId: user.id,
                createdAt: new Date(),
            });
            router.back();
        } catch (error) {
            console.error('Failed to create project:', error);
            Alert.alert('Error', 'Failed to create project. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <Stack.Screen
                options={{
                    title: 'Create Project',
                    headerStyle: { backgroundColor: Colors.background.card },
                    headerTintColor: Colors.text.base,
                    headerTitleStyle: { fontFamily: FontFamily.regular },
                }}
            />
            <ProjectForm onSubmit={handleSubmit} loading={loading} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.base,
        padding: Spacing['4'],
    },
});
