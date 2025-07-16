
import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  varchar,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';
import type { AdapterAccount } from 'next-auth/adapters';

export const users = pgTable('dueliax_users', {
  id: text('id').notNull().primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  password: text('password'),
  role: text('role', { enum: ['USER', 'ADMIN'] }).default('USER').notNull(),
  keys: integer('keys').default(5).notNull(),
  duelsCreated: integer('duels_created').default(0).notNull(),
  votesCast: integer('votes_cast').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

export const accounts = pgTable(
  'dueliax_accounts',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccount['type']>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const duelOptions = pgTable('dueliax_duel_options', {
    id: varchar('id', { length: 255 }).primaryKey(),
    duelId: varchar('duel_id', { length: 255 }).notNull().references(() => duels.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    imageUrl: text('image_url'),
    affiliateUrl: text('affiliate_url'),
    votes: integer('votes').default(0).notNull(),
});

export const duels = pgTable('dueliax_duels', {
    id: varchar('id', { length: 255 }).primaryKey(),
    type: text('type', { enum: ['A_VS_B', 'LIST'] }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    creatorId: text('creator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    status: text('status', { enum: ['ACTIVE', 'CLOSED', 'SCHEDULED', 'DRAFT', 'INACTIVE'] }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true, mode: 'date' }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true, mode: 'date' }).notNull(),
    // Drizzle doesn't have a direct JSON array type, so we use jsonb for options
    options: jsonb('options').$type<Array<{ id: string; title: string; imageUrl?: string; affiliateUrl?: string; votes: number }>>().notNull(),
});
