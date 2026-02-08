
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '../constants/styles';
import { type Session } from '../db/models/session';

interface SessionDetailsProps {
    session: Session;
    containerStyle?: object;
}

export default function SessionDetails({ session, containerStyle }: SessionDetailsProps) {
    const [now, setNow] = useState(Date.now());

    // Update timer every minute to keep duration fresh
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const formatDuration = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${remainingMinutes}m`;
        }
        return `${minutes}m`;
    };

    // If session is ended, calculate duration based on start and end time
    // If session is active, calculate duration based on start and current time
    const durationMs = session.endedAt 
        ? new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime() 
        : now - new Date(session.startedAt).getTime();

    return (
        <View style={[styles.detailsContainer, containerStyle]}>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Started:</Text>
                <Text style={styles.detailValue}>
                    {new Date(session.startedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })} • {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailValue}>
                    {formatDuration(durationMs)}
                </Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Cards:</Text>
                <Text style={styles.detailValue}>{(session.cards || []).length}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cards Swiped:</Text>
                <Text style={styles.detailValue}>{session.cardsSwiped}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cards Left:</Text>
                <Text style={styles.detailValue}>
                    {Math.max(0, (session.cards || []).length - session.cardsSwiped)}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
        width: '100%',
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
