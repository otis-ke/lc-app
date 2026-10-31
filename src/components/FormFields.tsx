import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, TextInputProps, View, FlatList } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fonts, radii, spacing } from '../theme/theme';
import { useTheme } from '../contexts/ThemeContext';

interface FieldWrapProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export function FieldWrap({ label, required, error, children }: FieldWrapProps) {
  // The label sits on whatever surrounds the field (Screen or Card), both of
  // which stay pinned to the frozen dark default — so it stays frozen too,
  // rather than risk going unreadable against an unmoving background. The
  // input box itself (below) has its own visible surface, so it's safe to
  // follow the live theme regardless of what's behind it.
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

interface TextFieldProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
}

export function TextField({ label, required, error, style, ...rest }: TextFieldProps) {
  const { colors: theme } = useTheme();
  return (
    <FieldWrap label={label} required={required} error={error}>
      <TextInput
        style={[styles.input, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }, style]}
        placeholderTextColor={theme.textMuted}
        {...rest}
      />
    </FieldWrap>
  );
}

export function TextAreaField({ label, required, error, style, ...rest }: TextFieldProps) {
  const { colors: theme } = useTheme();
  return (
    <FieldWrap label={label} required={required} error={error}>
      <TextInput
        style={[styles.input, styles.textArea, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }, style]}
        placeholderTextColor={theme.textMuted}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        {...rest}
      />
    </FieldWrap>
  );
}

interface SelectFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  value: string;
  placeholder?: string;
  options: string[];
  onChange: (value: string) => void;
}

export function SelectField({ label, required, error, value, placeholder, options, onChange }: SelectFieldProps) {
  const { colors: theme } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <FieldWrap label={label} required={required} error={error}>
      <Pressable style={[styles.input, { borderColor: theme.border, backgroundColor: theme.surface }]} onPress={() => setOpen(true)}>
        <View style={styles.selectRow}>
          <Text style={[value ? styles.selectValue : styles.selectPlaceholder, { color: value ? theme.text : theme.textMuted }]} numberOfLines={1}>
            {value || placeholder || 'Select...'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={theme.textMuted} />
        </View>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, { borderBottomColor: theme.border }]}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, { color: theme.text }, item === value && styles.optionTextActive]}>{item}</Text>
                  {item === value ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </FieldWrap>
  );
}

interface RadioGroupProps {
  label: string;
  required?: boolean;
  error?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export function RadioGroup({ label, required, error, value, options, onChange }: RadioGroupProps) {
  const { colors: theme } = useTheme();
  return (
    <FieldWrap label={label} required={required} error={error}>
      <View style={styles.chipRow}>
        {options.map((opt) => {
          const active = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.surface }, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, { color: theme.text }, active && styles.chipTextActive]}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </FieldWrap>
  );
}

interface CheckboxGroupProps {
  label: string;
  required?: boolean;
  error?: string;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
}

export function CheckboxGroup({ label, required, error, values, options, onChange }: CheckboxGroupProps) {
  const { colors: theme } = useTheme();
  function toggle(opt: string) {
    if (values.includes(opt)) onChange(values.filter((v) => v !== opt));
    else onChange([...values, opt]);
  }
  return (
    <FieldWrap label={label} required={required} error={error}>
      <View style={styles.chipRow}>
        {options.map((opt) => {
          const active = values.includes(opt);
          return (
            <Pressable
              key={opt}
              onPress={() => toggle(opt)}
              style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.surface }, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, { color: theme.text }, active && styles.chipTextActive]}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </FieldWrap>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text, marginBottom: 6 },
  required: { color: colors.danger },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  textArea: { minHeight: 100, paddingTop: 12 },
  error: { color: colors.danger, fontSize: 12.5, marginTop: 4, fontFamily: fonts.body },
  selectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectValue: { fontFamily: fonts.body, fontSize: 15, flex: 1 },
  selectPlaceholder: { fontFamily: fonts.body, fontSize: 15, flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg, paddingBottom: spacing.xl },
  sheetTitle: { fontFamily: fonts.bodySemiBold, fontSize: 16, marginBottom: spacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  optionText: { fontFamily: fonts.body, fontSize: 15.5 },
  optionTextActive: { fontFamily: fonts.bodySemiBold, color: colors.primary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radii.pill, borderWidth: 1 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13.5 },
  chipTextActive: { color: '#fff' },
});
