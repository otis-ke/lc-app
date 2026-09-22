import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, TextInputProps, View, FlatList } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fonts, radii, spacing } from '../theme/theme';

interface FieldWrapProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export function FieldWrap({ label, required, error, children }: FieldWrapProps) {
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
  return (
    <FieldWrap label={label} required={required} error={error}>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.textMuted}
        {...rest}
      />
    </FieldWrap>
  );
}

export function TextAreaField({ label, required, error, style, ...rest }: TextFieldProps) {
  return (
    <FieldWrap label={label} required={required} error={error}>
      <TextInput
        style={[styles.input, styles.textArea, style]}
        placeholderTextColor={colors.textMuted}
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
  const [open, setOpen] = useState(false);
  return (
    <FieldWrap label={label} required={required} error={error}>
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <View style={styles.selectRow}>
          <Text style={value ? styles.selectValue : styles.selectPlaceholder} numberOfLines={1}>
            {value || placeholder || 'Select...'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </View>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, item === value && styles.optionTextActive]}>{item}</Text>
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
  return (
    <FieldWrap label={label} required={required} error={error}>
      <View style={styles.chipRow}>
        {options.map((opt) => {
          const active = opt === value;
          return (
            <Pressable key={opt} onPress={() => onChange(opt)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
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
            <Pressable key={opt} onPress={() => toggle(opt)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
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
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
  },
  textArea: { minHeight: 100, paddingTop: 12 },
  error: { color: colors.danger, fontSize: 12.5, marginTop: 4, fontFamily: fonts.body },
  selectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectValue: { fontFamily: fonts.body, fontSize: 15, color: colors.text, flex: 1 },
  selectPlaceholder: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted, flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg, paddingBottom: spacing.xl },
  sheetTitle: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.text, marginBottom: spacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  optionText: { fontFamily: fonts.body, fontSize: 15.5, color: colors.text },
  optionTextActive: { fontFamily: fonts.bodySemiBold, color: colors.primary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text },
  chipTextActive: { color: '#fff' },
});
