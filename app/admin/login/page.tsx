import { adminConfigured, goToAdmin, isAdmin } from '@/lib/auth';
import { LoginForm } from './LoginForm';
import s from '../admin.module.css';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await isAdmin()) await goToAdmin('panel');
  return (
    <main className={s.loginShell}>
      <div className={s.loginCard}>
        <span className={s.brandMark} aria-hidden="true" />
        <h1 className={s.loginTitle}>Painel do site</h1>
        <p className={s.hint}>Princípios Gerais da Traumatologia</p>
        {adminConfigured() ? (
          <LoginForm />
        ) : (
          <p className={s.error}>O acesso ainda não foi configurado (ADMIN_PASSWORD e ADMIN_SECRET).</p>
        )}
      </div>
    </main>
  );
}
