import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '../../components/Button';
import { SourceNoteList } from '../../components/SourceNoteList';
import { Spacing } from '../../constants/styles';

export default function AddScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleExtractWithAI = () => {
    // Placeholder for AI extraction
    console.log('Extract with AI pressed');
  };

  const handleExtractManually = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/markdown'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('Document picker canceled');
        return;
      }

      console.log('Document selected:', result.assets[0]);
      
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        router.push({
          pathname: '/view-file',
          params: { uri: file.uri, name: file.name }
        });
      }

    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.buttonContainer}>
        <Button 
          title="Extract with AI" 
          onPress={handleExtractWithAI}
          style={styles.button}
        />
        <Button 
          title="Extract Manually" 
          variant="secondary" 
          onPress={handleExtractManually}
          loading={loading}
          style={styles.button}
        />
      </View>

      <SourceNoteList />
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
});
