// Vercel Serverless Function: Bidirectional Notion Transaction Sync for PostgreSQL & Local SQLite
// Endpoints:
// - POST /api/sync: Upsert local workspace pages and blocks into DB
// - GET /api/sync?userId=xxx: Pull latest pages and blocks from DB

import { getPool, ensureSchema, getSqliteDb } from './_lib/db.js';
import { applyCors, getSessionFromRequest, sanitizeSyncPayload } from './_lib/security.js';

export default async function handler(req, res) {
  // CORS is restricted to the configured origin allowlist (never wildcard).
  const corsAllowed = applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!corsAllowed) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  // Every sync request must carry a server-issued session token.
  // The workspace owner is derived from that token, never from client input.
  const session = getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Sign in with Google to sync this workspace.',
      mode: 'offline_vault'
    });
  }
  const sessionUserId = session.sub;
  const sessionEmail = session.email;

  const pool = getPool();

  // If no PostgreSQL connection is configured, use Local SQLite (better-sqlite3 + Drizzle)
  if (!pool) {
    const sqliteInstance = await getSqliteDb();
    if (sqliteInstance) {
      const { sqlite } = sqliteInstance;

      // GET /api/sync from Local SQLite (identity comes from the session token)
      if (req.method === 'GET') {
        const userId = sessionUserId;
        if (!userId || userId === 'guest') {
          return res.status(200).json({
            success: true,
            mode: 'local_drizzle_sqlite',
            pages: [],
            trash: [],
            workspaceSettings: null
          });
        }

        try {
          const pagesRows = sqlite.prepare(
            `SELECT id, user_id AS userId, title, icon, cover, parent_id AS parentId,
                    is_favorite AS isFavorite, is_locked AS isLocked,
                    full_width AS fullWidth, font_family AS fontFamily,
                    blocks, version, created_at AS createdAt, updated_at AS updatedAt
             FROM pages
             WHERE user_id = ? AND is_deleted = 0
             ORDER BY updated_at DESC`
          ).all(userId);

          const parsedPages = pagesRows.map(p => ({
            ...p,
            isFavorite: Boolean(p.isFavorite),
            isLocked: Boolean(p.isLocked),
            fullWidth: Boolean(p.fullWidth),
            blocks: typeof p.blocks === 'string' ? JSON.parse(p.blocks) : p.blocks
          }));

          const trashRows = sqlite.prepare(
            `SELECT id, user_id AS userId, title, icon, blocks, deleted_at AS deletedAt
             FROM trash
             WHERE user_id = ?
             ORDER BY deleted_at DESC`
          ).all(userId);

          const parsedTrash = trashRows.map(t => ({
            ...t,
            blocks: typeof t.blocks === 'string' ? JSON.parse(t.blocks) : t.blocks
          }));

          const settingsRow = sqlite.prepare(
            `SELECT open_tabs AS openTabs, active_page_id AS activePageId, theme, updated_at AS updatedAt
             FROM workspace_settings
             WHERE user_id = ?`
          ).get(userId);

          const parsedSettings = settingsRow ? {
            ...settingsRow,
            openTabs: typeof settingsRow.openTabs === 'string' ? JSON.parse(settingsRow.openTabs) : settingsRow.openTabs
          } : null;

          return res.status(200).json({
            success: true,
            mode: 'local_drizzle_sqlite',
            database: 'SQLite (data/local.db)',
            serverTimestamp: Date.now(),
            pages: parsedPages,
            trash: parsedTrash,
            workspaceSettings: parsedSettings
          });
        } catch (err) {
          console.error('Local SQLite GET sync error:', err);
          return res.status(500).json({ success: false, error: err.message });
        }
      }

      // POST /api/sync into Local SQLite
      if (req.method === 'POST') {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const sanitized = sanitizeSyncPayload(body);
        if (!sanitized.ok) {
          return res.status(400).json({ success: false, error: sanitized.error });
        }
        const { user, pages, trash, workspaceSettings } = sanitized.payload;
        const userId = sessionUserId;

        if (!userId || userId === 'guest') {
          return res.status(200).json({
            success: true,
            mode: 'guest_standby',
            message: 'Guest workspace is kept in local IndexedDB Vault only.',
            serverTimestamp: Date.now()
          });
        }

        const now = Date.now();
        try {
          const syncTx = sqlite.transaction(() => {
            if (user) {
              sqlite.prepare(
                `INSERT INTO users (id, email, name, picture, avatar, color, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(id) DO UPDATE SET
                   email = excluded.email,
                   name = excluded.name,
                   picture = excluded.picture,
                   avatar = excluded.avatar,
                   color = excluded.color,
                   updated_at = excluded.updated_at`
              ).run(
                userId,
                user.email || sessionEmail,
                user.name || 'User',
                user.picture || null,
                user.avatar || 'U',
                user.color || '#2383e2',
                now,
                now
              );
            }

            const activePageIds = [];
            const insertPage = sqlite.prepare(
              `INSERT INTO pages (
                 id, user_id, title, icon, cover, parent_id,
                 is_favorite, is_locked, full_width, font_family,
                 blocks, version, created_at, updated_at, is_deleted
               )
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
               ON CONFLICT(id) DO UPDATE SET
                 title = excluded.title,
                 icon = excluded.icon,
                 cover = excluded.cover,
                 parent_id = excluded.parent_id,
                 is_favorite = excluded.is_favorite,
                 is_locked = excluded.is_locked,
                 full_width = excluded.full_width,
                 font_family = excluded.font_family,
                 blocks = excluded.blocks,
                 version = pages.version + 1,
                 updated_at = excluded.updated_at,
                 is_deleted = 0`
            );

            for (const page of pages) {
              if (!page || !page.id) continue;
              activePageIds.push(page.id);
              insertPage.run(
                page.id,
                userId,
                page.title || 'Untitled',
                page.icon || null,
                page.cover || null,
                page.parentId || null,
                page.isFavorite ? 1 : 0,
                page.isLocked ? 1 : 0,
                page.fullWidth ? 1 : 0,
                page.fontFamily || 'sans',
                JSON.stringify(page.blocks || []),
                page.version || 1,
                page.createdAt || now,
                page.updatedAt || now
              );
            }

            if (activePageIds.length > 0) {
              const placeholders = activePageIds.map(() => '?').join(',');
              sqlite.prepare(
                `UPDATE pages SET is_deleted = 1, updated_at = ?
                 WHERE user_id = ? AND id NOT IN (${placeholders})`
              ).run(now, userId, ...activePageIds);
            }

            const insertTrash = sqlite.prepare(
              `INSERT INTO trash (id, user_id, title, icon, blocks, deleted_at)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET
                 title = excluded.title,
                 icon = excluded.icon,
                 blocks = excluded.blocks,
                 deleted_at = excluded.deleted_at`
            );

            for (const t of trash) {
              if (!t || !t.id) continue;
              insertTrash.run(
                t.id,
                userId,
                t.title || 'Deleted Page',
                t.icon || null,
                JSON.stringify(t.blocks || []),
                t.deletedAt || now
              );
            }

            if (workspaceSettings) {
              sqlite.prepare(
                `INSERT INTO workspace_settings (user_id, open_tabs, active_page_id, theme, updated_at)
                 VALUES (?, ?, ?, ?, ?)
                 ON CONFLICT(user_id) DO UPDATE SET
                   open_tabs = excluded.open_tabs,
                   active_page_id = excluded.active_page_id,
                   theme = excluded.theme,
                   updated_at = excluded.updated_at`
              ).run(
                userId,
                JSON.stringify(workspaceSettings.openTabs || []),
                workspaceSettings.activePageId || null,
                workspaceSettings.theme || 'light',
                now
              );
            }
          });

          syncTx();

          return res.status(200).json({
            success: true,
            mode: 'local_drizzle_sqlite',
            database: 'SQLite (data/local.db)',
            serverTimestamp: now,
            syncedPagesCount: pages.length,
            syncedTrashCount: trash.length
          });
        } catch (err) {
          console.error('Local SQLite POST sync error:', err);
          return res.status(500).json({ success: false, error: err.message });
        }
      }
    }

    return res.status(200).json({
      success: true,
      mode: 'local_vault_only',
      message: 'PostgreSQL connection string (POSTGRES_URL) is not set in environment. Operating in 100% Offline IndexedDB Vault mode.',
      serverTimestamp: Date.now()
    });
  }

  let client = null;
  try {
    client = await pool.connect();
    await ensureSchema(client);

    // GET /api/sync - Pull workspace from PostgreSQL (session-scoped)
    if (req.method === 'GET') {
      const userId = sessionUserId;
      if (!userId || userId === 'guest') {
        return res.status(200).json({
          success: true,
          mode: 'cloud_postgres',
          pages: [],
          trash: [],
          workspaceSettings: null
        });
      }

      // Query active pages
      const pagesRes = await client.query(
        `SELECT id, user_id AS "userId", title, icon, cover, parent_id AS "parentId",
                is_favorite AS "isFavorite", is_locked AS "isLocked",
                full_width AS "fullWidth", font_family AS "fontFamily",
                blocks, version, created_at AS "createdAt", updated_at AS "updatedAt"
         FROM pages
         WHERE user_id = $1 AND is_deleted = FALSE
         ORDER BY updated_at DESC`,
        [userId]
      );

      // Query trash
      const trashRes = await client.query(
        `SELECT id, user_id AS "userId", title, icon, blocks, deleted_at AS "deletedAt"
         FROM trash
         WHERE user_id = $1
         ORDER BY deleted_at DESC`,
        [userId]
      );

      // Query workspace settings
      const settingsRes = await client.query(
        `SELECT open_tabs AS "openTabs", active_page_id AS "activePageId", theme, updated_at AS "updatedAt"
         FROM workspace_settings
         WHERE user_id = $1`,
        [userId]
      );

      let effectiveUserId = userId;
      let finalPages = pagesRes.rows || [];
      let finalTrash = trashRes.rows || [];
      let finalSettings = settingsRes.rows[0] || null;

      // Notion REA Email Anchor: resolve the canonical account id from the
      // verified session email (never from a client supplied parameter).
      const userEmail = sessionEmail;
      if (finalPages.length === 0 && userEmail) {
        try {
          const decodedEmail = decodeURIComponent(userEmail).trim().toLowerCase();
          const altUserRes = await client.query(
            'SELECT id FROM users WHERE LOWER(email) = $1 AND id != $2 LIMIT 1',
            [decodedEmail, userId]
          );
          if (altUserRes.rows.length > 0) {
            effectiveUserId = altUserRes.rows[0].id;
            const altPagesRes = await client.query(
              `SELECT id, user_id AS "userId", title, icon, cover, parent_id AS "parentId",
                      is_favorite AS "isFavorite", is_locked AS "isLocked",
                      full_width AS "fullWidth", font_family AS "fontFamily",
                      blocks, version, created_at AS "createdAt", updated_at AS "updatedAt"
               FROM pages
               WHERE user_id = $1 AND is_deleted = FALSE
               ORDER BY updated_at DESC`,
              [effectiveUserId]
            );
            if (altPagesRes.rows.length > 0) {
              finalPages = altPagesRes.rows;
              const altTrashRes = await client.query(
                `SELECT id, user_id AS "userId", title, icon, blocks, deleted_at AS "deletedAt"
                 FROM trash
                 WHERE user_id = $1
                 ORDER BY deleted_at DESC`,
                [effectiveUserId]
              );
              finalTrash = altTrashRes.rows || [];
              const altSettingsRes = await client.query(
                `SELECT open_tabs AS "openTabs", active_page_id AS "activePageId", theme, updated_at AS "updatedAt"
                 FROM workspace_settings
                 WHERE user_id = $1`,
                [effectiveUserId]
              );
              finalSettings = altSettingsRes.rows[0] || null;
            }
          }
        } catch (e) {
          console.warn('[sync] Email anchor resolution notice:', e.message);
        }
      }

      return res.status(200).json({
        success: true,
        mode: 'cloud_postgres',
        serverTimestamp: Date.now(),
        resolvedUserId: effectiveUserId,
        pages: finalPages,
        trash: finalTrash,
        workspaceSettings: finalSettings
      });
    }

    // POST /api/sync - Push local pages and changes to PostgreSQL
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const sanitized = sanitizeSyncPayload(body);
      if (!sanitized.ok) {
        return res.status(400).json({ success: false, error: sanitized.error });
      }
      const { user, pages, trash, workspaceSettings } = sanitized.payload;
      const userId = sessionUserId;

      if (!userId || userId === 'guest') {
        return res.status(200).json({
          success: true,
          mode: 'guest_standby',
          message: 'Guest workspace is kept in local IndexedDB Vault only.',
          serverTimestamp: Date.now()
        });
      }

      const now = Date.now();

      await client.query('BEGIN');

      let targetUserId = userId;
      if (sessionEmail) {
        try {
          const cleanEmail = sessionEmail.trim().toLowerCase();
          const matchRes = await client.query(
            'SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1',
            [cleanEmail]
          );
          if (matchRes.rows.length > 0) {
            targetUserId = matchRes.rows[0].id;
          }
        } catch (e) {
          console.warn('[sync] Email resolution in POST notice:', e.message);
        }
      }

      // 1. Upsert User
      if (user) {
        await client.query(
          `INSERT INTO users (id, email, name, picture, avatar, color, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             email = EXCLUDED.email,
             name = EXCLUDED.name,
             picture = EXCLUDED.picture,
             avatar = EXCLUDED.avatar,
             color = EXCLUDED.color,
             updated_at = EXCLUDED.updated_at`,
          [
            targetUserId,
            user.email || sessionEmail,
            user.name || 'User',
            user.picture || null,
            user.avatar || 'U',
            user.color || '#2383e2',
            now,
            now
          ]
        );
      }

      // 2. Upsert Pages
      const activePageIds = [];
      for (const page of pages) {
        if (!page || !page.id) continue;
        activePageIds.push(page.id);

        await client.query(
          `INSERT INTO pages (
             id, user_id, title, icon, cover, parent_id,
             is_favorite, is_locked, full_width, font_family,
             blocks, version, created_at, updated_at, is_deleted
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, FALSE)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             icon = EXCLUDED.icon,
             cover = EXCLUDED.cover,
             parent_id = EXCLUDED.parent_id,
             is_favorite = EXCLUDED.is_favorite,
             is_locked = EXCLUDED.is_locked,
             full_width = EXCLUDED.full_width,
             font_family = EXCLUDED.font_family,
             blocks = EXCLUDED.blocks,
             version = pages.version + 1,
             updated_at = EXCLUDED.updated_at,
             is_deleted = FALSE`,
          [
            page.id,
            targetUserId,
            page.title || 'Untitled',
            page.icon || null,
            page.cover || null,
            page.parentId || null,
            Boolean(page.isFavorite),
            Boolean(page.isLocked),
            Boolean(page.fullWidth),
            page.fontFamily || 'sans',
            JSON.stringify(page.blocks || []),
            page.version || 1,
            page.createdAt || now,
            page.updatedAt || now
          ]
        );
      }

      // 3. Mark removed active pages as deleted if not in active pages
      if (activePageIds.length > 0) {
        await client.query(
          `UPDATE pages SET is_deleted = TRUE, updated_at = $1
           WHERE user_id = $2 AND NOT (id = ANY($3::text[]))`,
          [now, targetUserId, activePageIds]
        );
      }

      // 4. Upsert Trash
      for (const t of trash) {
        if (!t || !t.id) continue;
        await client.query(
          `INSERT INTO trash (id, user_id, title, icon, blocks, deleted_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             icon = EXCLUDED.icon,
             blocks = EXCLUDED.blocks,
             deleted_at = EXCLUDED.deleted_at`,
          [
            t.id,
            targetUserId,
            t.title || 'Deleted Page',
            t.icon || null,
            JSON.stringify(t.blocks || []),
            t.deletedAt || now
          ]
        );
      }

      // 5. Upsert Workspace Settings
      if (workspaceSettings) {
        await client.query(
          `INSERT INTO workspace_settings (user_id, open_tabs, active_page_id, theme, updated_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id) DO UPDATE SET
             open_tabs = EXCLUDED.open_tabs,
             active_page_id = EXCLUDED.active_page_id,
             theme = EXCLUDED.theme,
             updated_at = EXCLUDED.updated_at`,
          [
            targetUserId,
            JSON.stringify(workspaceSettings.openTabs || []),
            workspaceSettings.activePageId || null,
            workspaceSettings.theme || 'light',
            now
          ]
        );
      }

      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        mode: 'cloud_postgres',
        serverTimestamp: now,
        resolvedUserId: targetUserId,
        syncedPagesCount: pages.length,
        syncedTrashCount: trash.length
      });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Ignore rollback error
      }
    }
    console.error('PostgreSQL Sync API Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
      mode: 'fallback_to_vault'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}
