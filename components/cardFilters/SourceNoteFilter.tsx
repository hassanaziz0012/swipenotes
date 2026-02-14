import React from 'react';
import { FilterItem } from './FilterItem';
import { FilterModal } from './FilterModal';

interface SourceNote {
  id: number;
  title: string;
}

interface SourceNoteFilterProps {
  visible: boolean;
  onClose: () => void;
  availableSourceNotes: SourceNote[];
  selectedNoteId: number | null;
  onSelectNote: (noteId: number | null) => void;
}

export function SourceNoteFilter({
  visible,
  onClose,
  availableSourceNotes,
  selectedNoteId,
  onSelectNote,
}: SourceNoteFilterProps) {
  const data = [{ id: -1, title: 'All Source Notes' }, ...availableSourceNotes];

  return (
    <FilterModal
      visible={visible}
      onClose={onClose}
      title="Select Source Note"
      data={data}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => {
        const isSelected = (item.id === -1 && selectedNoteId === null) || item.id === selectedNoteId;
        
        return (
          <FilterItem
            label={item.title}
            selected={isSelected}
            onPress={() => {
              onSelectNote(item.id === -1 ? null : item.id);
              onClose();
            }}
          />
        );
      }}
      scrollable={false}
    />
  );
}
