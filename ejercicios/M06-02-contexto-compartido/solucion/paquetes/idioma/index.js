import { createContext, useContext } from 'react';

// Contexto del idioma de la página. Valor por defecto: 'es'.
export const IdiomaContext = createContext('es');
export const useIdioma = () => useContext(IdiomaContext);
