import { Provider, useSelector } from 'react-redux';
import Favoritos from 'favoritos/Favoritos';
import { store } from './store';

function Cabecera() {
  const slices = useSelector((state) => Object.keys(state).join(', '));
  const total = useSelector((state) => state.favoritos?.ids.length ?? 0);
  return <header><strong>Host</strong> · slices en el store: {slices} · favoritos: {total}</header>;
}

export default function App() {
  return (
    <Provider store={store}>
      <Cabecera />
      <Favoritos />
    </Provider>
  );
}
