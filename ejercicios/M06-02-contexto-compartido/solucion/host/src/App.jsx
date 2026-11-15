import { useState } from 'react';
import { IdiomaContext } from 'idioma-compartido';
import Saludo from 'saludo/Saludo';

export default function App() {
  const [idioma, setIdioma] = useState('es');
  return (
    <IdiomaContext.Provider value={idioma}>
      <h1>Host · idioma: {idioma}</h1>
      <button onClick={() => setIdioma(idioma === 'es' ? 'en' : 'es')}>Cambiar idioma</button>
      <Saludo />
    </IdiomaContext.Provider>
  );
}
