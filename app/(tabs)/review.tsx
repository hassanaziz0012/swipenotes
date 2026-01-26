import { StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '../../constants/styles';

export default function ReviewScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Review Session</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    title: {
        ...Typography['2xl'],
        color: Colors.primary.base,
    },
});
