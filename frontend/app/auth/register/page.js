import Link from 'next/link';
import AuthForm from '../../../components/AuthForm';

export default function RegisterPage() {
  return (
    <main>
      <AuthForm mode="register" />
      <p>
        Already registered? <Link href="/auth/login">Login</Link>
      </p>
    </main>
  );
}
