import { ColorContext } from 'contexto-color';
import Ficha from 'ficha/Ficha';

export default function App() {
  const avisar = () => window.dispatchEvent(new CustomEvent('demo:aviso', { detail: 'stock bajo' }));
  return (
    <ColorContext.Provider value="teal">
      <h1>Host</h1>
      <button onClick={avisar}>Publicar evento</button>
      <Ficha nombre="Ana" />{/* 1. props */}
    </ColorContext.Provider>
  );
}
