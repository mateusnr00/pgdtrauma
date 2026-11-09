'use client';

import { useId, useState } from 'react';
import type { Field } from './spec';
import { ImageField, VideoField } from './MediaFields';
import s from '../admin.module.css';

export type Path = (string | number)[];
export type OnChange = (path: Path, value: unknown) => void;

type Props = { fields: Field[]; value: Record<string, unknown>; path: Path; onChange: OnChange };

export function Fields({ fields, value, path, onChange }: Props) {
  return (
    <div className={s.fields}>
      {fields.map((f) => (
        <FieldView key={f.key} field={f} value={value?.[f.key]} path={[...path, f.key]} onChange={onChange} />
      ))}
    </div>
  );
}

function FieldView({ field, value, path, onChange }: { field: Field; value: unknown; path: Path; onChange: OnChange }) {
  const id = useId();
  switch (field.kind) {
    case 'text': {
      const v = typeof value === 'string' ? value : '';
      return (
        <div className={s.field}>
          <label htmlFor={id} className={s.label}>
            {field.label}
          </label>
          {field.long ? (
            <textarea
              id={id}
              className={s.input}
              value={v}
              rows={Math.min(10, Math.max(3, Math.ceil(v.length / 70)))}
              placeholder={field.placeholder}
              onChange={(e) => onChange(path, e.target.value)}
            />
          ) : (
            <input id={id} className={s.input} value={v} placeholder={field.placeholder} onChange={(e) => onChange(path, e.target.value)} />
          )}
          {field.hint && <p className={s.hint}>{field.hint}</p>}
        </div>
      );
    }
    case 'select':
      return (
        <div className={s.field}>
          <label htmlFor={id} className={s.label}>
            {field.label}
          </label>
          <select id={id} className={s.input} value={String(value ?? '')} onChange={(e) => onChange(path, e.target.value)}>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      );
    case 'image':
      return <ImageField label={field.label} hint={field.hint} value={value} onChange={(v) => onChange(path, v)} />;
    case 'video':
      return <VideoField label={field.label} value={value} onChange={(v) => onChange(path, v)} />;
    case 'group':
      return (
        <fieldset className={s.group}>
          <legend className={s.legend}>{field.label}</legend>
          <Fields fields={field.fields} value={(value ?? {}) as Record<string, unknown>} path={path} onChange={onChange} />
        </fieldset>
      );
    case 'strings':
      return <StringList field={field} value={Array.isArray(value) ? (value as string[]) : []} path={path} onChange={onChange} />;
    case 'list':
      return <ObjectList field={field} value={Array.isArray(value) ? (value as Record<string, unknown>[]) : []} path={path} onChange={onChange} />;
  }
}

/* ---------- Lists ---------- */

function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function ItemActions({ index, count, onMove, onDuplicate, onRemove, label }: {
  index: number;
  count: number;
  onMove: (to: number) => void;
  onDuplicate?: () => void;
  onRemove: () => void;
  label: string;
}) {
  return (
    <div className={s.itemActions}>
      <button type="button" className={s.iconBtn} onClick={() => onMove(index - 1)} disabled={index === 0} aria-label={`Mover ${label} para cima`} title="Mover para cima">
        ↑
      </button>
      <button type="button" className={s.iconBtn} onClick={() => onMove(index + 1)} disabled={index === count - 1} aria-label={`Mover ${label} para baixo`} title="Mover para baixo">
        ↓
      </button>
      {onDuplicate && (
        <button type="button" className={s.iconBtn} onClick={onDuplicate} aria-label={`Duplicar ${label}`} title="Duplicar">
          ⧉
        </button>
      )}
      <button
        type="button"
        className={`${s.iconBtn} ${s.danger}`}
        onClick={() => {
          if (confirm(`Remover ${label}?`)) onRemove();
        }}
        aria-label={`Remover ${label}`}
        title="Remover"
      >
        ×
      </button>
    </div>
  );
}

function StringList({ field, value, path, onChange }: { field: Extract<Field, { kind: 'strings' }>; value: string[]; path: Path; onChange: OnChange }) {
  return (
    <div className={s.field}>
      <p className={s.label}>{field.label}</p>
      {field.hint && <p className={s.hint}>{field.hint}</p>}
      <ol className={s.stringList}>
        {value.map((item, i) => (
          <li key={i} className={s.stringItem}>
            <input
              className={s.input}
              value={item}
              aria-label={`${field.itemLabel} ${i + 1}`}
              onChange={(e) => onChange(path, value.map((v, k) => (k === i ? e.target.value : v)))}
            />
            <ItemActions
              index={i}
              count={value.length}
              label={`${field.itemLabel.toLowerCase()} ${i + 1}`}
              onMove={(to) => onChange(path, move(value, i, to))}
              onRemove={() => onChange(path, value.filter((_, k) => k !== i))}
            />
          </li>
        ))}
      </ol>
      <button type="button" className={s.addBtn} onClick={() => onChange(path, [...value, ''])}>
        + Adicionar {field.itemLabel.toLowerCase()}
      </button>
    </div>
  );
}

function ObjectList({ field, value, path, onChange }: { field: Extract<Field, { kind: 'list' }>; value: Record<string, unknown>[]; path: Path; onChange: OnChange }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className={s.field}>
      <div className={s.listHead}>
        <p className={s.label}>
          {field.label} <span className={s.count}>{value.length}</span>
        </p>
        {value.length > 1 && (
          <button type="button" className={s.textBtn} onClick={() => setOpen(open.size ? new Set() : new Set(value.map((_, i) => i)))}>
            {open.size ? 'Recolher todos' : 'Abrir todos'}
          </button>
        )}
      </div>
      {field.hint && <p className={s.hint}>{field.hint}</p>}
      <ol className={s.cards}>
        {value.map((item, i) => {
          const title = (field.titleKey && String(item?.[field.titleKey] ?? '').trim()) || `${field.itemLabel} ${i + 1}`;
          const isOpen = open.has(i);
          return (
            <li key={i} className={s.card} data-open={isOpen || undefined}>
              <div className={s.cardHead}>
                <button type="button" className={s.cardToggle} aria-expanded={isOpen} onClick={() => toggle(i)}>
                  <span className={s.cardIndex}>{i + 1}</span>
                  <span className={s.cardTitle}>{title}</span>
                  <span className={s.chevron} aria-hidden="true" />
                </button>
                <ItemActions
                  index={i}
                  count={value.length}
                  label={`${field.itemLabel.toLowerCase()} ${i + 1}`}
                  onMove={(to) => {
                    onChange(path, move(value, i, to));
                    setOpen(new Set());
                  }}
                  onDuplicate={() => onChange(path, [...value.slice(0, i + 1), structuredClone(item), ...value.slice(i + 1)])}
                  onRemove={() => {
                    onChange(path, value.filter((_, k) => k !== i));
                    setOpen(new Set());
                  }}
                />
              </div>
              {isOpen && (
                <div className={s.cardBody}>
                  <Fields fields={field.fields} value={item} path={[...path, i]} onChange={onChange} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        className={s.addBtn}
        onClick={() => {
          onChange(path, [...value, field.newItem()]);
          setOpen(new Set([value.length]));
        }}
      >
        + Adicionar {field.itemLabel.toLowerCase()}
      </button>
    </div>
  );
}
