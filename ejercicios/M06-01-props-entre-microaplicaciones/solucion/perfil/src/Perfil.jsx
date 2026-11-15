// Contrato del remote: qué recibe (usuario) y a quién avisa (onCerrarSesion).
export default function Perfil({ usuario, onCerrarSesion }) {
  if (!usuario) return <p>Perfil: sin datos</p>;
  return (
    <section>
      <h2>Perfil (remote)</h2>
      <p>{usuario.nombre} · {usuario.email}</p>
      <button onClick={onCerrarSesion}>Cerrar sesión</button>
    </section>
  );
}
