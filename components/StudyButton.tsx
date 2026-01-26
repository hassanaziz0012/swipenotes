import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Colors } from '../constants/styles';

interface StudyButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
}

export const StudyButton: React.FC<StudyButtonProps> = ({ onPress, style }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
          style={[styles.button, style]}
          onPress={onPress}
          activeOpacity={0.8}
      >
        <Ionicons name="school" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    top: -20, // Lift it up slightly to sit nicely
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary.base,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary.base,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 4,
    borderColor: '#fff', // Optional: match background to make it look like it's cutting into the bar
  },
});
