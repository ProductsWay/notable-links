import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    imageUrl: text("image_url"),
  },
  (categories) => ({
    nameIdx: index("name_idx").on(categories.name),
  }),
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  links: many(links),
}));

export const links = sqliteTable(
  "links",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    url: text("url").notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    userId: text("user_id").references(() => users.id),
    createdAt: integer("created_at").default(sql`(cast (unixepoch () as int))`),
    updatedAt: integer("updated_at").default(sql`(cast (unixepoch () as int))`),
  },
  (links) => ({
    idIdx: uniqueIndex("id_idx").on(links.id),
    urlIdx: index("url_idx").on(links.url),
    categoryIdIdx: index("category_id_idx").on(links.categoryId),
    userIdIdx: index("user_id_idx").on(links.userId),
  }),
);

export const linksRelations = relations(links, ({ one }) => ({
  category: one(categories, {
    fields: [links.categoryId],
    references: [categories.id],
  }),
  user: one(users, {
    fields: [links.userId],
    references: [users.id],
  }),
}));

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    firstName: text("firstName").notNull(),
    lastName: text("lastName").notNull(),
    email: text("email").notNull(),
    hash: text("hash").notNull(),
    isAdmin: integer("is_admin").notNull().default(0),
    address: text("address"),
    phone: text("phone"),
    avatar: text("avatar"),
    createdAt: integer("created_at").default(sql`(cast (unixepoch () as int))`),
    updatedAt: integer("updated_at").default(sql`(cast (unixepoch () as int))`),
  },
  (users) => ({
    emailIdx: uniqueIndex("email_idx").on(users.email),
    firstNameLastNameAddressIdx: index("first_name_last_name_address_idx").on(
      users.firstName,
      users.lastName,
      users.address,
    ),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  links: many(links),
}));
