import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address").unique(),
  profilePic: text("profile_pic").default("/default-avatar.png"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  feeling: text("feeling"),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const postCategories = pgTable("post_categories", {
  postId: integer("post_id").notNull().references(() => posts.id),
  categoryId: integer("category_id").notNull().references(() => categories.id),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
  profilePic: true,
  bio: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  userId: true,
  imageUrl: true,
  caption: true,
  feeling: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  postId: true,
  userId: true,
  text: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
