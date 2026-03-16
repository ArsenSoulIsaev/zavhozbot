import type { AuthUser } from "../types/index.js";

export function canManageTools(user: AuthUser): boolean {
  return user.role === "arsen" || user.role === "prorab";
}

export function canCloseObjects(user: AuthUser): boolean {
  return user.role === "arsen" || user.role === "prorab";
}

export function canViewAll(user: AuthUser): boolean {
  return user.role === "arsen" || user.role === "prorab";
}
