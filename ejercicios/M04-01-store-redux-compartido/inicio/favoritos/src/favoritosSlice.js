import { createSlice } from '@reduxjs/toolkit';

// Estado de la microaplicación favoritos.
export const favoritosSlice = createSlice({
  name: 'favoritos',
  initialState: { ids: [] },
  reducers: {
    alternar(state, action) {
      const i = state.ids.indexOf(action.payload);
      if (i === -1) state.ids.push(action.payload);
      else state.ids.splice(i, 1);
    },
  },
});

export const { alternar } = favoritosSlice.actions;
