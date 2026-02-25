import Link from 'next/link';
import AuthForm from '../../../components/AuthForm';

export default function LoginPage() {
  return (
    <main>
      <AuthForm mode="login" />
      <p>
        No account? <Link href="/auth/register">Register now</Link>
      </p>
    </main>
  );
}
