import { AuthTheme } from '@/constants/AuthTheme';
import { FontFamily } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';

interface AuthInputProps extends TextInputProps {
  label: string;
  secureToggle?: boolean;
}

export function AuthInput({ label, secureToggle, secureTextEntry, value, ...rest }: AuthInputProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const hasValue = !!(value && String(value).length > 0);
  const float = focused || hasValue;

  return (
    <View style={styles.wrap}>
      <View style={[styles.field, focused && styles.fieldFocused]}>
        <Text style={[styles.label, float && styles.labelFloat]}>{label}</Text>
        <TextInput
          {...rest}
          value={value}
          style={[styles.input, float && styles.inputFloat]}
          placeholder=""
          placeholderTextColor="transparent"
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
        />
        {secureToggle ? (
          <TouchableOpacity onPress={() => setHidden((v) => !v)} style={styles.eye} hitSlop={10}>
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={AuthTheme.inkMuted}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', marginBottom: 14 },
  field: {
    width: '100%',
    minHeight: 58,
    borderRadius: AuthTheme.radius,
    borderWidth: 1,
    borderColor: AuthTheme.inputBorder,
    backgroundColor: AuthTheme.white,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  fieldFocused: {
    borderColor: AuthTheme.inputFocus,
    borderWidth: 1.5,
  },
  label: {
    position: 'absolute',
    left: 18,
    top: 18,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: AuthTheme.inkMuted,
  },
  labelFloat: {
    top: 10,
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: AuthTheme.inkSecondary,
  },
  input: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    color: AuthTheme.ink,
    paddingTop: 8,
    paddingBottom: 10,
    paddingRight: 36,
  },
  inputFloat: {
    paddingTop: 18,
  },
  eye: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
});
