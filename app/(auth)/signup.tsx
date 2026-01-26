import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components/Button';
import { Colors, FontFamily, Spacing, Typography } from '../../constants/styles';
import { useAuth } from '../../context/AuthContext';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!name || !email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
    }
    setLoading(true);
    try {
      await signUp(name, email, password);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Sign Up Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            />
        </View>

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
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            />
        </View>

        <Button 
            title="Sign Up" 
            onPress={handleSignUp} 
            loading={loading} 
            style={styles.marginTop}
        />

        <View style={styles.footer}>
             <Text style={styles.footerText}>Already have an account? </Text>
             <Link href="/login" asChild>
                <TouchableOpacity>
                     <Text style={styles.link}>Login</Text>
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
