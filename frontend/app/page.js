import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <div className="card">
        <h1>DoIt Task Manager</h1>
        <p className="muted">Secure full-stack app with JWT HttpOnly cookie auth.</p>
        <div className="grid">
          <Link href="/auth/register"><button>Create account</button></Link>
          <Link href="/auth/login"><button className="secondary">Login</button></Link>
        </div>
      </div>
    </main>
  );
}
