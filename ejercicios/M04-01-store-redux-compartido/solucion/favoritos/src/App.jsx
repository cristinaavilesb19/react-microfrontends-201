import { combineSlices, configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Favoritos from './Favoritos';

// Modo aislado (http://localhost:3001): un store mínimo con el mismo contrato que el del host.
const rootReducer = combineSlices({});
const store = configureStore({ reducer: rootReducer });
store.inyectar = (slice) => rootReducer.inject(slice);

export default function App() {
  return (
    <Provider store={store}>
      <Favoritos />
    </Provider>
  );
}
