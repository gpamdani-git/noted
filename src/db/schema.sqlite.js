// SQLite Drizzle ORM Schema (Local Development & Offline SQLite Engine)
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Users Table (Local SQLite)
 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email'),
  name: text('name'),
  picture: text('picture'),
  avatar: text('avatar'),
  color: text('color'),
  passwordHash: text('password_hash'),
  passwordSalt: text('password_salt'),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at')
});

/**
 * Pages Table (Local SQLite)
 */
export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'),
  icon: text('icon'),
  cover: text('cover'),
  parentId: text('parent_id'),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).default(false),
  isLocked: integer('is_locked', { mode: 'boolean' }).default(false),
  fullWidth: integer('full_width', { mode: 'boolean' }).default(false),
  fontFamily: text('font_family').default('sans'),
  blocks: text('blocks', { mode: 'json' }).notNull(),
  version: integer('version').default(1),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false)
});

/**
 * Trash Table (Local SQLite)
 */
export const trash = sqliteTable('trash', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  title: text('title'),
  icon: text('icon'),
  blocks: text('blocks', { mode: 'json' }),
  deletedAt: integer('deleted_at')
});

/**
 * Workspace Settings (Local SQLite)
 */
export const workspaceSettings = sqliteTable('workspace_settings', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  openTabs: text('open_tabs', { mode: 'json' }),
  activePageId: text('active_page_id'),
  theme: text('theme').default('light'),
  updatedAt: integer('updated_at')
});
