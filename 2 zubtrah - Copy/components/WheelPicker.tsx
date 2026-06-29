import { useRef, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useThemeColors } from '@/hooks/useSettings';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

type WheelPickerProps = {
  items: { label: string; value: string | number }[];
  selectedValue: string | number;
  onValueChange: (value: string | number) => void;
  width?: number;
};

export function WheelPicker({ items, selectedValue, onValueChange, width = 100 }: WheelPickerProps) {
  const colors = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = items.findIndex((i) => i.value === selectedValue);
  const safeIndex = selectedIndex < 0 ? 0 : selectedIndex;

  // Scroll to selected on mount and when value changes
  useEffect(() => {
    const offset = safeIndex * ITEM_HEIGHT;
    scrollRef.current?.scrollTo({ y: offset, animated: false });
  }, [safeIndex]);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    if (items[clamped] && items[clamped].value !== selectedValue) {
      onValueChange(items[clamped].value);
    }
  };

  // Padding items so selected item can be centered
  const padCount = Math.floor(VISIBLE_ITEMS / 2);
  const padItems = Array.from({ length: padCount }, (_, i) => ({ label: '', value: `__pad_start_${i}` }));
  const padItemsEnd = Array.from({ length: padCount }, (_, i) => ({ label: '', value: `__pad_end_${i}` }));
  const allItems = [...padItems, ...items, ...padItemsEnd];

  return (
    <View style={[styles.container, { width }]}>
      {/* Selection highlight bar */}
      <View
        style={[
          styles.selectionBar,
          { borderColor: colors.tealDark, top: ITEM_HEIGHT * padCount },
        ]}
        pointerEvents="none"
      />
      <ScrollView
        ref={scrollRef}
        style={{ height: PICKER_HEIGHT }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        // Web: also fire on scroll stop
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: 0 }}>
        {allItems.map((item, i) => {
          const isCenter = i - padCount === safeIndex;
          const isPad = String(item.value).startsWith('__pad');
          return (
            <Pressable
              key={`${item.value}-${i}`}
              style={styles.item}
              onPress={() => {
                if (!isPad) {
                  const realIndex = i - padCount;
                  onValueChange(items[realIndex].value);
                  scrollRef.current?.scrollTo({ y: realIndex * ITEM_HEIGHT, animated: true });
                }
              }}>
              <Text
                style={[
                  styles.itemText,
                  { color: isCenter ? colors.tealDark : colors.textMuted },
                  isCenter && styles.itemTextSelected,
                ]}
                numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    height: PICKER_HEIGHT,
  },
  selectionBar: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    backgroundColor: 'transparent',
    zIndex: 1,
    pointerEvents: 'none' as never,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  itemText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  itemTextSelected: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
  },
});
