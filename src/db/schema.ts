import { boolean, index, integer, pgTable, primaryKey, unique, varchar } from "drizzle-orm/pg-core";


export const usersTable = pgTable("users", {
    id: varchar("id", {length: 100}).primaryKey(),
    name: varchar("name",{ length: 100 }).notNull(),
    email: varchar("email").unique().notNull(),
    password: varchar("password", { length: 100 }).notNull()
})
export const studentTable = pgTable("student", {
    id: varchar("id", {length: 100}).references(() => usersTable.id).primaryKey(),
    college: varchar("college", { length: 100}).notNull(),
    stream: varchar("stream", {length: 100}).notNull(),
    year: integer("year").notNull()
})

export const adminTable = pgTable("admin", {
    id: varchar("id", {length: 100}).references(() => usersTable.id).primaryKey(),
    name: varchar("name", { length: 100 }).notNull()
})

export const eventsTable = pgTable("events", {
    id: varchar("id", { length: 100 }).primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    description: varchar("description", { length: 255 }),
    date: varchar("date", { length: 100 }),
    status: varchar("status", { length: 20 }).notNull(),
    createdBy: varchar("created_by", { length: 100 }).references(() => usersTable.id).notNull(),
    createdAt: varchar("created_at", { length: 100 }).notNull(),
    adminCode: varchar("admin_code", { length: 50 }).unique()
}, (table) => ({
    createdByIdx: index("events_created_by_idx").on(table.createdBy)
}))

export const eventMembersTable = pgTable("event_members", {
    userId: varchar("userid", { length: 100 }).references(() => usersTable.id).notNull(),
    eventId: varchar("eventid", { length: 100 }).references(() => eventsTable.id).notNull(),
    role: varchar("role", { length: 20 }).notNull(),
    joinedAt: varchar("joined_at", { length: 100 }).notNull()
}, (table) => ({
    pk: primaryKey({ columns: [table.eventId, table.userId] }),
    userIdIdx: index("event_members_userid_idx").on(table.userId),
    eventIdIdx: index("event_members_eventid_idx").on(table.eventId)
}))

export const ticketTable = pgTable("tickets", {
    id: varchar("id", {length: 100}).primaryKey(), //gen random uuid
    title: varchar("title", {length: 100}).notNull(),
    userId: varchar("userid", {length: 100}).references(() => studentTable.id).notNull(),
    eventId: varchar("eventid", {length: 100}).references(() => eventsTable.id).notNull(),
    adminId: varchar("adminid", {length: 100}).references(() => adminTable.id),
    scannedBy: varchar("scanned_by", {length: 100}).references(() => usersTable.id),
    isValid: boolean("isvalid"),
    createdAt: varchar("createdat", {length: 100}).notNull(),
    scannedAt: varchar("scanned_at", {length: 100})
}, (table) => ({
    userEventUnique: unique().on(table.userId, table.eventId),
    userIdIdx: index("tickets_userid_idx").on(table.userId),
    eventIdIdx: index("tickets_eventid_idx").on(table.eventId)
}))
export const descriptionsTable = pgTable("descriptions", {
    id: varchar("id", {length: 100}).references(() => ticketTable.id).primaryKey(),
    header: varchar("header", {length : 100}).notNull(),
    description: varchar("description", {length : 100}).notNull(),
    footer: varchar("footer", {length : 100}).notNull(),
})
