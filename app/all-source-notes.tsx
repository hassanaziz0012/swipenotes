import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SourceNoteList } from '../components/SourceNoteList';
import { Spacing } from '../constants/styles';

export default function AllSourceNotesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'All Source Notes' }} />
      <SourceNoteList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing['4'],
    backgroundColor: '#fff',
  },
});
