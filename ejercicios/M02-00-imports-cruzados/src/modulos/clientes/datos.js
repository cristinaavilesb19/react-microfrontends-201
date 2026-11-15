// Datos internos del módulo clientes.
export const clientes = [
  { id: 1, nombre: 'Lucía Martín' },
  { id: 2, nombre: 'Omar Haddad' },
];

export function nombreCompleto(id) {
  return clientes.find((c) => c.id === id)?.nombre ?? 'desconocido';
}
