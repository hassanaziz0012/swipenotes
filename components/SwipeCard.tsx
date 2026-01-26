import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Colors, Typography } from '../constants/styles';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface Card {
  id: number;
  content: string;
  sourceNoteId: number;
  // Add other fields as needed based on db/models/card.ts
}

interface SwipeCardProps {
  card: Card;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  index: number; // 0 is top card
}

export default function SwipeCard({ card, onSwipeLeft, onSwipeRight, index }: SwipeCardProps) {
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const rotation = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onBegin(() => {
     
    })
    .onUpdate((event) => {
      translationX.value = event.translationX;
      translationY.value = event.translationY;
      rotation.value = interpolate(
        event.translationX,
        [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        [-10, 0, 10],
        Extrapolation.CLAMP
      );
    })
    .onFinalize((event) => {
        if (event.translationX > SWIPE_THRESHOLD) {
            // Swipe Right
            translationX.value = withTiming(SCREEN_WIDTH * 1.5, {}, () => {
                scheduleOnRN(onSwipeRight);
            });
        } else if (event.translationX < -SWIPE_THRESHOLD) {
             // Swipe Left
            translationX.value = withTiming(-SCREEN_WIDTH * 1.5, {}, () => {
                 scheduleOnRN(onSwipeLeft);
            });
        } else {
            // Spring back
            translationX.value = withSpring(0);
            translationY.value = withSpring(0);
            rotation.value = withSpring(0);
        }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translationX.value },
        { translateY: translationY.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  // Only enable gestures for the top card (index 0)
//   const composedGesture = Gesture.Exclusive(gesture);

  return (
    <View style={[styles.container, { zIndex: -index }]} pointerEvents="box-none">
        {index === 0 ? (
            <GestureDetector gesture={gesture}>
                <Animated.View style={[styles.card, animatedStyle]}>
                    <Text style={styles.text}>{card.content}</Text>
                </Animated.View>
            </GestureDetector>
        ) : (
             <View style={[styles.card, { transform: [{ scale: 1 - index * 0.05 }, { translateY: index * 10 }] }]}>
                <Text style={styles.text}>{card.content}</Text>
             </View>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 1.2,
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  text: {
    ...Typography.body,
    fontSize: 20,
    textAlign: 'center',
  },
});
