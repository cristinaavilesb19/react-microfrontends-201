import { combineSlices, configureStore, createSlice } from '@reduxjs/toolkit';

// Estado propio del host.
const sesion = createSlice({ name: 'sesion', initialState: { usuario: 'Ana' }, reducers: {} });

// combineSlices permite añadir slices después de crear el store.
export const rootReducer = combineSlices(sesion);
export const store = configureStore({ reducer: rootReducer });

// Contrato para los remotes: añadir su slice sin que el host lo conozca de antemano.
store.inyectar = (slice) => {
  rootReducer.inject(slice);
  store.dispatch({ type: 'host/sliceInyectado', payload: slice.name });
};
