import React from 'react';
import { Text, TextProps } from 'react-native';
import { fonts } from '../theme/theme';

// Playfair Display (our heading font) renders "&" as a decorative
// calligraphic swash — very different from the plain ampersand in Outfit
// (our body font). Headings built from plain strings (menu items, program
// titles, etc.) look inconsistent with the ones we hand-authored with a
// nested <Text> override, so this component does that split automatically:
// every "&" in the string renders in the body font while the rest of the
// heading keeps its heading font, matching the plain-paragraph look
// everywhere a heading contains one.
interface Props extends TextProps {
  children: string;
}

export function HeadingText({ children, style, ...rest }: Props) {
  const parts = children.split('&');
  return (
    <Text style={style} {...rest}>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 ? <Text style={{ fontFamily: fonts.body }}>&</Text> : null}
        </React.Fragment>
      ))}
    </Text>
  );
}
