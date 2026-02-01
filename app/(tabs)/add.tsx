import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { SourceNoteList } from '../../components/SourceNoteList';
import { FontFamily, Spacing, Typography } from '../../constants/styles';

export default function AddScreen() {
  const router = useRouter();
  const [isExtractingAI, setIsExtractingAI] = useState(false);
  const [isExtractingManual, setIsExtractingManual] = useState(false);

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

      console.log('Document selected:', result.assets[0]);
      return result.assets[0];
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
