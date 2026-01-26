import { eq } from 'drizzle-orm';
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../db/client';
import { users } from '../db/models/user';

type User = typeof users.$inferSelect;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (name: string, email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for persisted user
    const loadUser = async () => {
      try {
        const userId = await SecureStore.getItemAsync('user_id');
        if (userId) {
          const userRecord = await db.select().from(users).where(eq(users.id, parseInt(userId))).get();
          if (userRecord) {
            setUser(userRecord);
          } else {
             // If user ID exists in secure store but not in DB (cleared DB?), clear store
             await SecureStore.deleteItemAsync('user_id');
          }
        }
      } catch (e) {
        console.error("Failed to load user", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = async (email: string, pass: string) => {
    // In a real app, hash password to compare. Here we compare plain text as per user request (implied simple auth).
    
    const userRecord = await db.select().from(users).where(eq(users.email, email)).get();
    
    if (!userRecord) {
      throw new Error('Invalid email or password');
    }

    // Direct password comparison (Security Warning: In production use hashing!)
    if (userRecord.password !== pass) {
       throw new Error('Invalid email or password');
    }

    setUser(userRecord);
    await SecureStore.setItemAsync('user_id', userRecord.id.toString());
  };

  const signUp = async (name: string, email: string, pass: string) => {
    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    const result = await db.insert(users).values({
        fullName: name,
        email: email,
        password: pass, // Storing plain text password as per current scope, should be hashed in production
    }).returning();

    const newUser = result[0];
    setUser(newUser);
    await SecureStore.setItemAsync('user_id', newUser.id.toString());
  };

  const signOut = async () => {
    setUser(null);
    await SecureStore.deleteItemAsync('user_id');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
