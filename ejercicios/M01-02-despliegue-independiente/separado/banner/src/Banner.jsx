// Texto de la campaña: lo cambia el equipo de marketing cada semana.
export const TEXTO = 'Rebajas de otoño: 20 % en mochilas';

export default function Banner() {
  return <aside style={{ background: '#fde68a', padding: 12 }}>{TEXTO}</aside>;
}
