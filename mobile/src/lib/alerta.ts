import { Alert, Platform } from 'react-native';

// react-native-web implementa Alert.alert como um no-op total (ver
// node_modules/react-native-web/src/exports/Alert) — no navegador, tocar em
// "Excluir" não fazia NADA, porque a confirmação nunca aparecia e o
// callback nunca era chamado. Esses wrappers usam window.confirm/alert no
// web e o Alert nativo de verdade fora dele.

// Confirmação genérica de duas opções ("Cancelar" + um texto de ação) — base
// usada tanto por confirmarExclusao quanto por qualquer outra ação que
// precise de confirmação antes de disparar (ex: "Não compareci").
export function confirmar(
  titulo: string,
  mensagem: string,
  textoConfirmar: string,
  aoConfirmar: () => void,
  destrutivo = true,
): void {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titulo}\n\n${mensagem}`)) {
      aoConfirmar();
    }
    return;
  }
  Alert.alert(titulo, mensagem, [
    { text: 'Cancelar', style: 'cancel' },
    { text: textoConfirmar, style: destrutivo ? 'destructive' : 'default', onPress: aoConfirmar },
  ]);
}

// Confirmação de ação destrutiva (excluir treino/recorde/marca/etc) — mesmo
// par de botões "Cancelar"/"Excluir" usado em todo o app.
export function confirmarExclusao(titulo: string, mensagem: string, aoConfirmar: () => void): void {
  confirmar(titulo, mensagem, 'Excluir', aoConfirmar);
}

// Aviso simples, sem confirmação (sucesso, permissão negada, resultado de
// importação etc).
export function alertar(titulo: string, mensagem: string): void {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensagem}`);
    return;
  }
  Alert.alert(titulo, mensagem);
}
