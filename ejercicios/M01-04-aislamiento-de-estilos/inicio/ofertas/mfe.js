// Microfrontend «ofertas»: otro equipo, que también ha llamado «tarjeta» a su recuadro.
const CSS = `
  .tarjeta { border: 3px dashed #d97706; background: #fffbeb; padding: 8px 12px; margin: 8px 0; }
`;

export function mount(contenedor) {
  const estilo = document.createElement('style');
  estilo.textContent = CSS;
  document.head.appendChild(estilo);             // el CSS va al <head> de la página: es global
  contenedor.innerHTML = '<section class="tarjeta"><h2>Ofertas</h2><p>20 % en mochilas</p></section>';
}
