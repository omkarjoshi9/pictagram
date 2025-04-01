import { 
  users, 
  posts, 
  comments, 
  categories, 
  postCategories,
  conversations,
  conversationParticipants,
  messages,
  type User, 
  type InsertUser,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type Category,
  type InsertCategory,
  type Conversation,
  type InsertConversation,
  type ConversationParticipant,
  type InsertConversationParticipant,
  type Message,
  type InsertMessage
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
  
  // Conversation operations
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: number): Promise<Conversation[]>;
  getConversationByUsers(user1Id: number, user2Id: number): Promise<Conversation | undefined>;
  createConversation(): Promise<Conversation>;
  updateConversationLastMessageTime(id: number): Promise<Conversation | undefined>;
  
  // Conversation participants operations
  addConversationParticipant(participant: InsertConversationParticipant): Promise<ConversationParticipant>;
  getConversationParticipants(conversationId: number): Promise<ConversationParticipant[]>;
  
  // Message operations
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
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
  
  // Conversation operations
  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }
  
  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    // Find all conversations where the user is a participant
    const participantRecords = await db
      .select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.userId, userId));
    
    if (participantRecords.length === 0) {
      return [];
    }
    
    const conversationIds = participantRecords.map(record => record.conversationId);
    
    // Get all conversations
    return db
      .select()
      .from(conversations)
      .where(inArray(conversations.id, conversationIds))
      .orderBy(desc(conversations.lastMessageAt));
  }
  
  async getConversationByUsers(user1Id: number, user2Id: number): Promise<Conversation | undefined> {
    // Find conversations where both users are participants
    const user1Conversations = await db
      .select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.userId, user1Id));
    
    if (user1Conversations.length === 0) {
      return undefined;
    }
    
    const user1ConversationIds = user1Conversations.map(record => record.conversationId);
    
    // Find conversations where user2 is also a participant
    const user2Participants = await db
      .select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.userId, user2Id),
          inArray(conversationParticipants.conversationId, user1ConversationIds)
        )
      );
    
    if (user2Participants.length === 0) {
      return undefined;
    }
    
    // Get the first matching conversation
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, user2Participants[0].conversationId));
    
    return conversation;
  }
  
  async createConversation(): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values({})
      .returning();
    return conversation;
  }
  
  async updateConversationLastMessageTime(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return conversation;
  }
  
  // Conversation participants operations
  async addConversationParticipant(participant: InsertConversationParticipant): Promise<ConversationParticipant> {
    const [newParticipant] = await db
      .insert(conversationParticipants)
      .values(participant)
      .returning();
    return newParticipant;
  }
  
  async getConversationParticipants(conversationId: number): Promise<ConversationParticipant[]> {
    return db
      .select()
      .from(conversationParticipants)
      .where(eq(conversationParticipants.conversationId, conversationId));
  }
  
  // Message operations
  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }
  
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const [message] = await db
      .update(messages)
      .set({ read: true })
      .where(eq(messages.id, id))
      .returning();
    return message;
  }
}

export const storage = new DatabaseStorage();
