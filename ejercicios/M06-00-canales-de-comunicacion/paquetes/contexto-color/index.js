import { createContext, useContext } from 'react';

// Contexto en un paquete compartido: host y remote importan el MISMO objeto.
export const ColorContext = createContext('gris');
export const useColor = () => useContext(ColorContext);
