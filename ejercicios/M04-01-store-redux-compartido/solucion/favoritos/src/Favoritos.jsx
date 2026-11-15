import { useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { alternar, favoritosSlice } from './favoritosSlice';

const libros = ['Rayuela', 'Ficciones', 'Pedro Páramo'];

function Lista() {
  const ids = useSelector((state) => state.favoritos?.ids ?? []);
  const dispatch = useDispatch();
  return (
    <section>
      <h2>Favoritos (remote)</h2>
      {libros.map((l) => (
        <button key={l} onClick={() => dispatch(alternar(l))}>
          {ids.includes(l) ? '★' : '☆'} {l}
        </button>
      ))}
    </section>
  );
}

// Sin store propio: usa el del host (lo da su <Provider>) y le inyecta su slice una vez.
export default function Favoritos() {
  const store = useStore();
  useState(() => store.inyectar(favoritosSlice));
  return <Lista />;
}
