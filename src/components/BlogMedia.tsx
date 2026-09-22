import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/theme';

interface Props {
  source: number | { uri: string };
  style?: StyleProp<ViewStyle>;
}

// Matches the website's .post-media / .reader-media treatment exactly
// (blog.css): posts come from many different cameras/crops, so a hard
// contentFit="cover" would slice off parts of portrait/panoramic/square
// shots. Instead the site shows the FULL photo via a blurred, oversized
// copy filling the frame behind it, so every card is the same fixed frame
// size but nothing in the original photo ever gets cropped away.
//
// Uses expo-image (not RN's Image) so remote photos are cached to disk —
// once a post has loaded once, its photo re-renders instantly next time,
// online or off, instead of re-downloading.
export function BlogMedia({ source, style }: Props) {
  return (
    <View style={[styles.frame, style]}>
      <Image
        source={source}
        style={styles.bg}
        contentFit="cover"
        blurRadius={18}
        cachePolicy="memory-disk"
        transition={200}
      />
      <BlurView intensity={35} tint="dark" blurMethod="dimezisBlurViewSdk31Plus" style={StyleSheet.absoluteFill} />
      <Image source={source} style={styles.fg} contentFit="contain" cachePolicy="memory-disk" transition={200} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: colors.ink },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  fg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
