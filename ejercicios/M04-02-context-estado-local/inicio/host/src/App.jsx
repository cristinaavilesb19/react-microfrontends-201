import Formulario from 'formulario/Formulario';

// Dos instancias de la misma microaplicación: cada una con su propio estado.
export default function App() {
  return (
    <main>
      <h1>Host</h1>
      <Formulario titulo="Alta de cliente A" />
      <Formulario titulo="Alta de cliente B" />
    </main>
  );
}
