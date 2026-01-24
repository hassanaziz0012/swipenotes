import { Inter_400Regular, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { db } from '../db/client';
import migrations from '../drizzle/migrations';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  const { success: migrationSuccess, error: migrationError } = useMigrations(db, migrations);

  useEffect(() => {
    if (loaded || error) {
      if (migrationSuccess || migrationError) {
        SplashScreen.hideAsync();
      }
    }
  }, [loaded, error, migrationSuccess, migrationError]);

  if ((!loaded && !error) || (!migrationSuccess && !migrationError)) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
