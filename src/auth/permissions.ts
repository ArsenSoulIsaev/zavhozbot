import type { AuthUser } from "../types/index.js";

export function canManageTools(user: AuthUser): boolean {
  return user.role === "arsen" || user.role === "prorab";
}

export function canManageObjects(user: AuthUser): boolean {
  return user.role === "arsen" || user.role === "prorab";
}

export function canManageUsers(user: AuthUser): boolean {
  return user.role === "arsen";
}

export function canViewAll(user: AuthUser): boolean {
  return user.role === "arsen" || user.role === "prorab";
}
