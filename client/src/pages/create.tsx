import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useLocation } from "wouter";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Create() {
  const [, setLocation] = useLocation();
  const { user } = useWallet();
  const { toast } = useToast();
  const [caption, setCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [feeling, setFeeling] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available categories
  const availableCategories = [
    "Travel", "Food", "Fashion", "Technology", "Art", "Sports", "Music", "Nature"
  ];

  // Available feelings
  const availableFeelings = [
    "Happy", "Excited", "Loved", "Relaxed", "Blessed", "Thoughtful", "Inspired"
  ];

  // Redirect to login if no user is logged in
  useEffect(() => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to create a post.",
        variant: "destructive"
      });
      setLocation("/");
    }
  }, [user, setLocation, toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryToggle = (category: string) => {
    if (categories.includes(category)) {
      setCategories(categories.filter(c => c !== category));
    } else {
      setCategories([...categories, category]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to create a post.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Create post data
      const postData = {
        userId: user.id,
        imageUrl: previewURL,
        caption,
        feeling,
        categories
      };
      
      // Send post data to API
      const response = await apiRequest({
        url: "/api/posts",
        method: "POST",
        data: postData
      });
      
      toast({
        title: "Success",
        description: "Your post has been created!",
        variant: "default"
      });
      
      // Redirect to home after posting
      setLocation("/");
    } catch (err) {
      console.error("Error creating post:", err);
      setError("Failed to create post. Please try again.");
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 flex">
        <Sidebar activePage="" />
        
        <div className="w-full md:w-4/5 py-6">
          <div className="bg-card rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-6">Create Post</h1>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Upload Image</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col rounded-lg border-2 border-dashed border-border w-full h-60 p-10 group text-center cursor-pointer">
                      {previewURL ? (
                        <div className="h-full w-full flex items-center justify-center">
                          <img 
                            src={previewURL} 
                            alt="Preview" 
                            className="h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center pt-7">
                          <svg className="w-12 h-12 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <p className="pt-1 text-sm tracking-wider text-muted">
                            {selectedImage ? selectedImage : "Select a photo"}
                          </p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                </div>
                
                {/* Caption */}
                <div>
                  <label className="block text-sm font-medium mb-2">Caption</label>
                  <textarea 
                    className="w-full px-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={4}
                    placeholder="Write a caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </div>
                
                {/* Feeling */}
                <div>
                  <label className="block text-sm font-medium mb-2">How are you feeling?</label>
                  <div className="flex flex-wrap gap-2">
                    {availableFeelings.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          feeling === item 
                            ? 'bg-primary text-white' 
                            : 'bg-secondary hover:bg-primary/20'
                        }`}
                        onClick={() => setFeeling(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium mb-2">Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          categories.includes(category) 
                            ? 'bg-primary text-white' 
                            : 'bg-secondary hover:bg-primary/20'
                        }`}
                        onClick={() => handleCategoryToggle(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Submit Button */}
                <div className="pt-4">
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-primary text-white rounded-full text-sm font-medium flex items-center justify-center disabled:opacity-70"
                    disabled={isSubmitting || !previewURL || !caption}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Posting...
                      </>
                    ) : (
                      'Share Post'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}