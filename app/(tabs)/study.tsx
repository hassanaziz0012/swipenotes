import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography } from '../../constants/styles';
import { useAuth } from '../../context/AuthContext';
import { createSession } from '../../db/services';

export default function StudyScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [creatingSession, setCreatingSession] = useState(false);

    const handleStartSession = async () => {
        if (!user) return;
        
        setCreatingSession(true);
        try {
            const session = await createSession(user.id);
            router.push({
                pathname: "/swipe-session",
                params: { sessionId: session.id }
            });
        } catch (error) {
            console.error("Failed to create session:", error);
            // Optionally show an error alert here
        } finally {
            setCreatingSession(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Ready to Study?</Text>
                <Text style={styles.subtitle}>Start a new session to begin reviewing your cards.</Text>
                
                <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleStartSession}
                    disabled={creatingSession}
                >
                    {creatingSession ? (
                        <ActivityIndicator color={Colors.background.base} />
                    ) : (
                        <Text style={styles.buttonText}>Start New Session</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.base,
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        gap: 20,
    },
    title: {
        ...Typography['3xl'],
        color: Colors.text.base,
        textAlign: 'center',
    },
    subtitle: {
        ...Typography.body,
        color: Colors.text.subtle,
        textAlign: 'center',
        marginBottom: 20,
    },
    button: {
        backgroundColor: Colors.primary.base,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonText: {
        ...Typography.body,
        color: Colors.background.base,
        fontWeight: 'bold',
        fontSize: 18,
    },
});
