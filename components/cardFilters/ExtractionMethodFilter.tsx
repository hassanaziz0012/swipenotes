import React from 'react';
import { EXTRACTION_METHODS, ExtractionMethod } from '../../utils/extraction';
import { FilterItem } from './FilterItem';
import { FilterModal } from './FilterModal';

interface ExtractionMethodFilterProps {
  visible: boolean;
  onClose: () => void;
  selectedMethod: ExtractionMethod | null;
  onSelectMethod: (method: ExtractionMethod | null) => void;
}

export function ExtractionMethodFilter({
  visible,
  onClose,
  selectedMethod,
  onSelectMethod,
}: ExtractionMethodFilterProps) {
  const data = [{ label: 'All Methods', value: null as ExtractionMethod | null }, ...EXTRACTION_METHODS];

  return (
    <FilterModal
      visible={visible}
      onClose={onClose}
      title="Select Extraction Method"
      data={data}
      keyExtractor={(item) => item.value || 'all'}
      renderItem={({ item }) => (
        <FilterItem
          label={item.label}
          selected={selectedMethod === item.value}
          onPress={() => {
            onSelectMethod(item.value);
            onClose();
          }}
        />
      )}
    />
  );
}
