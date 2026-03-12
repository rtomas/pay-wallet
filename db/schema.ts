import { pgTable, text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const passkeyCredentials = pgTable(
  "passkey_credentials",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    publicKey: text("public_key").notNull(),
    counter: text("counter").notNull().default("0"),
    transports: text("transports"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("passkey_user_idx").on(table.userId)]
);

export const encryptedWallets = pgTable("encrypted_wallets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  iv: text("iv").notNull(),
  ciphertext: text("ciphertext").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const webauthnChallenges = pgTable("webauthn_challenges", {
  id: uuid("id").defaultRandom().primaryKey(),
  challenge: text("challenge").notNull(),
  userId: uuid("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
