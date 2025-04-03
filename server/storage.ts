import { 
  users, 
  posts, 
  comments, 
  categories, 
  postCategories,
  conversations,
  conversationParticipants,
  messages,
  postLikes,
  bookmarks,
  notifications,
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
  type InsertMessage,
  type PostLike,
  type InsertPostLike,
  type Bookmark,
  type InsertBookmark,
  type Notification,
  type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, desc, sql, like, or, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  searchUsers(query: string): Promise<User[]>;
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
  getSavedPosts(userId: number): Promise<Post[]>;
  
  // Post like operations
  getLikeStatus(postId: number, userId: number): Promise<boolean>;
  addLike(postId: number, userId: number): Promise<PostLike>;
  removeLike(postId: number, userId: number): Promise<boolean>;
  
  // Bookmark operations
  getBookmarkStatus(postId: number, userId: number): Promise<boolean>;
  addBookmark(postId: number, userId: number): Promise<Bookmark>;
  removeBookmark(postId: number, userId: number): Promise<boolean>;

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
  
  // Notification operations
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  deleteNotification(id: number): Promise<boolean>;
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

  async searchUsers(query: string): Promise<User[]> {
    if (!query || query.trim() === '') {
      return db.select().from(users).limit(10);
    }
    
    // Search by username or wallet address with case-insensitive pattern matching
    return db
      .select()
      .from(users)
      .where(
        or(
          like(users.username, `%${query}%`),
          like(users.walletAddress, `%${query}%`)
        )
      )
      .limit(20);
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
    // First, delete all related records in dependent tables
    // Delete comments for this post
    await db.delete(comments).where(eq(comments.postId, id));
    
    // Delete post categories
    await db.delete(postCategories).where(eq(postCategories.postId, id));
    
    // Delete post likes
    await db.delete(postLikes).where(eq(postLikes.postId, id));
    
    // Delete bookmarks
    await db.delete(bookmarks).where(eq(bookmarks.postId, id));
    
    // Finally delete the post itself
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
  
  async getSavedPosts(userId: number): Promise<Post[]> {
    const savedPostIds = await db
      .select({ postId: bookmarks.postId })
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId));
    
    if (savedPostIds.length === 0) {
      return [];
    }
    
    const postIds = savedPostIds.map(record => record.postId);
    
    return db
      .select()
      .from(posts)
      .where(inArray(posts.id, postIds))
      .orderBy(desc(posts.createdAt));
  }
  
  // Post like operations
  async getLikeStatus(postId: number, userId: number): Promise<boolean> {
    const [like] = await db
      .select()
      .from(postLikes)
      .where(
        and(
          eq(postLikes.postId, postId),
          eq(postLikes.userId, userId)
        )
      );
    
    return like !== undefined;
  }
  
  async addLike(postId: number, userId: number): Promise<PostLike> {
    // Check if like already exists
    const likeExists = await this.getLikeStatus(postId, userId);
    
    if (likeExists) {
      // If like already exists, fetch and return it
      const [existingLike] = await db
        .select()
        .from(postLikes)
        .where(
          and(
            eq(postLikes.postId, postId),
            eq(postLikes.userId, userId)
          )
        );
      
      return existingLike;
    }
    
    // Increment post likes count
    await db
      .update(posts)
      .set({ likes: sql`${posts.likes} + 1` })
      .where(eq(posts.id, postId));
    
    // Add like record
    const [newLike] = await db
      .insert(postLikes)
      .values({ postId, userId })
      .returning();
    
    return newLike;
  }
  
  async removeLike(postId: number, userId: number): Promise<boolean> {
    // Check if like exists
    const likeExists = await this.getLikeStatus(postId, userId);
    
    if (!likeExists) {
      return false;
    }
    
    // Decrement post likes count (ensuring it doesn't go below 0)
    await db
      .update(posts)
      .set({ likes: sql`GREATEST(${posts.likes} - 1, 0)` })
      .where(eq(posts.id, postId));
    
    // Remove like record
    await db
      .delete(postLikes)
      .where(
        and(
          eq(postLikes.postId, postId),
          eq(postLikes.userId, userId)
        )
      );
    
    return true;
  }
  
  // Bookmark operations
  async getBookmarkStatus(postId: number, userId: number): Promise<boolean> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.postId, postId),
          eq(bookmarks.userId, userId)
        )
      );
    
    return bookmark !== undefined;
  }
  
  async addBookmark(postId: number, userId: number): Promise<Bookmark> {
    // Check if bookmark already exists
    const bookmarkExists = await this.getBookmarkStatus(postId, userId);
    
    if (bookmarkExists) {
      // If bookmark already exists, fetch and return it
      const [existingBookmark] = await db
        .select()
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.postId, postId),
            eq(bookmarks.userId, userId)
          )
        );
      
      return existingBookmark;
    }
    
    // Add bookmark record
    const [newBookmark] = await db
      .insert(bookmarks)
      .values({ postId, userId })
      .returning();
    
    return newBookmark;
  }
  
  async removeBookmark(postId: number, userId: number): Promise<boolean> {
    // Check if bookmark exists
    const bookmarkExists = await this.getBookmarkStatus(postId, userId);
    
    if (!bookmarkExists) {
      return false;
    }
    
    // Remove bookmark record
    await db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.postId, postId),
          eq(bookmarks.userId, userId)
        )
      );
    
    return true;
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

  // Notification operations
  async getNotifications(userId: number): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: number): Promise<boolean> {
    await db.delete(notifications).where(eq(notifications.id, id));
    
    // Verify the notification was deleted
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification === undefined;
  }
}

export const storage = new DatabaseStorage();
