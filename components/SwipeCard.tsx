import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Colors, FontFamily, Typography } from '../constants/styles';
import { type Project } from '../db/models/project';
import { TextMarkdownDisplay } from './TextMarkdownDisplay';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface Card {
  id: number;
  content: string;
  sourceNoteId: number;
  projectId?: number | null;
}

interface SwipeCardProps {
  card: Card;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  index: number; // 0 is top card
  project?: Project;
  sourceNoteTitle?: string;
  activeTranslationX?: SharedValue<number>;
}

export default function SwipeCard({ card, onSwipeLeft, onSwipeRight, index, project, sourceNoteTitle, activeTranslationX }: SwipeCardProps) {
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
      
      if (activeTranslationX) {
        activeTranslationX.value = event.translationX;
      }

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
        
        if (activeTranslationX) {
            activeTranslationX.value = withSpring(0);
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
                        {/* Pills Row */}
                        {(project || sourceNoteTitle) && (
                            <View style={styles.pillsContainer}>
                                {project && (
                                    <View style={styles.projectPill}>
                                        <View style={[styles.projectColorDot, { backgroundColor: project.color }]} />
                                        <Text style={styles.projectPillText} numberOfLines={1}>{project.name}</Text>
                                    </View>
                                )}
                                {sourceNoteTitle && (
                                    <View style={styles.sourcePill}>
                                        <Ionicons name="document-text-outline" size={14} color={Colors.text.subtle} />
                                        <Text style={styles.sourcePillText} numberOfLines={1}>{sourceNoteTitle}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                        <TextMarkdownDisplay>
                            {card.content}
                        </TextMarkdownDisplay>
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
                    {/* Pills Row */}
                    {(project || sourceNoteTitle) && (
                        <View style={styles.pillsContainer}>
                            {project && (
                                <View style={styles.projectPill}>
                                    <View style={[styles.projectColorDot, { backgroundColor: project.color }]} />
                                    <Text style={styles.projectPillText} numberOfLines={1}>{project.name}</Text>
                                </View>
                            )}
                            {sourceNoteTitle && (
                                <View style={styles.sourcePill}>
                                    <Ionicons name="document-text-outline" size={14} color={Colors.text.subtle} />
                                    <Text style={styles.sourcePillText} numberOfLines={1}>{sourceNoteTitle}</Text>
                                </View>
                            )}
                        </View>
                    )}
                    <TextMarkdownDisplay>
                         {card.content}
                    </TextMarkdownDisplay>
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
    height: SCREEN_WIDTH * 1.5,
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
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  projectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background.base,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  projectColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  projectPillText: {
    fontSize: Typography.xs.fontSize,
    fontFamily: FontFamily.regular,
    color: Colors.text.subtle,
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background.base,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    flexShrink: 1,
    maxWidth: '60%',
  },
  sourcePillText: {
    fontSize: Typography.xs.fontSize,
    fontFamily: FontFamily.regular,
    color: Colors.text.subtle,
    flexShrink: 1,
  },
});
