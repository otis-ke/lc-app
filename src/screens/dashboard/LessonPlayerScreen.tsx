import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRoute, RouteProp } from '@react-navigation/native';
import { colors, fonts, spacing, typography } from '../../theme/theme';
import type { DashboardStackParamList } from '../../navigation/types';

type Rt = RouteProp<DashboardStackParamList, 'LessonPlayer'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LessonPlayerScreen() {
  const route = useRoute<Rt>();
  const { lessonTitle, videoUrl } = route.params;

  const player = useVideoPlayer(videoUrl, (p) => {
    p.play();
  });

  return (
    <View style={styles.root}>
      <VideoView style={styles.video} player={player} allowsPictureInPicture nativeControls contentFit="contain" />
      <View style={styles.body}>
        <Text style={styles.title}>{lessonTitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  video: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * (9 / 16), backgroundColor: '#000' },
  body: { padding: spacing.lg, backgroundColor: colors.bg, flex: 1 },
  title: { ...typography.dialogTitle, textAlign: 'left' },
});
