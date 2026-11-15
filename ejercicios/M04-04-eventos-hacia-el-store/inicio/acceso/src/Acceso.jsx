// Microaplicación sin Redux: no sabe quién la escucha. Solo anuncia lo que ha pasado.
export default function Acceso() {
  const entrar = (usuario) => {
    console.log('[acceso] emite acceso:sesion-iniciada', usuario);
    window.dispatchEvent(new CustomEvent('acceso:sesion-iniciada', { detail: { usuario } }));
  };
  return (
    <section>
      <h2>Acceso (remote)</h2>
      <button onClick={() => entrar('Ana')}>Entrar como Ana</button>
      <button onClick={() => entrar('Luis')}>Entrar como Luis</button>
    </section>
  );
}
