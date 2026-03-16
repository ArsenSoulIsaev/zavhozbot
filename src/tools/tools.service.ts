import { query } from "../db.js";

export interface ToolRow {
  id: number;
  title: string;
  aliases: string[];
  family: string | null;
  type: string | null;
  current_object_id: number | null;
  responsible_user_id: number | null;
  status: string;
}

export interface ToolLocationInfo {
  id: number;
  title: string;
  object_name: string | null;
  responsible_name: string | null;
  status: string;
}

export async function findToolByNameOrAlias(name: string): Promise<ToolRow | null> {
  const normalized = name.trim().toLowerCase();

  const result = await query<ToolRow>(
    `
    select
      id,
      title,
      aliases,
      family,
      type,
      current_object_id,
      responsible_user_id,
      status
    from tools
    where lower(title) = $1
       or exists (
         select 1
         from unnest(aliases) as alias
         where lower(alias) = $1
       )
    order by id
    limit 1
    `,
    [normalized]
  );

  return result.rows[0] || null;
}

export async function getToolLocation(toolId: number): Promise<ToolLocationInfo | null> {
  const result = await query<ToolLocationInfo>(
    `
    select
      t.id,
      t.title,
      o.name as object_name,
      u.name as responsible_name,
      t.status
    from tools t
    left join objects o on o.id = t.current_object_id
    left join users u on u.id = t.responsible_user_id
    where t.id = $1
    limit 1
    `,
    [toolId]
  );

  return result.rows[0] || null;
}

export async function takeTool(params: {
  toolId: number;
  actorUserId: number;
  currentObjectId: number | null;
}): Promise<void> {
  await query(
    `
    update tools
    set responsible_user_id = $1,
        status = 'in_use'
    where id = $2
    `,
    [params.actorUserId, params.toolId]
  );

  await query(
    `
    insert into tool_history (
      tool_id,
      action,
      from_object_id,
      to_object_id,
      actor_user_id,
      responsible_user_id,
      comment
    )
    values ($1, 'take', $2, $2, $3, $3, $4)
    `,
    [
      params.toolId,
      params.currentObjectId,
      params.actorUserId,
      "Инструмент взят в работу"
    ]
  );
}

export async function returnTool(params: {
  toolId: number;
  actorUserId: number;
  currentObjectId: number | null;
}): Promise<void> {
  await query(
    `
    update tools
    set responsible_user_id = null,
        status = 'available'
    where id = $1
    `,
    [params.toolId]
  );

  await query(
    `
    insert into tool_history (
      tool_id,
      action,
      from_object_id,
      to_object_id,
      actor_user_id,
      responsible_user_id,
      comment
    )
    values ($1, 'return', $2, $2, $3, null, $4)
    `,
    [
      params.toolId,
      params.currentObjectId,
      params.actorUserId,
      "Инструмент возвращён"
    ]
  );
}
