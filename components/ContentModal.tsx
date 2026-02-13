import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, FontFamily, Spacing, Typography } from '../constants/styles';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const FULL_HEIGHT = SCREEN_HEIGHT * 0.95;
const DEFAULT_HEIGHT = SCREEN_HEIGHT * 0.5;
const DRAG_THRESHOLD = 30;

interface ContentModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Optional right-side header action */
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  /** If true, wraps content in a ScrollView. Defaults to true */
  scrollable?: boolean;
}

export function ContentModal({
  visible,
  onClose,
  title,
  headerRight,
  children,
  scrollable = true,
}: ContentModalProps) {
  const heightAnim = useRef(new Animated.Value(DEFAULT_HEIGHT)).current;
  const isExpanded = useRef(false);

  // Reset height when modal opens
  useEffect(() => {
    if (visible) {
      isExpanded.current = false;
      heightAnim.setValue(DEFAULT_HEIGHT);
    }
  }, [visible]);

  const animateTo = useCallback((target: number) => {
    Animated.spring(heightAnim, {
      toValue: target,
      useNativeDriver: false,
      tension: 60,
      friction: 12,
    }).start();
  }, [heightAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderRelease: (_, gs) => {
        // Drag up (negative dy) → expand, drag down (positive dy) → collapse
        if (gs.dy < -DRAG_THRESHOLD && !isExpanded.current) {
          isExpanded.current = true;
          animateTo(FULL_HEIGHT);
        } else if (gs.dy > DRAG_THRESHOLD && isExpanded.current) {
          isExpanded.current = false;
          animateTo(DEFAULT_HEIGHT);
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.contentWrapper}
        >
          <Animated.View style={[styles.container, { height: heightAnim }]}>
            {/* Drag Handle */}
            <View style={styles.dragHandleArea} {...panResponder.panHandlers}>
              <View style={styles.dragHandle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Pressable
                onPress={onClose}
                style={styles.headerButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={Colors.text.base} />
              </Pressable>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              {headerRight ? (
                <View style={styles.headerButton}>{headerRight}</View>
              ) : (
                <View style={styles.headerButton} />
              )}
            </View>

            {/* Body */}
            {scrollable ? (
              <ScrollView
                keyboardShouldPersistTaps="always"
                contentContainerStyle={styles.bodyContent}
                bounces={false}
                style={styles.body}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={[styles.body, styles.bodyContent]}>{children}</View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  dragHandleArea: {
    width: '100%',
    alignItems: 'center',
    paddingTop: Spacing['4'],
    paddingBottom: Spacing['3'],
    cursor: 'row-resize' as any,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.lg.fontSize,
    fontFamily: FontFamily.bold,
    color: Colors.text.base,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
    padding: Spacing['4'],
    paddingBottom: Spacing['12'],
  },
});
