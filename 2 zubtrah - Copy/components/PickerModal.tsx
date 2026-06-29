import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WheelPicker } from './WheelPicker';
import { useThemeColors } from '@/hooks/useSettings';
import { radius, spacing } from '@/lib/theme';

export type PickerColumn = {
  label: string;
  items: { label: string; value: string | number }[];
  selectedValue: string | number;
  onValueChange: (v: string | number) => void;
  width?: number;
};

type PickerModalProps = {
  visible: boolean;
  title: string;
  columns: PickerColumn[];
  onDone: () => void;
  onCancel: () => void;
};

export function PickerModal({ visible, title, columns, onDone, onCancel }: PickerModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                paddingBottom: insets.bottom + spacing.xl,
              },
            ]}>
            {/* Header */}
            <View style={styles.header}>
              <Pressable
                onPress={onCancel}
                style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}>
                <Text style={[styles.headerBtnText, { color: colors.textMuted }]}>Cancel</Text>
              </Pressable>
              <Text style={[styles.title, { color: colors.textDark }]}>{title}</Text>
              <Pressable
                onPress={onDone}
                style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}>
                <Text style={[styles.headerBtnText, { color: colors.tealDark }]}>Done</Text>
              </Pressable>
            </View>

            {/* Columns */}
            <View
              style={[
                styles.columnsRow,
                { borderColor: colors.border },
              ]}>
              {columns.map((col) => (
                <View key={col.label} style={styles.colWrap}>
                  {col.label ? (
                    <Text style={[styles.colLabel, { color: colors.textMuted }]}>
                      {col.label}
                    </Text>
                  ) : null}
                  <WheelPicker
                    items={col.items}
                    selectedValue={col.selectedValue}
                    onValueChange={col.onValueChange}
                    width={col.width ?? 100}
                  />
                </View>
              ))}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000022',
  },
  headerBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  headerBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  columnsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: 0,
  },
  colWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  colLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
