import { Provider, useSelector } from 'react-redux';
import Acceso from 'acceso/Acceso';
import { store } from './store';

function Cabecera() {
  const { usuario, inicios } = useSelector((state) => state.sesion);
  return <header><strong>Host</strong> · sesión: {usuario ?? 'sin sesión'} · acciones recibidas: {inicios}</header>;
}

function Pagina() {
  return (
    <>
      <Cabecera />
      <Acceso />
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Pagina />
    </Provider>
  );
}
