import { Stack } from 'expo-router';
import { Colors } from '../../constants/styles';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary.base,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
            backgroundColor: '#ffffff'
        }
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Login',
           headerShown: false,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: 'Sign Up',
          headerShown: false, 
        }}
      />
    </Stack>
  );
}
