import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { log } from "./vite";
import { storage } from "./storage";
import { insertUserSchema, insertPostSchema, insertCommentSchema, insertCategorySchema } from "@shared/schema";
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

  // Set up WebSocket server for real-time updates
  const httpServer = createServer(app);
  
  // Use more robust WebSocket server configuration
  const wss = new WebSocketServer({ 
    server: httpServer,
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
            if (client !== ws && client.readyState === 1) {
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
            if (client !== ws && client.readyState === 1) {
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
