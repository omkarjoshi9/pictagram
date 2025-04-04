import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { log } from "./vite";
import { storage } from "./storage";
import { checkDatabaseConnection } from "./db";
import { healthCheckHandler } from './health';
import multer from "multer";
import path from "path";
import fs from "fs";
import type { 
  User,
  Message,
  Post,
  Comment,
  Category,
  Conversation,
  ConversationParticipant,
  PostLike,
  Bookmark
} from "@shared/schema";

// We'll use a standard Map to track active WebSocket connections
// instead of extending the WebSocket interface

// Map to track WebSocket connections by user ID
const wsSessions = new Map<string, WebSocket>();

import { 
  insertUserSchema, 
  insertPostSchema, 
  insertCommentSchema, 
  insertCategorySchema,
  insertConversationSchema,
  insertConversationParticipantSchema,
  insertMessageSchema,
  insertPostLikeSchema,
  insertBookmarkSchema
} from "@shared/schema";
import { z } from "zod";

// Middleware to handle async route functions
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Set up file upload storage
const profilePictureStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Use environment variable or default upload directory
    const uploadDir = process.env.UPLOAD_DIR 
      ? path.join(process.cwd(), process.env.UPLOAD_DIR, 'profile-pictures')
      : path.join(process.cwd(), 'public/uploads/profile-pictures');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Create unique filename with timestamp and original extension
    const fileExt = path.extname(file.originalname);
    const uniqueFilename = `profile_${Date.now()}${fileExt}`;
    cb(null, uniqueFilename);
  }
});

