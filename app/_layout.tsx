import { Inter_400Regular, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { db } from '../db/client';
import migrations from '../drizzle/migrations';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
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
    <Stack screenOptions={{ headerShown: false }}>
       <Stack.Screen name="(tabs)" />
       <Stack.Screen name="(auth)" />
    </Stack>
  );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}
