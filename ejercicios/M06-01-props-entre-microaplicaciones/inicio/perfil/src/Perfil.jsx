// El remote lee una variable global que alguien debería haber dejado en window.
export default function Perfil() {
  const usuario = window.usuarioActual;
  if (!usuario) return <p>Perfil: sin datos</p>;
  return (
    <section>
      <h2>Perfil (remote)</h2>
      <p>{usuario.nombre} · {usuario.email}</p>
      <button onClick={() => { window.usuarioActual = null; }}>Cerrar sesión</button>
    </section>
  );
}
