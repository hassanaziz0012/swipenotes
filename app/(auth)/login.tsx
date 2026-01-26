import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components/Button';
import { Colors, FontFamily, Spacing, Typography } from '../../constants/styles';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            />
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            />
        </View>

        <Button 
             title="Login" 
             onPress={handleLogin} 
             loading={loading} 
             style={styles.marginTop}
        />

        <View style={styles.footer}>
             <Text style={styles.footerText}>Don't have an account? </Text>
             <Link href="/signup" asChild>
                <TouchableOpacity>
                     <Text style={styles.link}>Sign Up</Text>
                </TouchableOpacity>
             </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing['6'],
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: Spacing['8'],
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: Typography['4xl'].fontSize,
    color: '#000',
    marginBottom: Spacing['2'],
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.base.fontSize,
    color: '#000',
  },
  form: {
    gap: Spacing['4'],
  },
  inputGroup: {
    marginBottom: Spacing['4'],
  },
  label: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.sm.fontSize,
    color: '#000',
    marginBottom: Spacing['2'],
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: Spacing['2'],
    padding: Spacing['4'],
    fontSize: Typography.base.fontSize,
    fontFamily: FontFamily.regular,
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  marginTop: {
    marginTop: Spacing['2'],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing['4'],
  },
  footerText: {
    color: '#000',
    fontFamily: FontFamily.regular,
  },
  link: {
    color: Colors.primary.base,
    fontFamily: FontFamily.bold,
  },
});
