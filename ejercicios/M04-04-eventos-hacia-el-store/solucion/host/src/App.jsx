import { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import Acceso from 'acceso/Acceso';
import { sesionIniciada, store } from './store';

// Puente: traduce el evento global a una acción del store del host.
function usePuenteSesion() {
  const dispatch = useDispatch();
  useEffect(() => {
    const alIniciar = (evento) => dispatch(sesionIniciada(evento.detail.usuario));
    window.addEventListener('acceso:sesion-iniciada', alIniciar);
    return () => window.removeEventListener('acceso:sesion-iniciada', alIniciar);
  }, [dispatch]);
}

function Cabecera() {
  const { usuario, inicios } = useSelector((state) => state.sesion);
  return <header><strong>Host</strong> · sesión: {usuario ?? 'sin sesión'} · acciones recibidas: {inicios}</header>;
}

function Pagina() {
  usePuenteSesion();
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
