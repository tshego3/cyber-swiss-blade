import { isJsonObject, type JsonObject, type JsonValue } from '../../shared/protocol';

type FieldKind<V> = [V] extends [readonly (infer Item)[]]
  ? readonly [ShapeOf<Item>]
  : [V] extends [string]
    ? string extends V
      ? 'string'
      : readonly V[]
    : [V] extends [number]
      ? 'number'
      : [V] extends [boolean]
        ? 'boolean'
        : never;

export type ShapeOf<T> = { readonly [K in keyof T]-?: FieldKind<T[K]> };

type AnyKind = 'string' | 'number' | 'boolean' | readonly string[] | readonly [Readonly<Record<string, unknown>>];

export function matchesShape<T>(value: JsonValue | undefined, shape: ShapeOf<T>): value is JsonObject & T {
  if (!isJsonObject(value)) return false;
  const fields: readonly (readonly [string, unknown])[] = Object.entries(shape);
  return fields.every(([key, kind]) => matchesKind(value[key], kind as AnyKind));
}

function matchesKind(value: JsonValue | undefined, kind: AnyKind): boolean {
  if (kind === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (kind === 'string' || kind === 'boolean') return typeof value === kind;
  const [first] = kind;
  if (typeof first === 'string' || first === undefined) {
    return typeof value === 'string' && (kind as readonly string[]).includes(value);
  }
  return Array.isArray(value) && value.every((item: JsonValue) => matchesShape(item, first as ShapeOf<unknown>));
}
