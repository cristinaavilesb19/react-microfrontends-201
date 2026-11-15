import { useState } from 'react';

export default function Notas({ titulo = 'Notas' }) {
  const [notas, setNotas] = useState(['Comprar pan']);
  const [texto, setTexto] = useState('');
  return (
    <section style={{ border: '1px solid #999', padding: 12, marginTop: 8 }}>
      <h2>{titulo}</h2>
      <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nueva nota" />
      <button onClick={() => { setNotas([...notas, texto]); setTexto(''); }}>Añadir</button>
      <ul>{notas.map((n, i) => <li key={i}>{n}</li>)}</ul>
    </section>
  );
}
