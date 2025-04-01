import { 
  users, 
  posts, 
  comments, 
  categories, 
  postCategories,
  type User, 
  type InsertUser,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type Category,
  type InsertCategory
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Post operations
  getPost(id: number): Promise<Post | undefined>;
  getPosts(): Promise<Post[]>;
  getPostsByUser(userId: number): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  likePost(id: number): Promise<Post | undefined>;

  // Comment operations
  getComments(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  addPostCategory(postId: number, categoryId: number): Promise<void>;
  getPostCategories(postId: number): Promise<Category[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Post operations
  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async getPosts(): Promise<Post[]> {
    return db.select().from(posts).orderBy(desc(posts.createdAt));
  }

  async getPostsByUser(userId: number): Promise<Post[]> {
    return db.select().from(posts).where(eq(posts.userId, userId)).orderBy(desc(posts.createdAt));
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async updatePost(id: number, postData: Partial<InsertPost>): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set(postData)
      .where(eq(posts.id, id))
      .returning();
    return post;
  }

  async deletePost(id: number): Promise<boolean> {
    await db.delete(posts).where(eq(posts.id, id));
    // Check if the post still exists after deletion attempt
    const post = await this.getPost(id);
    return post === undefined;
  }

  async likePost(id: number): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set({ likes: sql`${posts.likes} + 1` })
      .where(eq(posts.id, id))
      .returning();
    return post;
  }

  // Comment operations
  async getComments(postId: number): Promise<Comment[]> {
    return db.select().from(comments).where(eq(comments.postId, postId)).orderBy(desc(comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async deleteComment(id: number): Promise<boolean> {
    await db.delete(comments).where(eq(comments.id, id));
    // Check if the comment still exists after deletion attempt
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment === undefined;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.name, name));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async addPostCategory(postId: number, categoryId: number): Promise<void> {
    await db.insert(postCategories).values({ postId, categoryId });
  }

  async getPostCategories(postId: number): Promise<Category[]> {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name
      })
      .from(postCategories)
      .innerJoin(categories, eq(postCategories.categoryId, categories.id))
      .where(eq(postCategories.postId, postId));
    
    return result;
  }
}

export const storage = new DatabaseStorage();
