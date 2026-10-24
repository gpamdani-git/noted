// PostgreSQL Drizzle ORM Schema (Production & Vercel Postgres / Neon / Supabase)
import { pgTable, text, boolean, integer, bigint, jsonb, index } from 'drizzle-orm/pg-core';

/**
 * Users Table (Notion Workspace Identity)
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email'),
  name: text('name'),
  picture: text('picture'),
  avatar: text('avatar'),
  color: text('color'),
  passwordHash: text('password_hash'),
  passwordSalt: text('password_salt'),
  createdAt: bigint('created_at', { mode: 'number' }),
  updatedAt: bigint('updated_at', { mode: 'number' })
});

/**
 * Pages Table (Notion Hierarchical Pages & Block Trees)
 */
export const pages = pgTable('pages', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'),
  icon: text('icon'),
  cover: text('cover'),
  parentId: text('parent_id'),
  isFavorite: boolean('is_favorite').default(false),
  isLocked: boolean('is_locked').default(false),
  fullWidth: boolean('full_width').default(false),
  fontFamily: text('font_family').default('sans'),
  blocks: jsonb('blocks').notNull().default([]),
  version: integer('version').default(1),
  createdAt: bigint('created_at', { mode: 'number' }),
  updatedAt: bigint('updated_at', { mode: 'number' }),
  isDeleted: boolean('is_deleted').default(false)
}, (table) => [
  index('idx_pages_user_id').on(table.userId)
]);

/**
 * Trash Table (Soft-Deleted Pages & Blocks)
 */
export const trash = pgTable('trash', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  title: text('title'),
  icon: text('icon'),
  blocks: jsonb('blocks'),
  deletedAt: bigint('deleted_at', { mode: 'number' })
}, (table) => [
  index('idx_trash_user_id').on(table.userId)
]);

/**
 * Workspace Settings (User Interface, Tabs, and Themes)
 */
export const workspaceSettings = pgTable('workspace_settings', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  openTabs: jsonb('open_tabs').default([]),
  activePageId: text('active_page_id'),
  theme: text('theme').default('light'),
  updatedAt: bigint('updated_at', { mode: 'number' })
});
