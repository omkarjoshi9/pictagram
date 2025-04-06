import { drizzle } from 'drizzle-orm/neon-serverless';
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
  type InsertBookmark
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, desc, sql, like, or } from "drizzle-orm";

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
}

export class DatabaseStorage implements IStorage {
  // Helper method to check database availability
  private async checkDb() {
    if (!db) {
      console.error('Database connection not available');
      throw new Error('Database connection not available. Please check environment variables.');
    }
    // Type assertion to satisfy TypeScript
    return db as ReturnType<typeof drizzle>;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const dbInstance = await this.checkDb();
      const [user] = await dbInstance.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error in getUser:', error);
      if (process.env.NODE_ENV === 'production') {
        return undefined; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const dbInstance = await this.checkDb();
      const [user] = await dbInstance.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      if (process.env.NODE_ENV === 'production') {
        return undefined; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    try {
      const dbInstance = await this.checkDb();
      const [user] = await dbInstance.select().from(users).where(eq(users.walletAddress, walletAddress));
      return user;
    } catch (error) {
      console.error('Error in getUserByWalletAddress:', error);
      if (process.env.NODE_ENV === 'production') {
        return undefined; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    try {
      const dbInstance = await this.checkDb();
      
      if (!query || query.trim() === '') {
        return dbInstance.select().from(users).limit(10);
      }
      
      // Search by username or wallet address with case-insensitive pattern matching
      return dbInstance
        .select()
        .from(users)
        .where(
          or(
            like(users.username, `%${query}%`),
            like(users.walletAddress, `%${query}%`)
          )
        )
        .limit(20);
    } catch (error) {
      console.error('Error in searchUsers:', error);
      if (process.env.NODE_ENV === 'production') {
        return []; // Return empty array in production
      }
      throw error; // Rethrow in development
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const dbInstance = await this.checkDb();
      
      // Add extra logging for wallet-based auth debugging
      console.log(`Creating user with wallet address: ${insertUser.walletAddress || 'undefined'}`);
      
      const [user] = await dbInstance.insert(users).values(insertUser).returning();
      console.log(`User created successfully with ID: ${user.id}`);
      return user;
    } catch (error) {
      console.error('Error in createUser:', error);
      
      // Handle database errors more gracefully
      if (error instanceof Error) {
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          const walletAddress = insertUser.walletAddress || '';
          console.warn(`User with wallet address ${walletAddress} already exists`);
          
          // Try to fetch the existing user
          if (walletAddress) {
            try {
              const existingUser = await this.getUserByWalletAddress(walletAddress);
              if (existingUser) {
                console.log(`Returning existing user with ID: ${existingUser.id}`);
                return existingUser;
              }
            } catch (fetchError) {
              console.error('Error fetching existing user:', fetchError);
            }
          }
        }
      }
      
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const dbInstance = await this.checkDb();
      const [user] = await dbInstance
        .update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      return user;
    } catch (error) {
      console.error('Error in updateUser:', error);
      if (process.env.NODE_ENV === 'production') {
        return undefined; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }

  // Post operations
  async getPost(id: number): Promise<Post | undefined> {
    try {
      const dbInstance = await this.checkDb();
      const [post] = await dbInstance.select().from(posts).where(eq(posts.id, id));
      return post;
    } catch (error) {
      console.error('Error in getPost:', error);
      if (process.env.NODE_ENV === 'production') {
        return undefined; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }

  async getPosts(): Promise<Post[]> {
    try {
      const dbInstance = await this.checkDb();
      return dbInstance.select().from(posts).orderBy(desc(posts.createdAt));
    } catch (error) {
      console.error('Error in getPosts:', error);
      if (process.env.NODE_ENV === 'production') {
        return []; // Return empty array in production
      }
      throw error; // Rethrow in development
    }
  }

  async getPostsByUser(userId: number): Promise<Post[]> {
    try {
      const dbInstance = await this.checkDb();
      return dbInstance.select().from(posts).where(eq(posts.userId, userId)).orderBy(desc(posts.createdAt));
    } catch (error) {
      console.error('Error in getPostsByUser:', error);
      if (process.env.NODE_ENV === 'production') {
        return []; // Return empty array in production
      }
      throw error; // Rethrow in development
    }
  }

  async createPost(post: InsertPost): Promise<Post> {
    try {
      const dbInstance = await this.checkDb();
      const [newPost] = await dbInstance.insert(posts).values(post).returning();
      return newPost;
    } catch (error) {
      console.error('Error in createPost:', error);
      throw error;
    }
  }

  async updatePost(id: number, postData: Partial<InsertPost>): Promise<Post | undefined> {
    try {
      const dbInstance = await this.checkDb();
      const [post] = await dbInstance
        .update(posts)
        .set(postData)
        .where(eq(posts.id, id))
        .returning();
      return post;
    } catch (error) {
      console.error('Error in updatePost:', error);
      if (process.env.NODE_ENV === 'production') {
        return undefined; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }

  async deletePost(id: number): Promise<boolean> {
    try {
      const dbInstance = await this.checkDb();
      
      // First, delete all related records in dependent tables
      // Delete comments for this post
      await dbInstance.delete(comments).where(eq(comments.postId, id));
      
      // Delete post categories
      await dbInstance.delete(postCategories).where(eq(postCategories.postId, id));
      
      // Delete post likes
      await dbInstance.delete(postLikes).where(eq(postLikes.postId, id));
      
      // Delete bookmarks
      await dbInstance.delete(bookmarks).where(eq(bookmarks.postId, id));
      
      // Finally delete the post itself
      await dbInstance.delete(posts).where(eq(posts.id, id));
      
      // Check if the post still exists after deletion attempt
      const post = await this.getPost(id);
      return post === undefined;
    } catch (error) {
      console.error('Error in deletePost:', error);
      if (process.env.NODE_ENV === 'production') {
        return false; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }

  async likePost(id: number): Promise<Post | undefined> {
    try {
      const dbInstance = await this.checkDb();
      const [post] = await dbInstance
        .update(posts)
        .set({ likes: sql`${posts.likes} + 1` })
        .where(eq(posts.id, id))
        .returning();
      return post;
    } catch (error) {
      console.error('Error in likePost:', error);
      if (process.env.NODE_ENV === 'production') {
        return undefined; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }
  
  async getSavedPosts(userId: number): Promise<Post[]> {
    try {
      const dbInstance = await this.checkDb();
      
      const savedPostIds = await dbInstance
        .select({ postId: bookmarks.postId })
        .from(bookmarks)
        .where(eq(bookmarks.userId, userId));
      
      if (savedPostIds.length === 0) {
        return [];
      }
      
      const postIds = savedPostIds.map(record => record.postId);
      
      return await dbInstance
        .select()
        .from(posts)
        .where(inArray(posts.id, postIds))
        .orderBy(desc(posts.createdAt));
    } catch (error) {
      console.error('Error in getSavedPosts:', error);
      if (process.env.NODE_ENV === 'production') {
        return []; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }
  
  // Post like operations
  async getLikeStatus(postId: number, userId: number): Promise<boolean> {
    try {
      const dbInstance = await this.checkDb();
      const [like] = await dbInstance
        .select()
        .from(postLikes)
        .where(
          and(
            eq(postLikes.postId, postId),
            eq(postLikes.userId, userId)
          )
        );
      
      return like !== undefined;
    } catch (error) {
      console.error('Error in getLikeStatus:', error);
      if (process.env.NODE_ENV === 'production') {
        return false; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }
  
  async addLike(postId: number, userId: number): Promise<PostLike> {
    try {
      const dbInstance = await this.checkDb();
      
      // Check if like already exists
      const likeExists = await this.getLikeStatus(postId, userId);
      
      if (likeExists) {
        // If like already exists, fetch and return it
        const [existingLike] = await dbInstance
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
      await dbInstance
        .update(posts)
        .set({ likes: sql`${posts.likes} + 1` })
        .where(eq(posts.id, postId));
      
      // Add like record
      const [newLike] = await dbInstance
        .insert(postLikes)
        .values({ postId, userId })
        .returning();
      
      return newLike;
    } catch (error) {
      console.error('Error in addLike:', error);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to add like'); // In this case, we should throw an error since we can't return a valid like
      }
      throw error; // Rethrow in development
    }
  }
  
  async removeLike(postId: number, userId: number): Promise<boolean> {
    try {
      const dbInstance = await this.checkDb();
      
      // Check if like exists
      const likeExists = await this.getLikeStatus(postId, userId);
      
      if (!likeExists) {
        return false;
      }
      
      // Decrement post likes count (ensuring it doesn't go below 0)
      await dbInstance
        .update(posts)
        .set({ likes: sql`GREATEST(${posts.likes} - 1, 0)` })
        .where(eq(posts.id, postId));
      
      // Remove like record
      await dbInstance
        .delete(postLikes)
        .where(
          and(
            eq(postLikes.postId, postId),
            eq(postLikes.userId, userId)
          )
        );
      
      return true;
    } catch (error) {
      console.error('Error in removeLike:', error);
      if (process.env.NODE_ENV === 'production') {
        return false; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }
  
  // Bookmark operations
  async getBookmarkStatus(postId: number, userId: number): Promise<boolean> {
    try {
      const dbInstance = await this.checkDb();
      
      const [bookmark] = await dbInstance
        .select()
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.postId, postId),
            eq(bookmarks.userId, userId)
          )
        );
      
      return bookmark !== undefined;
    } catch (error) {
      console.error('Error in getBookmarkStatus:', error);
      if (process.env.NODE_ENV === 'production') {
        return false; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }
  
  async addBookmark(postId: number, userId: number): Promise<Bookmark> {
    try {
      const dbInstance = await this.checkDb();
      
      // Check if bookmark already exists
      const bookmarkExists = await this.getBookmarkStatus(postId, userId);
      
      if (bookmarkExists) {
        // If bookmark already exists, fetch and return it
        const [existingBookmark] = await dbInstance
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
      const [newBookmark] = await dbInstance
        .insert(bookmarks)
        .values({ postId, userId })
        .returning();
      
      return newBookmark;
    } catch (error) {
      console.error('Error in addBookmark:', error);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to add bookmark'); // We need to throw an error since we can't return a valid bookmark
      }
      throw error; // Rethrow in development
    }
  }
  
  async removeBookmark(postId: number, userId: number): Promise<boolean> {
    try {
      const dbInstance = await this.checkDb();
      
      // Check if bookmark exists
      const bookmarkExists = await this.getBookmarkStatus(postId, userId);
      
      if (!bookmarkExists) {
        return false;
      }
      
      // Remove bookmark record
      await dbInstance
        .delete(bookmarks)
        .where(
          and(
            eq(bookmarks.postId, postId),
            eq(bookmarks.userId, userId)
          )
        );
      
      return true;
    } catch (error) {
      console.error('Error in removeBookmark:', error);
      if (process.env.NODE_ENV === 'production') {
        return false; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }

  // Comment operations
  async getComments(postId: number): Promise<Comment[]> {
    try {
      const dbInstance = await this.checkDb();
      return dbInstance
        .select()
        .from(comments)
        .where(eq(comments.postId, postId))
        .orderBy(desc(comments.createdAt));
    } catch (error) {
      console.error('Error in getComments:', error);
      if (process.env.NODE_ENV === 'production') {
        return []; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    try {
      const dbInstance = await this.checkDb();
      const [newComment] = await dbInstance.insert(comments).values(comment).returning();
      return newComment;
    } catch (error) {
      console.error('Error in createComment:', error);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to create comment'); // We need to throw an error since we can't return a valid comment
      }
      throw error; // Rethrow in development
    }
  }

  async deleteComment(id: number): Promise<boolean> {
    try {
      const dbInstance = await this.checkDb();
      
      await dbInstance.delete(comments).where(eq(comments.id, id));
      
      // Check if the comment still exists after deletion attempt
      const [comment] = await dbInstance.select().from(comments).where(eq(comments.id, id));
      
      return comment === undefined;
    } catch (error) {
      console.error('Error in deleteComment:', error);
      if (process.env.NODE_ENV === 'production') {
        return false; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    try {
      const dbInstance = await this.checkDb();
      return dbInstance.select().from(categories);
    } catch (error) {
      console.error('Error in getCategories:', error);
      if (process.env.NODE_ENV === 'production') {
        return []; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    try {
      const dbInstance = await this.checkDb();
      const [category] = await dbInstance.select().from(categories).where(eq(categories.name, name));
      return category;
    } catch (error) {
      console.error('Error in getCategoryByName:', error);
      if (process.env.NODE_ENV === 'production') {
        return undefined; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    try {
      const dbInstance = await this.checkDb();
      const [newCategory] = await dbInstance.insert(categories).values(category).returning();
      return newCategory;
    } catch (error) {
      console.error('Error in createCategory:', error);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to create category');
      }
      throw error; // Rethrow in development
    }
  }

  async addPostCategory(postId: number, categoryId: number): Promise<void> {
    try {
      const dbInstance = await this.checkDb();
      await dbInstance.insert(postCategories).values({ postId, categoryId });
    } catch (error) {
      console.error('Error in addPostCategory:', error);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to add post category');
      }
      throw error; // Rethrow in development
    }
  }

  async getPostCategories(postId: number): Promise<Category[]> {
    try {
      const dbInstance = await this.checkDb();
      const result = await dbInstance
        .select({
          id: categories.id,
          name: categories.name
        })
        .from(postCategories)
        .innerJoin(categories, eq(postCategories.categoryId, categories.id))
        .where(eq(postCategories.postId, postId));
      
      return result;
    } catch (error) {
      console.error('Error in getPostCategories:', error);
      if (process.env.NODE_ENV === 'production') {
        return []; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }
  
  // Conversation operations
  async getConversation(id: number): Promise<Conversation | undefined> {
    try {
      const dbInstance = await this.checkDb();
      const [conversation] = await dbInstance.select().from(conversations).where(eq(conversations.id, id));
      return conversation;
    } catch (error) {
      console.error('Error in getConversation:', error);
      if (process.env.NODE_ENV === 'production') {
        return undefined; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }
  
  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    try {
      const dbInstance = await this.checkDb();
      
      // Find all conversations where the user is a participant
      const participantRecords = await dbInstance
        .select({ conversationId: conversationParticipants.conversationId })
        .from(conversationParticipants)
        .where(eq(conversationParticipants.userId, userId));
      
      if (participantRecords.length === 0) {
        return [];
      }
      
      const conversationIds = participantRecords.map(record => record.conversationId);
      
      // Get all conversations
      return dbInstance
        .select()
        .from(conversations)
        .where(inArray(conversations.id, conversationIds))
        .orderBy(desc(conversations.lastMessageAt));
    } catch (error) {
      console.error('Error in getConversationsByUserId:', error);
      if (process.env.NODE_ENV === 'production') {
        return []; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }
  
  async getConversationByUsers(user1Id: number, user2Id: number): Promise<Conversation | undefined> {
    try {
      const dbInstance = await this.checkDb();
      
      // Find conversations where both users are participants
      const user1Conversations = await dbInstance
        .select({ conversationId: conversationParticipants.conversationId })
        .from(conversationParticipants)
        .where(eq(conversationParticipants.userId, user1Id));
      
      if (user1Conversations.length === 0) {
        return undefined;
      }
      
      const user1ConversationIds = user1Conversations.map(record => record.conversationId);
      
      // Find conversations where user2 is also a participant
      const user2Participants = await dbInstance
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
      const [conversation] = await dbInstance
        .select()
        .from(conversations)
        .where(eq(conversations.id, user2Participants[0].conversationId));
      
      return conversation;
    } catch (error) {
      console.error('Error in getConversationByUsers:', error);
      if (process.env.NODE_ENV === 'production') {
        return undefined; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }
  
  async createConversation(): Promise<Conversation> {
    try {
      const dbInstance = await this.checkDb();
      const [conversation] = await dbInstance
        .insert(conversations)
        .values({})
        .returning();
      return conversation;
    } catch (error) {
      console.error('Error in createConversation:', error);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to create conversation');
      }
      throw error; // Rethrow in development
    }
  }
  
  async updateConversationLastMessageTime(id: number): Promise<Conversation | undefined> {
    try {
      const dbInstance = await this.checkDb();
      const [conversation] = await dbInstance
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, id))
        .returning();
      return conversation;
    } catch (error) {
      console.error('Error in updateConversationLastMessageTime:', error);
      if (process.env.NODE_ENV === 'production') {
        return undefined; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }
  
  // Conversation participants operations
  async addConversationParticipant(participant: InsertConversationParticipant): Promise<ConversationParticipant> {
    try {
      const dbInstance = await this.checkDb();
      const [newParticipant] = await dbInstance
        .insert(conversationParticipants)
        .values(participant)
        .returning();
      return newParticipant;
    } catch (error) {
      console.error('Error in addConversationParticipant:', error);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to add conversation participant');
      }
      throw error; // Rethrow in development
    }
  }
  
  async getConversationParticipants(conversationId: number): Promise<ConversationParticipant[]> {
    try {
      const dbInstance = await this.checkDb();
      return dbInstance
        .select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conversationId));
    } catch (error) {
      console.error('Error in getConversationParticipants:', error);
      if (process.env.NODE_ENV === 'production') {
        return []; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }
  
  // Message operations
  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    try {
      const dbInstance = await this.checkDb();
      return dbInstance
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt);
    } catch (error) {
      console.error('Error in getMessagesByConversation:', error);
      if (process.env.NODE_ENV === 'production') {
        return []; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      const dbInstance = await this.checkDb();
      const [newMessage] = await dbInstance
        .insert(messages)
        .values(message)
        .returning();
      return newMessage;
    } catch (error) {
      console.error('Error in createMessage:', error);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to create message');
      }
      throw error; // Rethrow in development
    }
  }
  
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    try {
      const dbInstance = await this.checkDb();
      const [message] = await dbInstance
        .update(messages)
        .set({ read: true })
        .where(eq(messages.id, id))
        .returning();
      return message;
    } catch (error) {
      console.error('Error in markMessageAsRead:', error);
      if (process.env.NODE_ENV === 'production') {
        return undefined; // Fail gracefully in production
      }
      throw error; // Rethrow in development
    }
  }
}

export const storage = new DatabaseStorage();
