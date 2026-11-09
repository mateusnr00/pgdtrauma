'use client';

import { useActionState } from 'react';
import { login, type LoginState } from '../actions';
import s from '../admin.module.css';

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className={s.loginForm}>
      <label htmlFor="password" className={s.label}>
        Senha
      </label>
      <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus className={s.input} />
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
