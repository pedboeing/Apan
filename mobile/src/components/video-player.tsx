import { createElement } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { construirHtmlEmbed, paraUrlIncorporada } from '@/lib/video';

type Props = {
  url: string;
};

export function VideoPlayer({ url }: Props) {
  const embedUrl = paraUrlIncorporada(url);

  return (
    <View style={styles.container}>
      {Platform.OS === 'web'
        ? createElement('iframe', {
            src: embedUrl,
            style: { width: '100%', height: '100%', border: 0 },
            allow: 'autoplay; encrypted-media; fullscreen; picture-in-picture',
            allowFullScreen: true,
          })
        : (
          <WebView
            // baseUrl precisa ser um domínio "nosso", nunca o do próprio
            // YouTube — usar youtube.com aqui é o que causava o Erro
            // 152/153 (o YouTube desconfia de uma página "youtube.com" que
            // não veio de verdade de lá). Um domínio qualquer que não seja
            // o do provedor de vídeo já resolve a verificação de referrer.
            source={{ html: construirHtmlEmbed(embedUrl), baseUrl: 'https://apan.app/' }}
            style={styles.webview}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            javaScriptEnabled
            domStorageEnabled
            mediaPlaybackRequiresUserAction={false}
            originWhitelist={['*']}
          />
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
});
