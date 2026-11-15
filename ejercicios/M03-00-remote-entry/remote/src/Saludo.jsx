export default function Saludo({ nombre = 'mundo' }) {
  return <p>Hola, {nombre}. Este párrafo lo ha compilado el remote «saludo».</p>;
}
