import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Markdown from 'react-native-markdown-display';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';

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
    .activeOffsetX([-10, 10])
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

  return (
    <View style={[styles.container, { zIndex: -index }]} pointerEvents="box-none">
        {index === 0 ? (
            <GestureDetector gesture={gesture}>
                <Animated.View style={[styles.card, animatedStyle]}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={true}
                    >
                        <Markdown style={markdownStyles}>
                            {card.content}
                        </Markdown>
                    </ScrollView>
                </Animated.View>
            </GestureDetector>
        ) : (
             <View style={[styles.card, { transform: [{ scale: 1 - index * 0.05 }, { translateY: index * 10 }] }]}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    scrollEnabled={false}
                >
                    <Markdown style={markdownStyles}>
                         {card.content}
                    </Markdown>
                </ScrollView>
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
    overflow: 'hidden',
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
  scrollView: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center', 
  },
  // text style is no longer needed for the main content but keeping it just in case or we can remove it.
  // I will rely on markdownStyles.
});

const markdownStyles = {
  body: {
    ...Typography.base,
    color: Colors.text.base,
    fontFamily: FontFamily.regular,
  },
  heading1: {
    ...Typography.xl,
    color: Colors.text.base,
    marginBottom: Spacing['2.5'],
    fontFamily: FontFamily.bold,
  },
  heading2: { 
    ...Typography.lg,
    color: Colors.text.base,
    marginBottom: Spacing['2.5'],
    fontFamily: FontFamily.bold,
  },
};
