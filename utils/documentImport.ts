import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Router } from 'expo-router';
import { Alert } from 'react-native';
import { MAX_SOURCE_NOTES_WORDS } from '../constants/validation';

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

export const pickDocument = async () => {
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

export const navigateToAIExtraction = async (router: Router) => {
  const file = await pickDocument();
  if (file) {
    router.push({
      pathname: '/view-file',
      params: { uri: file.uri, name: file.name, extractionMethod: 'ai' }
    });
  }
};

export const navigateToManualExtraction = async (router: Router) => {
  const file = await pickDocument();
  if (file) {
    router.push({
      pathname: '/view-file',
      params: { uri: file.uri, name: file.name }
    });
  }
};
