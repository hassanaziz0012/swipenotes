import React from 'react';
import { View } from 'react-native';
import { FilterItem } from './FilterItem';
import { FilterModal } from './FilterModal';

interface Project {
  id: number;
  name: string;
  color: string;
}

interface ProjectFilterProps {
  visible: boolean;
  onClose: () => void;
  availableProjects: Project[];
  selectedProjectId: number | null;
  onSelectProject: (projectId: number | null) => void;
}

export function ProjectFilter({
  visible,
  onClose,
  availableProjects,
  selectedProjectId,
  onSelectProject,
}: ProjectFilterProps) {
  const data = [{ id: -1, name: 'All Projects', color: 'transparent' }, ...availableProjects];

  return (
    <FilterModal
      visible={visible}
      onClose={onClose}
      title="Select Project"
      data={data}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => {
        const isSelected = (item.id === -1 && selectedProjectId === null) || item.id === selectedProjectId;
        
        return (
          <FilterItem
            label={item.name}
            selected={isSelected}
            icon={item.id !== -1 ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color }} /> : undefined}
            onPress={() => {
              onSelectProject(item.id === -1 ? null : item.id);
              onClose();
            }}
          />
        );
      }}
      scrollable={false}
    />
  );
}
