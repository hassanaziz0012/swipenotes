import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DueCardsCalendar } from '../../components/DueCardsCalendar';
import SessionDetails from '../../components/SessionDetails';
import { Toast } from '../../components/Toast';
import { Colors, Spacing, Typography } from '../../constants/styles';
import { useAuth } from '../../context/AuthContext';
import { type Session } from '../../db/models/session';
import { createSession, getActiveSession } from '../../db/services';
import { registerForPushNotificationsAsync } from '../../utils/notifications';
import { retrieve_eligible_cards } from '../../utils/swipeSession';

export default function StudyScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [creatingSession, setCreatingSession] = useState(false);
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [loadingActiveSession, setLoadingActiveSession] = useState(true);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState("");   

    React.useEffect(() => {
        registerForPushNotificationsAsync();
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (!user) return;
            
            async function fetchActiveSession() {
                try {
                    const session = await getActiveSession(user!.id);
                    setActiveSession(session || null);
                } catch (error) {
                    console.error("Failed to fetch active session:", error);
                } finally {
                    setLoadingActiveSession(false);
                }
            }

            fetchActiveSession();
        }, [user])
    );

    const handleStartSession = async () => {
        if (!user) return;
        
        setCreatingSession(true);
        try {
            const { cards, limitReached } = await retrieve_eligible_cards(user.id);
            
            if (cards.length === 0) {
                setToastMessage("No cards to be reviewed right now");
                setToastVisible(true);
                return;
            }

            const session = await createSession(user.id, cards);
            
            router.push({
                pathname: "/swipe-session",
                params: { 
                    sessionId: session.id,
                    limitReached: limitReached ? "true" : "false" 
                }
            });
        } catch (error) {
            console.error("Failed to create session:", error);
            // Optionally show an error alert here
        } finally {
            setCreatingSession(false);
        }
    };

    const handleContinueSession = () => {
        if (!activeSession) return;
        
        router.push({
            pathname: "/swipe-session",
            params: { 
                sessionId: activeSession.id,
                // Assuming resumption implies cards are already in session or handled by swipe-session logic
                // If limitReached state needs to be precise, we might need to store it or re-calculate, 
                // but for continuing, false or existing state is usually fine. 
                limitReached: "false" 
            }
        });
    };
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={styles.title}>Ready to Study?</Text>
                    <Text style={styles.subtitle}>
                        {activeSession 
                            ? "You have an active session. Would you like to continue?" 
                            : "Start a new session to begin reviewing your cards."}
                    </Text>
                    
                    {loadingActiveSession ? (
                        <ActivityIndicator color={Colors.primary.base} />
                    ) : activeSession ? (
                        <View style={styles.sessionContainer}>
                            <TouchableOpacity 
                                style={styles.button} 
                                onPress={handleContinueSession}
                            >
                                <Text style={styles.buttonText}>Continue Session</Text>
                            </TouchableOpacity>

                            <SessionDetails session={activeSession} />
                        </View>
                    ) : (
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
                    )}
                </View>

                {/* Due Cards Calendar */}
                {user && (
                    <View style={styles.calendarSection}>
                        <DueCardsCalendar userId={user.id} />
                    </View>
                )}
            </ScrollView>
            <Toast 
                visible={toastVisible} 
                message={toastMessage} 
                onDismiss={() => setToastVisible(false)}
            />
        </SafeAreaView>
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.base,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        gap: 20,
        width: '100%',
    },
    calendarSection: {
        marginTop: Spacing['8'],
        width: '100%',
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
    sessionContainer: {
        width: '100%',
        gap: 20,
    },
    detailsContainer: {
        backgroundColor: Colors.background.card,
        padding: 16,
        borderRadius: 12,
        gap: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2.22,
        elevation: 3,
        borderWidth: 1,
        borderColor: Colors.border.subtle,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        ...Typography.body,
        color: Colors.text.subtle,
        fontSize: 14,
    },
    detailValue: {
        ...Typography.body,
        color: Colors.text.base,
        fontWeight: 'bold',
        fontSize: 14,
    },
});
