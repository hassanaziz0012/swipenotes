import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { db } from '../db/client';
import migrations from '../drizzle/migrations';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootLayoutNav() {
  const { user, isLoading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    'GoogleSans-Regular': require('../assets/fonts/Google_Sans/static/GoogleSans-Regular.ttf'),
    'GoogleSans-Bold': require('../assets/fonts/Google_Sans/static/GoogleSans-Bold.ttf'),
  });

  const { success: migrationSuccess, error: migrationError } = useMigrations(db, migrations);

  useEffect(() => {
    const isReady = (fontsLoaded || fontError) && (migrationSuccess || migrationError) && !authLoading;

    if (isReady) {
       SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, migrationSuccess, migrationError, authLoading]);

  useEffect(() => {
     if (authLoading) return;

     const inAuthGroup = segments[0] === '(auth)';
     
     if (!user && !inAuthGroup) {
         router.replace('/(auth)/login');
     } else if (user && inAuthGroup) {
         router.replace('/(tabs)');
     }
  }, [user, segments, authLoading]);

  if (!fontsLoaded && !fontError) return null;
  if (!migrationSuccess && !migrationError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
         <Stack.Screen name="(tabs)" />
         <Stack.Screen name="(auth)" />
      </Stack>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}
