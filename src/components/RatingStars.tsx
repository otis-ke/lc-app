import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fonts } from '../theme/theme';

interface Props {
  rating: number; // 0-5, can be fractional for display mode
  size?: number;
  onChange?: (value: number) => void; // presence makes it interactive
  showValue?: boolean;
  count?: number;
}

export function RatingStars({ rating, size = 16, onChange, showValue, count }: Props) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={styles.row}>
      {stars.map((n) => {
        const filled = rating >= n - 0.5;
        const StarComponent = onChange ? Pressable : View;
        return (
          <StarComponent key={n} onPress={onChange ? () => onChange(n) : undefined} hitSlop={4}>
            <Ionicons name={filled ? 'star' : 'star-outline'} size={size} color={colors.gold} />
          </StarComponent>
        );
      })}
      {showValue ? (
        <Text style={styles.value}>
          {rating.toFixed(1)}
          {typeof count === 'number' ? ` (${count})` : ''}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  value: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.textMuted, marginLeft: 4 },
});
