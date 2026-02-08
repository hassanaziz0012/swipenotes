import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';
import { Button } from './Button';

const PROJECT_COLORS = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#EAB308', // Yellow
    '#84CC16', // Lime
    '#22C55E', // Green
    '#10B981', // Emerald
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
    '#0EA5E9', // Sky
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#A855F7', // Purple
    '#D946EF', // Fuchsia
    '#EC4899', // Pink
];

interface ProjectFormProps {
    onSubmit: (data: { name: string; color: string }) => void;
    initialValues?: { name: string; color: string };
    loading?: boolean;
}

export function ProjectForm({ onSubmit, initialValues, loading = false }: ProjectFormProps) {
    const [name, setName] = useState(initialValues?.name || '');
    const [selectedColor, setSelectedColor] = useState(initialValues?.color || PROJECT_COLORS[11]); // Default to Indigo
    
    // Simple validation, disable button if empty? 
    // Usually better to allow press and show error, or just disable. 
    // Let's rely on button disabled state for now if empty.
    const isValid = name.trim().length > 0;

    const handleSubmit = () => {
        if (isValid) {
            onSubmit({ name: name.trim(), color: selectedColor });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Project Name"
                    placeholderTextColor={Colors.text.subtle}
                    autoFocus
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Color</Text>
                <View style={styles.colorGrid}>
                    {PROJECT_COLORS.map((color) => (
                        <TouchableOpacity
                            key={color}
                            style={[
                                styles.colorCircle,
                                { backgroundColor: color },
                                selectedColor === color && styles.selectedColorCircle,
                            ]}
                            onPress={() => setSelectedColor(color)}
                        >
                            {selectedColor === color && (
                                <Ionicons name="checkmark" size={16} color="white" />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.footer}>
                <Button 
                    variant="primary" 
                    onPress={handleSubmit} 
                    loading={loading}
                    disabled={!isValid}
                    title="Create Project"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    section: {
        marginBottom: Spacing['6'],
    },
    label: {
        ...Typography.base,
        fontFamily: FontFamily.bold,
        color: Colors.text.base,
        marginBottom: Spacing['2'],
    },
    input: {
        ...Typography.base,
        backgroundColor: Colors.background.card,
        borderWidth: 1,
        borderColor: Colors.border.subtle,
        borderRadius: Spacing['2'],
        padding: Spacing['3'],
        fontFamily: FontFamily.regular,
        color: Colors.text.base,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing['3'],
    },
    colorCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedColorCircle: {
        borderWidth: 2,
        borderColor: Colors.text.base, // Dark ring around selected color for visibility
    },
    footer: {
        marginTop: 'auto',
        paddingTop: Spacing['4'],
    }
});
