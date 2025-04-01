import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { log } from "./vite";
import { storage } from "./storage";
import { checkDatabaseConnection } from "./db";
import type { 
  User,
  Message,
  Post,
  Comment,
  Category,
  Conversation,
  ConversationParticipant
} from "@shared/schema";

import { 
  insertUserSchema, 
  insertPostSchema, 
  insertCommentSchema, 
  insertCategorySchema,
  insertConversationSchema,
  insertConversationParticipantSchema,
  insertMessageSchema
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", asyncHandler(async (req, res) => {
    // Check database connection
    const dbStatus = await checkDatabaseConnection();
    
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      database: dbStatus
    });
  }));
  // User routes
  app.get(
    "/api/users/:id",
    asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
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
      try {
        const userData = insertUserSchema.partial().parse(req.body);
        const updatedUser = await storage.updateUser(id, userData);
        
        if (!updatedUser) {
          return res.status(404).json({ error: "User not found" });
        }
        
        // Don't return password in response
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        throw error;
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
        
        // Check if user exists with this wallet address
        let user = await storage.getUserByWalletAddress(walletAddress);
        
        if (!user) {
          // If not, create a new user with random username
          const username = `user_${Date.now()}`;
          user = await storage.createUser({
            username,
            password: `pw_${Date.now()}`, // generate a random password
            walletAddress,
          });
        }
        
        // Don't return password in response
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Wallet auth error:", error);
        res.status(500).json({ error: "Failed to authenticate wallet" });
      }
    })
  );

  // Post routes
  app.get(
    "/api/posts",
    asyncHandler(async (req, res) => {
      const posts = await storage.getPosts();
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

  app.post(
    "/api/posts/:id/like",
    asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      const post = await storage.likePost(id);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json(post);
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
    path: '/ws',  // Use dedicated WebSocket path
    perMessageDeflate: false,  // Disable per-message deflate to avoid some compatibility issues
    maxPayload: 1024 * 1024,   // 1MB max message size
    skipUTF8Validation: false  // Always validate UTF8
  });

  wss.on("connection", (ws) => {
    log("WebSocket client connected", "ws");

    // Send a welcome message to confirm connection
    try {
      ws.send(JSON.stringify({ type: "connection_established", message: "Connected to server" }));
    } catch (err) {
      console.error("Error sending welcome message:", err);
    }

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        log(`Received: ${JSON.stringify(data)}`, "ws");
        
        // Handle different message types
        if (data.type === "like") {
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
          
          // Broadcast message only to the recipient
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              try {
                client.send(JSON.stringify({ 
                  type: "new_message", 
                  message: messageData 
                }));
              } catch (err) {
                console.error("Error broadcasting message event:", err);
              }
            }
          });
          
          // Store message in database
          if (messageData && messageData.conversationId && messageData.senderId && messageData.text) {
            storage.createMessage({
              conversationId: messageData.conversationId,
              senderId: messageData.senderId,
              text: messageData.text
            }).then((savedMessage: Message) => {
              // Update last message time
              return storage.updateConversationLastMessageTime(messageData.conversationId);
            }).catch((error: Error) => {
              console.error("Error saving message:", error);
            });
          }
        } else if (data.type === "message_read") {
          // Handle message read event
          const { messageId } = data;
          
          if (messageId) {
            storage.markMessageAsRead(messageId).then((updatedMessage: Message | undefined) => {
              if (updatedMessage) {
                // Broadcast message read status to all clients
                wss.clients.forEach((client) => {
                  if (client !== ws && client.readyState === WebSocket.OPEN) {
                    try {
                      client.send(JSON.stringify({ 
                        type: "message_read", 
                        messageId 
                      }));
                    } catch (err) {
                      console.error("Error broadcasting message read event:", err);
                    }
                  }
                });
              }
            }).catch((error: Error) => {
              console.error("Error marking message as read:", error);
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
    });
  });

  // Handle WebSocket server errors
  wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
  });

  return httpServer;
}
