CREATE TABLE demo_sessions (id TEXT PRIMARY KEY NOT NULL, join_token TEXT UNIQUE NOT NULL, created_at INTEGER NOT NULL, settings TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE demo_cameras (session_id TEXT NOT NULL, id TEXT NOT NULL, name TEXT NOT NULL, zone TEXT NOT NULL, online INTEGER NOT NULL DEFAULT 1, people INTEGER NOT NULL, scenario TEXT NOT NULL DEFAULT 'normal', scenario_started INTEGER, scenario_key TEXT, fired INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(session_id,id));
--> statement-breakpoint
CREATE TABLE demo_events (id TEXT PRIMARY KEY NOT NULL, session_id TEXT NOT NULL, camera_id TEXT NOT NULL, zone TEXT NOT NULL, type TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'pending', condition_at INTEGER NOT NULL, notified_at INTEGER NOT NULL, delivered_at INTEGER, ack_at INTEGER, arrived_at INTEGER, closed_at INTEGER, escalated_at INTEGER, owner TEXT NOT NULL DEFAULT '', result TEXT NOT NULL DEFAULT '', note TEXT NOT NULL DEFAULT '', deleted_at INTEGER);
--> statement-breakpoint
CREATE INDEX demo_events_session_idx ON demo_events(session_id,notified_at);
--> statement-breakpoint
CREATE TABLE demo_logs (id TEXT PRIMARY KEY NOT NULL, session_id TEXT NOT NULL, event_id TEXT, camera_id TEXT, at INTEGER NOT NULL, action TEXT NOT NULL, actor TEXT NOT NULL, detail TEXT NOT NULL);
--> statement-breakpoint
CREATE INDEX demo_logs_session_idx ON demo_logs(session_id,at);
