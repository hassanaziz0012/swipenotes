import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Colors } from '../../constants/styles';
import { StatisticCard } from './StatisticCard';

interface DailySwipesCountCardProps {
  count: number;
  style?: StyleProp<ViewStyle>;
}

export function DailySwipesCountCard({ count, style }: DailySwipesCountCardProps) {
  return (
    <StatisticCard
      title="Cards Swiped Today"
      count={count}
      iconName="today"
      iconColor={Colors.primary.base}
      style={style}
    />
  );
}
