import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { FontFamily, Typography } from '../../constants/styles';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#fff',
                },
                headerTintColor: '#000',
                headerTitleStyle: {
                    fontFamily: FontFamily.regular,
                    fontSize: Typography.xl.fontSize,
                },
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopColor: '#f4f4f4',
                },
                tabBarActiveTintColor: '#000',
                tabBarInactiveTintColor: '#888',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Ionicons size={24} name="home" color={color} />,
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: 'Add',
                    tabBarIcon: ({ color }) => <Ionicons size={24} name="add-circle" color={color} />,
                }}
            />
            <Tabs.Screen
                name="statistics"
                options={{
                    title: 'Statistics',
                    tabBarIcon: ({ color }) => <Ionicons size={24} name="stats-chart" color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color }) => <Ionicons size={24} name="settings" color={color} />,
                }}
            />
        </Tabs>
    );
}
