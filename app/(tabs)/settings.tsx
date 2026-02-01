import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../../constants/styles';
import { useAuth } from '../../context/AuthContext';
import { updateUserSettings } from '../../db/services';

type Theme = 'light' | 'dark' | 'auto';

export default function SettingsScreen() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();

    // Local state for settings
    const [dailyCardLimit, setDailyCardLimit] = useState(user?.dailyCardLimit?.toString() ?? '20');
    const [notificationEnabled, setNotificationEnabled] = useState(user?.notificationEnabled ?? false);
    const [notificationTime, setNotificationTime] = useState(user?.notificationTime ?? '09:00');
    const [theme, setTheme] = useState<Theme>(user?.theme ?? 'auto');
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Convert time string to Date for picker
    const getTimeAsDate = useCallback((timeString: string) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    }, []);

    // Handle settings updates
    const handleUpdateSetting = useCallback(async (settings: Parameters<typeof updateUserSettings>[1]) => {
        if (!user) return;
        try {
            await updateUserSettings(user.id, settings);
            await refreshUser();
        } catch (error) {
            console.error('Failed to update setting:', error);
        }
    }, [user, refreshUser]);

    const handleDailyCardLimitChange = useCallback(async (value: string) => {
        setDailyCardLimit(value);
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue > 0) {
            await handleUpdateSetting({ dailyCardLimit: numValue });
        }
    }, [handleUpdateSetting]);

    const handleNotificationToggle = useCallback(async (value: boolean) => {
        setNotificationEnabled(value);
        await handleUpdateSetting({ notificationEnabled: value });
    }, [handleUpdateSetting]);

    const handleTimeChange = useCallback(async (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const hours = selectedDate.getHours().toString().padStart(2, '0');
            const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
            const timeString = `${hours}:${minutes}`;
            setNotificationTime(timeString);
            await handleUpdateSetting({ notificationTime: timeString });
        }
    }, [handleUpdateSetting]);

    const handleThemeChange = useCallback(async (newTheme: Theme) => {
        setTheme(newTheme);
        await handleUpdateSetting({ theme: newTheme });
    }, [handleUpdateSetting]);

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Preferences Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preferences</Text>
                <View style={styles.card}>
                    {/* Daily Card Limit */}
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="layers-outline" size={22} color={Colors.text.subtle} />
                            <Text style={styles.settingLabel}>Daily Card Limit</Text>
                        </View>
                        <TextInput
                            style={styles.numberInput}
                            value={dailyCardLimit}
                            onChangeText={handleDailyCardLimitChange}
                            keyboardType="number-pad"
                            maxLength={3}
                        />
                    </View>

                    <View style={styles.divider} />

                    {/* Notifications */}
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="notifications-outline" size={22} color={Colors.text.subtle} />
                            <Text style={styles.settingLabel}>Notifications</Text>
                        </View>
                        <Switch
                            value={notificationEnabled}
                            onValueChange={handleNotificationToggle}
                            trackColor={{ false: Colors.border.subtle, true: Colors.primary.light3 }}
                            thumbColor={notificationEnabled ? Colors.primary.base : '#f4f3f4'}
                        />
                    </View>

                    {notificationEnabled && (
                        <>
                            <View style={styles.divider} />
                            {/* Notification Time */}
                            <Pressable style={styles.settingRow} onPress={() => setShowTimePicker(true)}>
                                <View style={styles.settingLeft}>
                                    <Ionicons name="time-outline" size={22} color={Colors.text.subtle} />
                                    <Text style={styles.settingLabel}>Notification Time</Text>
                                </View>
                                <Text style={styles.settingValue}>{formatTime(notificationTime)}</Text>
                            </Pressable>
                        </>
                    )}

                    {showTimePicker && (
                        <DateTimePicker
                            value={getTimeAsDate(notificationTime)}
                            mode="time"
                            is24Hour={false}
                            display="default"
                            onChange={handleTimeChange}
                        />
                    )}

                    <View style={styles.divider} />

                    {/* Theme */}
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="color-palette-outline" size={22} color={Colors.text.subtle} />
                            <Text style={styles.settingLabel}>Theme</Text>
                        </View>
                        <View style={styles.themeSelector}>
                            {(['light', 'dark', 'auto'] as Theme[]).map((option) => (
                                <Pressable
                                    key={option}
                                    style={[
                                        styles.themeOption,
                                        theme === option && styles.themeOptionActive,
                                    ]}
                                    onPress={() => handleThemeChange(option)}
                                >
                                    <Text
                                        style={[
                                            styles.themeOptionText,
                                            theme === option && styles.themeOptionTextActive,
                                        ]}
                                    >
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* Management Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Management</Text>
                <View style={styles.card}>
                    {/* Projects */}
                    <Pressable
                        style={styles.settingRow}
                        onPress={() => router.push('/projects')}
                    >
                        <View style={styles.settingLeft}>
                            <Ionicons name="folder-outline" size={22} color={Colors.text.subtle} />
                            <Text style={styles.settingLabel}>Projects</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.text.subtle} />
                    </Pressable>

                    <View style={styles.divider} />

                    {/* Tags */}
                    <Pressable
                        style={styles.settingRow}
                        onPress={() => router.push('/tags')}
                    >
                        <View style={styles.settingLeft}>
                            <Ionicons name="pricetags-outline" size={22} color={Colors.text.subtle} />
                            <Text style={styles.settingLabel}>Tags</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.text.subtle} />
                    </Pressable>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.base,
    },
    contentContainer: {
        padding: Spacing['4'],
        paddingBottom: Spacing['8'],
    },
    section: {
        marginBottom: Spacing['6'],
    },
    sectionTitle: {
        fontSize: Typography.xs.fontSize,
        fontFamily: FontFamily.regular,
        color: Colors.text.subtle,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing['2'],
        marginLeft: Spacing['2'],
    },
    card: {
        backgroundColor: Colors.background.card,
        borderRadius: 12,
        paddingHorizontal: Spacing['4'],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing['4'],
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['3'],
    },
    settingLabel: {
        fontSize: Typography.base.fontSize,
        fontFamily: FontFamily.regular,
        color: Colors.text.base,
    },
    settingValue: {
        fontSize: Typography.sm.fontSize,
        fontFamily: FontFamily.regular,
        color: Colors.text.subtle,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border.subtle,
    },
    numberInput: {
        backgroundColor: Colors.background.base,
        borderRadius: 8,
        paddingHorizontal: Spacing['3'],
        paddingVertical: Spacing['2'],
        fontSize: Typography.base.fontSize,
        fontFamily: FontFamily.regular,
        color: Colors.text.base,
        textAlign: 'center',
        minWidth: 60,
    },
    themeSelector: {
        flexDirection: 'row',
        backgroundColor: Colors.background.base,
        borderRadius: 8,
        padding: 2,
    },
    themeOption: {
        paddingHorizontal: Spacing['3'],
        paddingVertical: Spacing['1.5'],
        borderRadius: 6,
    },
    themeOptionActive: {
        backgroundColor: Colors.background.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    themeOptionText: {
        fontSize: Typography.sm.fontSize,
        fontFamily: FontFamily.regular,
        color: Colors.text.subtle,
    },
    themeOptionTextActive: {
        color: Colors.text.base,
    },
});
