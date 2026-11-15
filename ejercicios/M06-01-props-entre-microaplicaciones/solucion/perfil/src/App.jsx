import Perfil from './Perfil';

// Abierta sola: datos de ejemplo por props.
export default function App() {
  return <Perfil usuario={{ nombre: 'Prueba', email: 'prueba@example.com' }} onCerrarSesion={() => console.log('cerrar')} />;
}
