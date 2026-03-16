import { query } from "../db.js";

export interface ObjectRow {
  id: number;
  name: string;
  is_active: boolean;
  is_closed: boolean;
}

export async function findObjectByName(name: string): Promise<ObjectRow | null> {
  const result = await query<ObjectRow>(
    `
    select id, name, is_active, is_closed
    from objects
    where lower(name) = lower($1)
    limit 1
    `,
    [name.trim()]
  );

  return result.rows[0] || null;
}

export async function getBaseObject(): Promise<ObjectRow> {
  const result = await query<ObjectRow>(
    `
    select id, name, is_active, is_closed
    from objects
    where lower(name) = lower('База')
    limit 1
    `
  );

  const row = result.rows[0];
  if (!row) throw new Error("Объект 'База' не найден");

  return row;
}

export async function createObject(name: string): Promise<ObjectRow> {
  const result = await query<ObjectRow>(
    `
    insert into objects (name, is_active, is_closed)
    values ($1, false, false)
    returning id, name, is_active, is_closed
    `,
    [name]
  );

  return result.rows[0];
}

export async function activateObject(objectId: number): Promise<void> {
  await query(`update objects set is_active = false where is_active = true`);
  await query(
    `
    update objects
    set is_active = true, is_closed = false
    where id = $1
    `,
    [objectId]
  );
}

export async function closeObject(objectId: number): Promise<"ok" | "already_closed" | "base_forbidden"> {
  const current = await query<ObjectRow>(
    `
    select id, name, is_active, is_closed
    from objects
    where id = $1
    limit 1
    `,
    [objectId]
  );

  const row = current.rows[0];
  if (!row) throw new Error("Объект не найден");

  if (row.name.toLowerCase() === "база") return "base_forbidden";
  if (row.is_closed) return "already_closed";

  const base = await getBaseObject();

  await query(
    `
    update objects
    set is_closed = true,
        is_active = false,
        closed_at = now()
    where id = $1
    `,
    [objectId]
  );

  await query(
    `
    update objects
    set is_active = true
    where id = $1
    `,
    [base.id]
  );

  return "ok";
}
