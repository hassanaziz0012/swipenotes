import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';

export default function TagsScreen() {
    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Tags',
                    headerStyle: { backgroundColor: Colors.background.card },
                    headerTintColor: Colors.text.base,
                    headerTitleStyle: { fontFamily: FontFamily.regular },
                }}
            />
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <Ionicons name="pricetags-outline" size={64} color={Colors.text.subtle} />
                    <Text style={styles.title}>Tags</Text>
                    <Text style={styles.subtitle}>
                        Manage your card tags. Coming soon.
                    </Text>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.base,
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
});
