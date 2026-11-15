import { createContext, useContext, useState } from 'react';

// Contexto privado de la microaplicación: no se exporta en «exposes».
const FormularioContext = createContext(null);

export function FormularioProvider({ children }) {
  const [datos, setDatos] = useState({ nombre: '', ciudad: '' });
  const cambiar = (campo, valor) => setDatos((d) => ({ ...d, [campo]: valor }));
  return <FormularioContext.Provider value={{ datos, cambiar }}>{children}</FormularioContext.Provider>;
}

export function useFormulario() {
  const valor = useContext(FormularioContext);
  if (!valor) throw new Error('useFormulario fuera de <FormularioProvider>');
  return valor;
}
