import { useState } from 'react';

// Una microaplicación con un fallo que se puede provocar.
export default function App() {
  const [roto, setRoto] = useState(false);
  if (roto) throw new Error('fallo provocado en inestable');
  return (
    <p>
      Inestable (microaplicación) <button onClick={() => setRoto(true)}>Provocar fallo</button>
    </p>
  );
}
