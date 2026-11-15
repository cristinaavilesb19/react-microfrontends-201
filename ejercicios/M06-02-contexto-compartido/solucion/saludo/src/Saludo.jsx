import { useIdioma } from 'idioma-compartido';

const textos = { es: 'Hola, bienvenida', en: 'Hello, welcome' };

// El remote no recibe el idioma por props: lo lee del contexto.
export default function Saludo() {
  const idioma = useIdioma();
  return <p>Saludo (remote) [{idioma}]: {textos[idioma]}</p>;
}
