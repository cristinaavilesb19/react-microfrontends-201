import Contador from './Contador';

// Página del remote cuando se abre solo (http://localhost:3001).
export default function App() {
  return (
    <main>
      <h1>Remote contador (puerto 3001)</h1>
      <Contador />
    </main>
  );
}
