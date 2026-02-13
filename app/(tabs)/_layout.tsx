import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { StudyButton } from '../../components/StudyButton';
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
                    headerShown: false,
                    tabBarIcon: ({ color }) => <Ionicons size={24} name="home" color={color} />,
                }}
            />
            <Tabs.Screen
                name="content"
                options={{
                    title: 'Content',
                    headerShown: false,
                    tabBarIcon: ({ color }) => <Ionicons size={24} name="folder" color={color} />,
                }}
            />
            <Tabs.Screen
                name="study"
                options={{
                    title: '',
                    headerShown: false,
                    tabBarButton: (props) => (
                        <StudyButton 
                            onPress={props.onPress as () => void} 
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="statistics"
                options={{
                    title: 'Statistics',
                    headerShown: false,
                    tabBarIcon: ({ color }) => <Ionicons size={24} name="stats-chart" color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    headerShown: false,
                    tabBarIcon: ({ color }) => <Ionicons size={24} name="settings" color={color} />,
                }}
            />
        </Tabs>
    );
}
