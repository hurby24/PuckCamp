import {
	text,
	pgTable,
	varchar,
	integer,
	boolean,
	timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: text("id").primaryKey(),
	username: varchar("username").unique().notNull(),
	email: varchar("email").unique().notNull(),
	password_hash: text("password_hash").notNull(),
	avatar_url: text("avatar_url").notNull(),
	banner_url: text("banner_url"),
	about_me: varchar("about_me"),
	points: integer("points").notNull().default(0),
	no_posts: integer("no_posts").notNull().default(0),
	no_comments: integer("no_comments").notNull().default(0),
	university_id: integer("university_id").notNull(),
	university_major: text("university_major"),
	university_year: integer("university_year"),
	is_admin: boolean("is_admin").notNull().default(false),
	is_banned: boolean("is_banned").notNull().default(false),
	is_email_verified: boolean("is_email_verified").notNull().default(false),
	last_seen_at: timestamp("last_seen_at", { precision: 6, withTimezone: true })
		.notNull()
		.defaultNow(),
	last_seen_ip: text("last_seen_ip"),
	updated_at: timestamp("updated_at", {
		precision: 6,
		withTimezone: true,
	})
		.notNull()
		.defaultNow(),
	created_at: timestamp("created_at", { precision: 6, withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const oauth_accounts = pgTable("oauth_accounts", {
	provider_user_id: text("provider_user_id").primaryKey(),
	user_id: text("user_id")
		.references(() => users.id, { onDelete: "cascade" })
		.notNull(),
	provider: text("provider").notNull(),
	created_at: timestamp("created_at", {
		precision: 6,
		withTimezone: true,
	})
		.notNull()
		.defaultNow(),
});

export const email_verification_codes = pgTable("email_verification_codes", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	user_id: text("user_id")
		.references(() => users.id, { onDelete: "cascade" })
		.unique()
		.notNull(),
	code: varchar("code").notNull(),
	email: varchar("email").notNull(),
	attempts_remaining: integer("attempts_remaining").notNull().default(3),
	expires_at: timestamp("expires_at", {
		precision: 6,
		withTimezone: true,
	}).notNull(),
});

export const password_reset_tokens = pgTable("password_reset_tokens", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	user_id: text("user_id")
		.references(() => users.id, { onDelete: "cascade" })
		.unique()
		.notNull(),
	token_hash: varchar("token_hash").notNull(),
	expires_at: timestamp("expires_at", {
		precision: 6,
		withTimezone: true,
	}).notNull(),
});
