import { navigateToUrl } from 'single-spa';

// Barra de navegación: una microaplicación que está activa en todas las rutas.
export default function App() {
  return (
    <header style={{ background: '#e0e7ff', padding: 8 }}>
      Navegación (microaplicación):{' '}
      <a href="/" onClick={navigateToUrl}>Inicio</a> · <a href="/perfil" onClick={navigateToUrl}>Perfil</a>
    </header>
  );
}
