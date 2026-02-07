import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { SourceNoteList } from '../../components/SourceNoteList';
import { FontFamily, Spacing, Typography } from '../../constants/styles';
import { MAX_SOURCE_NOTES_WORDS } from '../../constants/validation';

export default function ContentScreen() {
  const router = useRouter();
  const [isExtractingAI, setIsExtractingAI] = useState(false);
  const [isExtractingManual, setIsExtractingManual] = useState(false);

  const validateDocument = async (uri: string): Promise<{ valid: boolean; error?: string }> => {
    try {
      const file = new File(uri);
      const content = await file.text();
      const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
      
      console.log('Word count:', wordCount);
      if (wordCount > MAX_SOURCE_NOTES_WORDS) {
        return {
          valid: false,
          error: `Document exceeds the maximum limit of ${MAX_SOURCE_NOTES_WORDS.toLocaleString()} words. Your document has ${wordCount.toLocaleString()} words.`
        };
      }
      
      return { valid: true };
    } catch (error) {
      console.error('Error validating document:', error);
      return { valid: false, error: 'Failed to read document for validation' };
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/markdown'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('Document picker canceled');
        return null;
      }

      const asset = result.assets[0];
      const validation = await validateDocument(asset.uri);
      
      if (!validation.valid) {
        Alert.alert('Validation Error', validation.error);
        return null;
      }

      console.log('Document selected:', asset);
      return asset;
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
      return null;
    }
  };

  const handleExtractWithAI = async () => {
    setIsExtractingAI(true);
    try {
      const file = await pickDocument();
      if (file) {
        router.push({
          pathname: '/view-file',
          params: { uri: file.uri, name: file.name, extractionMethod: 'ai' }
        });
      }
    } finally {
      setIsExtractingAI(false);
    }
  };

  const handleExtractManually = async () => {
    setIsExtractingManual(true);
    try {
      const file = await pickDocument();
      if (file) {
        router.push({
          pathname: '/view-file',
          params: { uri: file.uri, name: file.name }
        });
      }
    } finally {
      setIsExtractingManual(false);
    }
  };

  const handleViewAllCards = () => {
    router.push('/all-cards');
  };

  const handleViewReviewQueue = () => {
    router.push('/review-queue');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.buttonContainer}>
        <Button 
          title="Extract with AI" 
          onPress={handleExtractWithAI}
          loading={isExtractingAI}
          style={styles.button}
        />
        <Button 
          title="Extract Manually" 
          variant="secondary" 
          onPress={handleExtractManually}
          loading={isExtractingManual}
          style={styles.button}
        />
      </View>

      <SourceNoteList />

      {/* Cards Section */}
      <View style={styles.cardsSection}>
        <Text style={styles.sectionTitle}>Cards</Text>
        <Button
          title="View All Cards"
          variant="secondary"
          onPress={handleViewAllCards}
          style={styles.button}
        />
        <Button
          title="View Review Queue"
          variant="secondary"
          onPress={handleViewReviewQueue}
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: Spacing['6'],
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing['4'],
    marginBottom: Spacing['8'],
  },
  button: {
    width: '100%',
  },
  cardsSection: {
    marginTop: Spacing['8'],
    width: '100%',
    gap: Spacing['4'],
  },
  sectionTitle: {
    fontSize: Typography.lg.fontSize,
    fontFamily: FontFamily.bold,
    marginBottom: Spacing['4'],
    color: '#333',
  },
});
