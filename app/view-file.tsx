import { File as ExpoFile } from 'expo-file-system';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { TextMarkdownDisplay } from '../components/TextMarkdownDisplay';
import { Toast } from '../components/Toast';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { useAuth } from '../context/AuthContext';
import { cards } from '../db/models/card';
import { processTextExtraction } from '../utils/extraction';

export default function ViewFileScreen() {
  const { uri, name } = useLocalSearchParams<{ uri: string; name: string }>();
  const router = useRouter();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [fileSize, setFileSize] = useState<string>('');
  const [extractedCards, setExtractedCards] = useState<typeof cards.$inferSelect[]>([]);
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setToastMessage('User not authenticated');
      setToastVisible(true);
      setLoading(false);
      return;
    }

    const loadFile = async () => {
      if (!uri) return;
      try {
        const file = new ExpoFile(uri);
        const fileContent = await file.text();
        setContent(fileContent);
        setFileSize(formatSize(file.size));

        // Process extraction
        const results = await processTextExtraction(fileContent, user.id, name);
        setExtractedCards(results);

      } catch (err) {
        setToastMessage(err instanceof Error ? err.message : 'Failed to read file or extract cards');
        setToastVisible(true);
      } finally {
        setLoading(false);
      }
    };
    loadFile();
  }, [uri, user, authLoading]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: name || 'File Viewer',
          headerBackTitle: 'Back',
        }}
      />
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary.base} />
        </View>
      ) : (
        <>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer}>
            {/* Raw Content */}
            <Text style={styles.sectionHeader}>Raw Content</Text>
            <View style={[styles.markdownBox, { height: 350 }]}>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                indicatorStyle="black"
                nestedScrollEnabled={true}
              >
                <TextMarkdownDisplay>
                  {content}
                </TextMarkdownDisplay>
              </ScrollView>
            </View>

            <View style={styles.metaContainer}>
              <Text style={styles.metaText} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.metaSubText}>
                {fileSize}
              </Text>
            </View>

            {/* Cards Section */}
            {extractedCards.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Extracted Cards ({extractedCards.length})</Text>
                {extractedCards.map((card, index) => (
                  <View key={card.id || index} style={[styles.markdownBox, { height: 300, marginBottom: Spacing['4'] }]}>
                    <ScrollView
                      style={styles.scrollView}
                      contentContainerStyle={styles.scrollContent}
                      indicatorStyle="black"
                      nestedScrollEnabled={true}
                    >
                      <TextMarkdownDisplay>
                        {card.content}
                      </TextMarkdownDisplay>
                    </ScrollView>
                  </View>
                ))}
              </>
            )}

          </ScrollView>
          <View style={styles.footer}>
            <Button title="Confirm and Go Back" onPress={() => router.back()} />
          </View>
        </>
      )}
      
      <Toast 
        visible={toastVisible} 
        message={toastMessage} 
        onDismiss={() => setToastVisible(false)} 
      />
    </SafeAreaView>
  );
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: Spacing['4'],
    gap: Spacing['4'],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markdownBox: {
    height: '75%',
    backgroundColor: '#f9f9f9',
    borderRadius: Spacing['3'],
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing['4'],
  },
  metaContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  metaText: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.lg.fontSize,
    color: Colors.primary.dark3,
    marginBottom: Spacing['1'],
  },
  metaSubText: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.sm.fontSize,
    color: '#666',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: Typography.base.fontSize,
    fontFamily: FontFamily.regular,
  },
  sectionHeader: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.lg.fontSize,
    color: Colors.primary.dark2,
    marginTop: Spacing['2'],
  },
  footer: {
    padding: Spacing['4'],
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
    backgroundColor: '#fff',
  },
});
