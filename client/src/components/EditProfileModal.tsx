import React, { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "../components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";

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

// Create a schema for validating the form
const formSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  bio: z.string().max(160, { message: "Bio must be less than 160 characters" }).optional(),
  profilePic: z.string().url({ message: "Please enter a valid URL" }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, isOpen, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Initialize form with user data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: user?.username || "",
      bio: user?.bio || "",
      profilePic: user?.profilePic || "",
    },
  });

  // Update form values when user changes
  React.useEffect(() => {
    if (user) {
      form.reset({
        username: user.username || "",
        bio: user.bio || "",
        profilePic: user.profilePic || "",
      });
    }
  }, [user, form]);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // Only include changed fields
      const updates: Partial<FormValues> = {};
      if (values.username !== user.username) updates.username = values.username;
      if (values.bio !== user.bio) updates.bio = values.bio;
      if (values.profilePic !== user.profilePic) updates.profilePic = values.profilePic;
      
      // Only make the API call if there are changes
      if (Object.keys(updates).length > 0) {
        await apiRequest({
          url: `/api/users/${user.id}`,
          method: "PATCH",
          data: updates,
        });
        
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
          variant: "default",
        });
        
        onSuccess();
      }
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Your username" {...field} />
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
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="profilePic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Picture URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;