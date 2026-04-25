/**
 * Themed.tsx — Compatibility stub for legacy Expo boilerplate (two.tsx / EditScreenInfo).
 * Not used by any of the QuestHabit screens.
 */
import { Text as DefaultText, View as DefaultView } from 'react-native';
import { Colors } from '@/constants/Colors';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  _colorName: string
) {
  return props.light ?? Colors.textPrimary;
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = lightColor ?? Colors.textPrimary;
  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = lightColor ?? Colors.card;
  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
