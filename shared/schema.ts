import { pgTable, text, uuid, boolean, integer, real, jsonb, timestamp, primaryKey, index } from "drizzle-orm/pg-core";

export const prompts = pgTable("prompts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  tags: text("tags").array().default([]),
  body: text("body").notNull(),
  variables: text("variables").array().default([]),
  model: text("model"),
  favorite: boolean("favorite").default(false),
  usageCount: integer("usage_count").default(0),
  versions: jsonb("versions").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("prompts_user_id_idx").on(t.userId)]);

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  role: text("role"),
  systemPrompt: text("system_prompt").notNull(),
  tools: text("tools").array().default([]),
  model: text("model"),
  temperature: real("temperature").default(0.7),
  status: text("status").default("draft"),
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("agents_user_id_idx").on(t.userId)]);

export const components = pgTable("components", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  tags: text("tags").array().default([]),
  code: text("code").notNull(),
  dependencies: text("dependencies").array().default([]),
  favorite: boolean("favorite").default(false),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("components_user_id_idx").on(t.userId)]);

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  stack: text("stack").array().default([]),
  tags: text("tags").array().default([]),
  structure: text("structure"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("templates_user_id_idx").on(t.userId)]);

export const snippets = pgTable("snippets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  language: text("language").notNull(),
  description: text("description"),
  code: text("code").notNull(),
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("snippets_user_id_idx").on(t.userId)]);

export const connectors = pgTable("connectors", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("connectors_user_id_idx").on(t.userId)]);

export const socialDrafts = pgTable("social_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  platform: text("platform").notNull(),
  content: text("content").notNull(),
  mediaUrls: text("media_urls").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("social_drafts_user_id_idx").on(t.userId)]);

export const mailTemplates = pgTable("mail_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  channel: text("channel").notNull(),
  subject: text("subject"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("mail_templates_user_id_idx").on(t.userId)]);

export const interviewQuestions = pgTable("interview_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  difficulty: text("difficulty"),
  domain: text("domain").notNull(),
  tags: text("tags").array().default([]),
  isGlobal: boolean("is_global").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("interview_questions_user_id_idx").on(t.userId),
  index("interview_questions_is_global_idx").on(t.isGlobal),
]);

export const userProfiles = pgTable("user_profiles", {
  userId: text("user_id").primaryKey(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  location: text("location"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const savedJobs = pgTable("saved_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  company: text("company").default(""),
  location: text("location").default(""),
  url: text("url").default(""),
  platform: text("platform").default(""),
  status: text("status").default("saved"),
  salary: text("salary").default(""),
  remote: boolean("remote").default(false),
  tags: text("tags").array().default([]),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("saved_jobs_user_id_idx").on(t.userId)]);

export const freelanceOffers = pgTable("freelance_offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  client: text("client").default(""),
  platform: text("platform").default(""),
  budget: text("budget").default(""),
  currency: text("currency").default("USD"),
  status: text("status").default("new"),
  description: text("description").default(""),
  url: text("url").default(""),
  deadline: text("deadline").default(""),
  tags: text("tags").array().default([]),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("freelance_offers_user_id_idx").on(t.userId)]);

export const myServices = pgTable("my_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  platform: text("platform").default(""),
  url: text("url").default(""),
  category: text("category").default(""),
  price: text("price").default(""),
  currency: text("currency").default("USD"),
  status: text("status").default("active"),
  description: text("description").default(""),
  deliveryDays: integer("delivery_days").default(3),
  tags: text("tags").array().default([]),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("my_services_user_id_idx").on(t.userId)]);

export const userProgress = pgTable("user_progress", {
  userId: text("user_id").notNull(),
  itemId: text("item_id").notNull(),
  areaId: text("area_id").notNull(),
  completed: boolean("completed").default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.itemId] }),
  index("user_progress_user_id_idx").on(t.userId),
]);
