'use client';

import { useActionState } from 'react';
import { login, type LoginState } from '../actions';
import s from '../admin.module.css';

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className={s.loginForm}>
      <label htmlFor="email" className={s.label}>
        E-mail
      </label>
      <input id="email" name="email" type="email" autoComplete="username" inputMode="email" required autoFocus className={s.input} />
      <label htmlFor="password" className={s.label} style={{ marginTop: '0.5rem' }}>
        Senha
      </label>
      <input id="password" name="password" type="password" autoComplete="current-password" required className={s.input} />
      {state.error && (
        <p className={s.error} role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className={s.primaryBtn} disabled={pending}>
        {pending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
