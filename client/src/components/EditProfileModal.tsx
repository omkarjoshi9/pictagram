import React, { useState, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { FaCamera, FaSpinner, FaCheck, FaEdit } from "react-icons/fa";

// Form validation schema
const formSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .trim(),
  profilePic: z.union([
    z.string().url("Please enter a valid URL"),
    z.string().startsWith("/", "Path must start with /"),
    z.literal(""),
    z.null()
  ]).optional(),
  bio: z.string()
    .max(160, "Bio cannot exceed 160 characters")
    .nullable()
    .optional()
    .transform(val => val === null ? "" : val) // Convert null to empty string
});

interface User {
  id: number;
  username: string;
  walletAddress: string;
  profilePic?: string;
  bio?: string;
}

interface EditProfileModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type FormValues = z.infer<typeof formSchema>;

export default function EditProfileModal({ user, isOpen, onClose, onSuccess }: EditProfileModalProps) {
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create form with default values from user
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: user?.username || "",
      profilePic: user?.profilePic || "",
      bio: user?.bio || ""
    }
  });

  // Update form values when user changes
  React.useEffect(() => {
    if (user) {
      form.reset({
        username: user.username || "",
        profilePic: user.profilePic || "",
        bio: user.bio || ""
      });
      setUploadedImage(null);
    }
  }, [user, form]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image file should be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    // Create form data for file upload
    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      // Upload the file
      const response = await fetch(`/api/users/${user.id}/profile-picture`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      const data = await response.json();
      
      // Update the form with the new profile picture URL
      form.setValue('profilePic', data.profilePicUrl);
      setUploadedImage(data.profilePicUrl);
      
      toast({
        title: "Upload successful",
        description: "Profile picture uploaded successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Trigger file input click
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // Mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user?.id) throw new Error("No user ID found");
      
      console.log("Making API request to update profile for user:", user.id);
      console.log("With data:", values);
      
      try {
        // Create a custom fetch with timeout to help diagnose network issues
        const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 10000) => {
          const controller = new AbortController();
          const { signal } = controller;
          
          const timeoutId = setTimeout(() => {
            controller.abort();
          }, timeout);
          
          try {
            const response = await fetch(url, {
              ...options,
              signal
            });
            
            clearTimeout(timeoutId);
            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            throw error;
          }
        };
        
        // Make the request with our custom fetch
        const response = await fetchWithTimeout(`/api/users/${user.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(values),
          credentials: "include"
        }, 10000);
        
        // Check if the response is ok
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error response (${response.status}):`, errorText);
          throw new Error(`Request failed with status ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log("API response:", data);
        return data;
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Mutation succeeded with data:", data);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
        variant: "default"
      });
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error updating profile",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (values: FormValues) => {
    console.log("Form submitted with values:", values);
    console.log("Form validation state:", form.formState);
    
    try {
      // Explicitly await the mutation
      await updateProfileMutation.mutateAsync(values);
      console.log("Mutation completed successfully");
      // Success is handled in the onSuccess callback of the mutation
    } catch (error) {
      console.error("Mutation failed:", error);
      // Error is handled in the onError callback of the mutation
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open && !updateProfileMutation.isPending) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and picture
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center space-y-3">
              <div 
                className="relative w-24 h-24 rounded-full overflow-hidden border cursor-pointer group"
                onClick={handleImageClick}
              >
                <img 
                  src={uploadedImage || (form.watch('profilePic') || '/default-avatar.svg')} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploading ? (
                    <FaSpinner className="animate-spin text-white text-xl" />
                  ) : (
                    <FaCamera className="text-white text-xl" />
                  )}
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleImageClick}
                disabled={isUploading}
                className="flex items-center space-x-1"
              >
                {isUploading ? (
                  <>
                    <FaSpinner className="animate-spin mr-1" />
                    <span>Uploading...</span>
                  </>
                ) : uploadedImage ? (
                  <>
                    <FaCheck className="mr-1" />
                    <span>Change Picture</span>
                  </>
                ) : (
                  <>
                    <FaEdit className="mr-1" />
                    <span>Upload Picture</span>
                  </>
                )}
              </Button>
              <FormDescription className="text-center text-xs">
                Click to upload a new profile picture. Maximum size: 5MB.
              </FormDescription>
            </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about yourself" 
                      className="resize-none" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    Write a short bio about yourself. Maximum 160 characters.
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4 flex-col space-y-2 sm:space-y-0 sm:flex-row">
              {updateProfileMutation.isError && (
                <p className="text-red-500 text-sm">
                  Error: {updateProfileMutation.error?.message || "Failed to save changes"}
                </p>
              )}
              <div className="flex space-x-2 w-full sm:w-auto justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={updateProfileMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending || isUploading}
                  className="min-w-[120px] flex items-center justify-center"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      <span>Saving...</span>
                    </>
                  ) : "Save Changes"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}