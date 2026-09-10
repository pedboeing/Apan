export function isoParaBr(iso: string): string {
  if (!iso) return '';
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  if (!ano || !mes || !dia) return '';
  return `${dia}/${mes}/${ano}`;
}

export function brParaIso(br: string): string | null {
  const digitos = br.replace(/\D/g, '');
  if (digitos.length !== 8) return null;

  const dia = Number(digitos.slice(0, 2));
  const mes = Number(digitos.slice(2, 4));
  const ano = Number(digitos.slice(4, 8));
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;

  const data = new Date(ano, mes - 1, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    return null;
  }

  return `${String(ano).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

export function formatarDataEnquantoDigita(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  const partes: string[] = [];
  if (digitos.length > 0) partes.push(digitos.slice(0, 2));
  if (digitos.length > 2) partes.push(digitos.slice(2, 4));
  if (digitos.length > 4) partes.push(digitos.slice(4, 8));
  return partes.join('/');
}
