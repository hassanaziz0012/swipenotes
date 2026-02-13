import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { SourceNoteList } from '../../components/SourceNoteList';
import { FontFamily, Spacing, Typography } from '../../constants/styles';
import { navigateToAIExtraction, navigateToManualExtraction } from '../../utils/documentImport';

export default function ContentScreen() {
  const router = useRouter();
  const [isExtractingAI, setIsExtractingAI] = useState(false);
  const [isExtractingManual, setIsExtractingManual] = useState(false);

  const handleExtractWithAI = async () => {
    setIsExtractingAI(true);
    try {
      await navigateToAIExtraction(router);
    } finally {
      setIsExtractingAI(false);
    }
  };

  const handleExtractManually = async () => {
    setIsExtractingManual(true);
    try {
      await navigateToManualExtraction(router);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
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

      <SourceNoteList limit={5} />

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
    </SafeAreaView>
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
