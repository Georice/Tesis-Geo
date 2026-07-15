import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Icon from './Icon';

interface IconLabelProps {
  icon: string;
  label?: string;
  size?: number;
  color?: string;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  gap?: number;
}

const IconLabel: React.FC<IconLabelProps> = ({
  icon, label, size, color, textStyle, style, gap = 6,
}) => {
  const flat = StyleSheet.flatten(textStyle) ?? {};
  const resolvedColor = color ?? (flat.color as string | undefined) ?? '#1a1a1a';
  const resolvedSize = size ?? (flat.fontSize ? Number(flat.fontSize) + 2 : 16);

  return (
    <View style={[styles.row, style]}>
      <Icon name={icon} size={resolvedSize} color={resolvedColor} />
      {label ? (
        <Text style={[textStyle, { marginLeft: gap }]}>{label}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default IconLabel;
