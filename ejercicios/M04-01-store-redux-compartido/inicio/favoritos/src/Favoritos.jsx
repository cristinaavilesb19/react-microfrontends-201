import { configureStore } from '@reduxjs/toolkit';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { alternar, favoritosSlice } from './favoritosSlice';

// El remote crea SU PROPIO store y lo envuelve con su Provider.
const storePropio = configureStore({ reducer: { favoritos: favoritosSlice.reducer } });

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

export default function Favoritos() {
  return (
    <Provider store={storePropio}>
      <Lista />
    </Provider>
  );
}
