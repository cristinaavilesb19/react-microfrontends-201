import { configureStore, createSlice } from '@reduxjs/toolkit';

const sesion = createSlice({
  name: 'sesion',
  initialState: { usuario: null, inicios: 0 },
  reducers: {
    sesionIniciada(state, action) {
      state.usuario = action.payload;
      state.inicios += 1;        // cuántas veces ha llegado la acción
    },
  },
});

export const { sesionIniciada } = sesion.actions;
export const store = configureStore({ reducer: { sesion: sesion.reducer } });