// Initialize upload for profile pictures
const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function(req, file, cb) {
    // Accept only images
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", asyncHandler(healthCheckHandler));
  // User routes
  // Add search users endpoint - must be before the /:id route
  app.get(
    "/api/users/search",
    asyncHandler(async (req, res) => {
      try {
        // Get the query parameter
        const query = req.query.q as string || '';
        
        // Use searchUsers directly instead of going through getUser
        const users = await storage.searchUsers(query);
        
        // Don't return passwords in response
        const usersWithoutPasswords = users.map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });
        
        res.json(usersWithoutPasswords);
      } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ message: "Error searching users", error: String(error) });
      }
    })
  );

  app.post(
    "/api/users",
    asyncHandler(async (req, res) => {
      try {
        const userData = insertUserSchema.parse(req.body);
        const user = await storage.createUser(userData);
        
        // Don't return password in response
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        throw error;
      }
    })
  );

  app.put(
    "/api/users/:id",
    asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      console.log("PUT /api/users/:id - Request received with ID:", id);
      console.log("Request body:", req.body);
      
      try {
        console.log("Validating user data with schema");
        const userData = insertUserSchema.partial().parse(req.body);
        console.log("Validated data:", userData);
        
        console.log("Calling storage.updateUser");
        const updatedUser = await storage.updateUser(id, userData);
        console.log("Update result:", updatedUser);
        
        if (!updatedUser) {
          console.log("User not found, sending 404");
          return res.status(404).json({ error: "User not found" });
        }
        
        // Don't return password in response
        const { password, ...userWithoutPassword } = updatedUser;
        console.log("Sending successful response");
        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Error in user update:", error);
        if (error instanceof z.ZodError) {
          console.log("Validation error:", error.errors);
          return res.status(400).json({ error: error.errors });
        }
        throw error;
      }
    })
  );
  
  // Profile picture upload endpoint
  app.post(
    "/api/users/:id/profile-picture",
    uploadProfilePicture.single('profilePicture'),
    asyncHandler(async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        
        // Check if user exists
        const user = await storage.getUser(id);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        // Check if file was uploaded
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }
        
        // Get the relative path to the uploaded file
        const relativePath = `/uploads/profile-pictures/${path.basename(req.file.path)}`;
        
        // Update user's profile picture URL
        const updatedUser = await storage.updateUser(id, { profilePic: relativePath });
        
        if (!updatedUser) {
          return res.status(500).json({ error: "Failed to update profile picture" });
        }
        
        // Don't return password in response
        const { password, ...userWithoutPassword } = updatedUser;
        res.json({ 
          success: true, 
          message: "Profile picture updated successfully",
          user: userWithoutPassword,
          profilePicUrl: relativePath
        });
      } catch (error) {
        console.error("Profile picture upload error:", error);
        res.status(500).json({ error: "Failed to upload profile picture" });
      }
    })
  );
  
  // Schema for password change request
  const changePasswordSchema = z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6)
  });
  
  // Change password endpoint
  app.post(
    "/api/users/:id/change-password",
    asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      try {
        const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
        
        // Get the user to verify current password
        const user = await storage.getUser(id);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        // Check if the current password is correct
        if (user.password !== currentPassword) {
          return res.status(400).json({ error: "Current password is incorrect" });
        }
        
        // Update with the new password
        const updatedUser = await storage.updateUser(id, { password: newPassword });
        
        if (!updatedUser) {
          return res.status(500).json({ error: "Failed to update password" });
        }
        
        res.json({ success: true, message: "Password changed successfully" });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        throw error;
      }
    })
  );
  
  // Get user profile endpoint
  app.get(
    "/api/users/:id",
    asyncHandler(async (req, res) => {
      try {
        // Check if the id is "search", if so, handle it as a special case
        if (req.params.id === "search") {
          return res.status(400).json({ error: "Invalid user ID. Use /api/users/search?q=query instead." });
        }
        
        const id = parseInt(req.params.id);
        
        // Check if id is a valid number
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid user ID. ID must be a number." });
        }
        
        const user = await storage.getUser(id);
        
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        // Don't return password in response
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Error fetching user", error: String(error) });
      }
    })
  );

  // Wallet auth route
  app.post(
    "/api/auth/wallet",
    asyncHandler(async (req, res) => {
      try {
        const { walletAddress } = req.body;
        
        if (!walletAddress) {
          return res.status(400).json({ error: "Wallet address is required" });
        }
        
        console.log(`Authenticating wallet address: ${walletAddress}`);
        
        // Check if user exists with this wallet address
        let user = await storage.getUserByWalletAddress(walletAddress);
        
        if (!user) {
          console.log(`No existing user found for wallet ${walletAddress}, creating new user`);
          // If not, create a new user with random username
          const username = `user_${Date.now()}`;
          user = await storage.createUser({
            username,
            password: `pw_${Date.now()}`, // generate a random password
            walletAddress,
            profilePic: "/default-avatar.svg", // set default profile picture
          });
        } else {
          console.log(`Found existing user ${user.id} for wallet ${walletAddress}`);
        }
        
        // Don't return password in response
        const { password, ...userWithoutPassword } = user;
        
        // Don't set session data as we're using wallet-based auth
        // The user ID is returned in the response and managed by the client
        
        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Wallet auth error:", error);
        
        // Provide more specific error messages based on the error type
        if (error instanceof Error) {
          if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
            return res.status(409).json({ 
              error: "User with this wallet address already exists but couldn't be retrieved",
              details: error.message
            });
          }
        }
        
        res.status(500).json({ 
          error: "Failed to authenticate wallet",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    })
  );

  // Post routes
  app.get(
    "/api/posts",
    asyncHandler(async (req, res) => {
      // Check if userId query parameter is provided
      const userId = req.query.userId ? parseInt(req.query.userId as string) : null;
      
      // If userId is provided, fetch posts for that user, otherwise fetch all posts
      const posts = userId 
        ? await storage.getPostsByUser(userId)
        : await storage.getPosts();
        
      res.json(posts);
    })
  );

  app.get(
    "/api/posts/:id",
    asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      const post = await storage.getPost(id);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json(post);
    })
  );

  app.post(
    "/api/posts",
    asyncHandler(async (req, res) => {
      try {
        const postData = insertPostSchema.parse(req.body);
        const post = await storage.createPost(postData);
        
        // Handle categories if provided
        if (req.body.categories && Array.isArray(req.body.categories)) {
          for (const categoryName of req.body.categories) {
            // Get or create category
            let category = await storage.getCategoryByName(categoryName);
            
            if (!category) {
              category = await storage.createCategory({ name: categoryName });
            }
            
            // Link post to category
            await storage.addPostCategory(post.id, category.id);
          }
        }
        
        res.status(201).json(post);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        throw error;
      }
    })
  );

  app.put(
    "/api/posts/:id",
    asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      try {
        const postData = insertPostSchema.partial().parse(req.body);
        const updatedPost = await storage.updatePost(id, postData);
        
        if (!updatedPost) {
          return res.status(404).json({ error: "Post not found" });
        }
        
        res.json(updatedPost);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        throw error;
      }
    })
  );

  app.delete(
    "/api/posts/:id",
    asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      const success = await storage.deletePost(id);
      
      if (!success) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.status(204).end();
    })
  );

  // Updated likes endpoint with user tracking
  app.post(
    "/api/posts/:id/like",
    asyncHandler(async (req, res) => {
      const postId = parseInt(req.params.id);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      // Check if user already liked the post
      const hasLiked = await storage.getLikeStatus(postId, userId);
      
      if (hasLiked) {
        // If already liked, remove the like
        await storage.removeLike(postId, userId);
        const updatedPost = await storage.getPost(postId);
        res.json({ liked: false, post: updatedPost });
      } else {
        // If not liked, add the like
        await storage.addLike(postId, userId);
        const updatedPost = await storage.getPost(postId);
        res.json({ liked: true, post: updatedPost });
      }
    })
  );
  
  // Get like status for a post
  app.get(
    "/api/posts/:id/like",
    asyncHandler(async (req, res) => {
      const postId = parseInt(req.params.id);
      const userId = parseInt(req.query.userId as string);
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const liked = await storage.getLikeStatus(postId, userId);
      res.json({ liked });
    })
  );
  
  // Save/bookmark a post
  app.post(
    "/api/posts/:id/bookmark",
    asyncHandler(async (req, res) => {
      const postId = parseInt(req.params.id);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      // Check if user already bookmarked the post
      const hasBookmarked = await storage.getBookmarkStatus(postId, userId);
      
      if (hasBookmarked) {
        // If already bookmarked, remove the bookmark
        await storage.removeBookmark(postId, userId);
        res.json({ bookmarked: false });
      } else {
        // If not bookmarked, add the bookmark
        await storage.addBookmark(postId, userId);
        res.json({ bookmarked: true });
      }
    })
  );
  
  // Get bookmark status for a post
  app.get(
    "/api/posts/:id/bookmark",
    asyncHandler(async (req, res) => {
      const postId = parseInt(req.params.id);
      const userId = parseInt(req.query.userId as string);
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const bookmarked = await storage.getBookmarkStatus(postId, userId);
      res.json({ bookmarked });
    })
  );
  
  // Get saved/bookmarked posts for a user
  app.get(
    "/api/users/:id/bookmarks",
    asyncHandler(async (req, res) => {
      const userId = parseInt(req.params.id);
      const savedPosts = await storage.getSavedPosts(userId);
      res.json(savedPosts);
    })
  );

  // Comment routes
  app.get(
    "/api/posts/:postId/comments",
    asyncHandler(async (req, res) => {
      const postId = parseInt(req.params.postId);
      const comments = await storage.getComments(postId);
      res.json(comments);
    })
  );

  app.post(
    "/api/comments",
    asyncHandler(async (req, res) => {
      try {
        const commentData = insertCommentSchema.parse(req.body);
        const comment = await storage.createComment(commentData);
        res.status(201).json(comment);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        throw error;
      }
    })
  );

  app.delete(
    "/api/comments/:id",
    asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      const success = await storage.deleteComment(id);
      
      if (!success) {
        return res.status(404).json({ error: "Comment not found" });
      }
      
      res.status(204).end();
    })
  );

  // Category routes
  app.get(
    "/api/categories",
    asyncHandler(async (req, res) => {
      const categories = await storage.getCategories();
      res.json(categories);
    })
  );

  app.get(
    "/api/posts/:postId/categories",
    asyncHandler(async (req, res) => {
      const postId = parseInt(req.params.postId);
      const categories = await storage.getPostCategories(postId);
      res.json(categories);
    })
  );
  
  // Message and conversation routes
  app.get(
    "/api/conversations",
    asyncHandler(async (req, res) => {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const conversations = await storage.getConversationsByUserId(userId);
      res.json(conversations);
    })
  );
  
  app.get(
    "/api/conversations/:id",
    asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      const conversation = await storage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      res.json(conversation);
    })
  );
  
  app.get(
    "/api/conversations/:conversationId/participants",
    asyncHandler(async (req, res) => {
      const conversationId = parseInt(req.params.conversationId);
      
      // Get all participants of the conversation
      const participants = await storage.getConversationParticipants(conversationId);
      
      // Get user details for each participant
      const participantUsers = await Promise.all(
        participants.map(async (participant: ConversationParticipant) => {
          const user = await storage.getUser(participant.userId);
          if (user) {
            // Don't return password in response
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
          }
          return null;
        })
      );
      
      // Filter out null values (users not found)
      const validUsers = participantUsers.filter((user: Partial<User> | null) => user !== null);
      
      res.json(validUsers);
    })
  );
  
  app.post(
    "/api/conversations",
    asyncHandler(async (req, res) => {
      try {
        const { user1Id, user2Id } = req.body;
        
        if (!user1Id || !user2Id) {
          return res.status(400).json({ error: "Both user IDs are required" });
        }
        
        // Check if conversation already exists between these users
        const existingConversation = await storage.getConversationByUsers(user1Id, user2Id);
        
        if (existingConversation) {
          return res.json(existingConversation);
        }
        
        // Create new conversation
        const conversation = await storage.createConversation();
        
        // Add participants
        await storage.addConversationParticipant({ 
          conversationId: conversation.id, 
          userId: user1Id 
        });
        
        await storage.addConversationParticipant({ 
          conversationId: conversation.id, 
          userId: user2Id 
        });
        
        res.status(201).json(conversation);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        throw error;
      }
    })
  );
  
  app.get(
    "/api/conversations/:conversationId/messages",
    asyncHandler(async (req, res) => {
      const conversationId = parseInt(req.params.conversationId);
      const messages = await storage.getMessagesByConversation(conversationId);
      res.json(messages);
    })
  );
  
  app.post(
    "/api/messages",
    asyncHandler(async (req, res) => {
      try {
        const messageData = insertMessageSchema.parse(req.body);
        const message = await storage.createMessage(messageData);
        
        // Update conversation last message time
        await storage.updateConversationLastMessageTime(messageData.conversationId);
        
        // Get participants to send WebSocket notification
        const participants = await storage.getConversationParticipants(messageData.conversationId);
        
        // Send WebSocket notification to participants
        participants.forEach(async (participant) => {
          // Don't send to the sender
          if (participant.userId !== messageData.senderId) {
            try {
              // Get the participant's WebSocket connection
              const recipientId = participant.userId.toString();
              const recipientWs = wsSessions.get(recipientId);
              
              if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                recipientWs.send(JSON.stringify({
                  type: "new_message",
                  senderId: messageData.senderId,
                  recipientId: participant.userId,
                  conversationId: messageData.conversationId,
                  message: message
                }));
              }
            } catch (error) {
              console.error("Error sending WebSocket message:", error);
            }
          }
        });
        
        res.status(201).json(message);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        throw error;
      }
    })
  );
  
  app.patch(
    "/api/messages/:id/read",
    asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      const message = await storage.markMessageAsRead(id);
      
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      
      res.json(message);
    })
  );

  // Set up WebSocket server for real-time updates
  const httpServer = createServer(app);
  
  // Use more robust WebSocket server configuration with a dedicated path
  // This prevents conflicts with Vite's HMR WebSocket
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: process.env.WS_PATH || '/ws',  // Use dedicated WebSocket path from env or default
    perMessageDeflate: process.env.WS_COMPRESSION === 'true',  // Enable compression based on env
    maxPayload: process.env.WS_MAX_PAYLOAD ? 
      parseInt(process.env.WS_MAX_PAYLOAD) : 1024 * 1024,  // Max message size from env or 1MB
    skipUTF8Validation: process.env.WS_SKIP_UTF8_VALIDATION === 'true', // UTF8 validation setting
    clientTracking: true  // Always track connected clients
  });

  // Connection counter for logging
  let connectionCount = 0;
  
  // Store active clients and their metadata
  const clients = new Map();
  
  // Log active connections every 30 seconds
  const loggingInterval = setInterval(() => {
    const activeConnections = Array.from(wss.clients).filter(
      client => client.readyState === WebSocket.OPEN
    ).length;
    
    if (activeConnections > 0) {
      log(`Active WebSocket connections: ${activeConnections}`, "ws");
    }
  }, 30000);
  
  // Clean up interval on server close
  wss.on('close', () => {
    clearInterval(loggingInterval);
    log("WebSocket server closed", "ws");
  });

  wss.on("connection", (ws, req) => {
    connectionCount++;
    const id = connectionCount;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Store client metadata
    clients.set(ws, {
      id,
      connectedAt: new Date(),
      ip: ipAddress,
      lastActive: new Date()
    });
    
    log(`WebSocket client #${id} connected from ${ipAddress}`, "ws");

    // Send a welcome message to confirm connection
    try {
      ws.send(JSON.stringify({ type: "connection_established", message: "Connected to server" }));
    } catch (err) {
      console.error("Error sending welcome message:", err);
    }
    
    // Handle client ping messages (different from server pings)
    const handlePing = () => {
      try {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      } catch (err) {
        console.error("Error sending pong response:", err);
      }
    };

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Update client's last activity timestamp
        const clientInfo = clients.get(ws);
        if (clientInfo) {
          clientInfo.lastActive = new Date();
          clients.set(ws, clientInfo);
        }
        
        // Only log non-ping messages to reduce noise
        if (data.type !== 'ping') {
          log(`Received from client #${id}: ${JSON.stringify(data)}`, "ws");
        }
        
        // Handle authentication message to associate WebSocket with user ID
        if (data.type === 'authenticate' && data.userId) {
          const userId = data.userId.toString();
          // Store the WebSocket connection for this user
          wsSessions.set(userId, ws);
          log(`WebSocket client #${id} authenticated as user ${userId}`, "ws");
          
          // Send confirmation
          try {
            ws.send(JSON.stringify({ 
              type: "authenticated", 
              userId,
              success: true
            }));
          } catch (err) {
            console.error("Error sending authentication confirmation:", err);
          }
        }
        // Handle different message types
        else if (data.type === 'ping') {
          handlePing();
        } else if (data.type === "like") {
          // Broadcast like event to all clients
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              try {
                client.send(JSON.stringify({ 
                  type: "like", 
                  postId: data.postId, 
                  likes: data.likes 
                }));
              } catch (err) {
                console.error("Error broadcasting like event:", err);
              }
            }
          });
        } else if (data.type === "bookmark") {
          // Broadcast bookmark event to all clients
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              try {
                client.send(JSON.stringify({ 
                  type: "bookmark", 
                  postId: data.postId,
                  userId: data.userId,
                  bookmarked: data.bookmarked
                }));
              } catch (err) {
                console.error("Error broadcasting bookmark event:", err);
              }
            }
          });
        } else if (data.type === "new_comment") {
          // Broadcast new comment event to all clients
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              try {
                client.send(JSON.stringify({ 
                  type: "new_comment", 
                  postId: data.postId, 
                  comment: data.comment 
                }));
              } catch (err) {
                console.error("Error broadcasting comment event:", err);
              }
            }
          });
        } else if (data.type === "new_message") {
          // Handle new message event
          const { message: messageData, recipientId } = data;
          
          // We need to determine if this is a new message or a relay of an existing message
          // If the message already has an ID, it's an existing message being relayed through WebSocket
          if (messageData && messageData.id) {
            // This is an existing message (already saved), just relay it to recipient
            log(`Relaying existing message with ID: ${messageData.id}`, "ws");
            
            // Get conversation participants to notify the recipient
            storage.getConversationParticipants(messageData.conversationId).then(participants => {
              
              // Find the recipient (not the sender) and send notification
              participants.forEach(participant => {
                // Don't send to the sender
                if (participant.userId !== messageData.senderId) {
                  const recipientId = participant.userId.toString();
                  const recipientWs = wsSessions.get(recipientId);
                  
                  // If recipient is connected, send the message
                  if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                    try {
                      recipientWs.send(JSON.stringify({
                        type: "new_message",
                        message: messageData,
                        conversationId: messageData.conversationId,
                        senderId: messageData.senderId,
                        messageId: messageData.id, // Include messageId to help with deduplication
                      }));
                      log(`Sent message notification to user ${recipientId} for message ${messageData.id}`, "ws");
                    } catch (err) {
                      console.error("Error sending direct message:", err);
                    }
                  }
                }
              });
            }).catch(error => {
              console.error("Error getting conversation participants:", error);
            });
            
            // No need to save or confirm again since this is just a relay
          }
          // Store new message in database if it doesn't have an ID yet
          else if (messageData && messageData.conversationId && messageData.senderId && messageData.text) {
            log(`Creating new message in conversation ${messageData.conversationId}`, "ws");
            
            storage.createMessage({
              conversationId: messageData.conversationId,
              senderId: messageData.senderId,
              text: messageData.text
            }).then((savedMessage: Message) => {
              // Update conversation last message time
              storage.updateConversationLastMessageTime(messageData.conversationId).then(() => {
                
                // Get conversation participants to notify the recipient
                storage.getConversationParticipants(messageData.conversationId).then(participants => {
                  
                  // Find the recipient (not the sender) and send notification
                  participants.forEach(participant => {
                // Don't send to the sender
                if (participant.userId !== messageData.senderId) {
                  const recipientId = participant.userId.toString();
                  const recipientWs = wsSessions.get(recipientId);
                  
                  // If recipient is connected, send the message
                  if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                    try {
                      recipientWs.send(JSON.stringify({
                        type: "new_message",
                        message: savedMessage,
                        conversationId: messageData.conversationId,
                        senderId: messageData.senderId,
                        messageId: savedMessage.id, // Include messageId to help with deduplication
                      }));
                      log(`Sent message notification to user ${recipientId} for new message ${savedMessage.id}`, "ws");
                    } catch (err) {
                      console.error("Error sending direct message:", err);
                    }
                  }
                }
              });
              
                  // Confirm to sender
                  try {
                    ws.send(JSON.stringify({
                      type: "message_sent",
                      success: true,
                      message: savedMessage,
                      messageId: savedMessage.id
                    }));
                  } catch (err) {
                    console.error("Error sending message confirmation:", err);
                  }
                }).catch(error => {
                  console.error("Error getting conversation participants:", error);
                });
              }).catch(error => {
                console.error("Error updating conversation time:", error);
              });
            }).catch((error: Error) => {
              console.error("Error saving message:", error);
              // Notify sender of error
              try {
                ws.send(JSON.stringify({
                  type: "message_sent",
                  success: false,
                  error: "Failed to save message"
                }));
              } catch (err) {
                console.error("Error sending error notification:", err);
              }
            });
          } else {
            // Invalid message data
            try {
              ws.send(JSON.stringify({
                type: "message_sent",
                success: false,
                error: "Invalid message data"
              }));
            } catch (err) {
              console.error("Error sending error notification:", err);
            }
          }
        } else if (data.type === "message_read") {
          // Handle message read event
          const { messageId, senderId } = data;
          
          if (messageId) {
            storage.markMessageAsRead(messageId).then((updatedMessage: Message | undefined) => {
              if (updatedMessage) {
                // Get the message details to notify the sender
                const message = updatedMessage;
                
                // Only notify the original sender of the message
                if (message.senderId && message.senderId !== parseInt(data.userId)) {
                  const senderUserId = message.senderId.toString();
                  const senderWs = wsSessions.get(senderUserId);
                  
                  if (senderWs && senderWs.readyState === WebSocket.OPEN) {
                    try {
                      senderWs.send(JSON.stringify({
                        type: "message_read",
                        messageId,
                        conversationId: message.conversationId, 
                        readBy: data.userId
                      }));
                      log(`Sent message read notification to user ${senderUserId}`, "ws");
                    } catch (err) {
                      console.error("Error sending message read notification:", err);
                    }
                  }
                }
                
                // Confirm to reader
                try {
                  ws.send(JSON.stringify({
                    type: "message_read_confirmed",
                    messageId
                  }));
                } catch (err) {
                  console.error("Error sending read confirmation:", err);
                }
              }
            }).catch((error: Error) => {
              console.error("Error marking message as read:", error);
              // Notify user of error
              try {
                ws.send(JSON.stringify({
                  type: "message_read_error",
                  messageId,
                  error: "Failed to mark message as read"
                }));
              } catch (err) {
                console.error("Error sending error notification:", err);
              }
            });
          }
        }
      } catch (error) {
        log(`Invalid message: ${error}`, "ws");
      }
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err);
    });

    ws.on("close", () => {
      log("WebSocket client disconnected", "ws");
      
      // Remove the WebSocket from the wsSessions map
      // Find user ID by socket reference and delete it
      let userIdToRemove: string | null = null;
      
      wsSessions.forEach((socket, userId) => {
        if (socket === ws) {
          userIdToRemove = userId;
        }
      });
      
      if (userIdToRemove) {
        wsSessions.delete(userIdToRemove);
        log(`Removed user ${userIdToRemove} from WebSocket sessions`, "ws");
      }
      
      // Remove client from clients map
      clients.delete(ws);
    });
  });

  // Handle WebSocket server errors
  wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
  });

  return httpServer;
}
