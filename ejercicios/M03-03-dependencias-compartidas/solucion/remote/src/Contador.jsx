import { useState } from 'react';

// Un componente con hooks: necesita el mismo React que lo está pintando.
export default function Contador() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>Clics: {n}</button>;
}
