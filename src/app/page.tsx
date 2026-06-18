import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px' }}>
      <h1>Compra+</h1>
      <Link href="/dashboard" style={{ padding: '10px 20px', background: '#0d9488', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
        Acessar Dashboard
      </Link>
    </div>
  );
}