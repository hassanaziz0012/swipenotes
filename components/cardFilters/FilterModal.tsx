import React from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { Colors, Spacing } from '../../constants/styles';
import { ContentModal } from '../ContentModal';

interface FilterModalProps<T> {
  visible: boolean;
  onClose: () => void;
  title: string;
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (info: { item: T; index: number }) => React.ReactElement | null;
  headerRight?: React.ReactNode;
  footer?: React.ReactNode;
  ListFooterComponent?: React.ReactElement | null;
  scrollable?: boolean;
}

export function FilterModal<T>({
  visible,
  onClose,
  title,
  data,
  keyExtractor,
  renderItem,
  headerRight,
  footer,
  ListFooterComponent,
  scrollable = false,
}: FilterModalProps<T>) {
  return (
    <ContentModal
      visible={visible}
      onClose={onClose}
      title={title}
      headerRight={headerRight}
      scrollable={scrollable}
    >
      {data.length === 0 ? (
        <Text style={styles.emptyText}>No items available</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          style={{ flex: 1 }}
          renderItem={renderItem}
          ListFooterComponent={ListFooterComponent}
        />
      )}
      {footer}
    </ContentModal>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    padding: Spacing['4'],
    color: Colors.text.subtle,
    textAlign: 'center',
  },
});
