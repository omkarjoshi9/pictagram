import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  FaQuestionCircle, 
  FaLock, 
  FaUserShield, 
  FaCommentAlt, 
  FaCog,
  FaExclamationCircle,
  FaEnvelope,
  FaCheckCircle
} from "react-icons/fa";

export default function Support() {
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // In a real app, this would send the form data to a server
    setContactSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setContactSubmitted(false);
      // Reset the form
      e.currentTarget.reset();
    }, 3000);
  };

  const faqItems = [
    {
      id: "item-1",
      question: "How do I change my account password?",
      answer: "To change your password, go to Settings > Account > Security and follow the instructions to update your password. Make sure to use a strong, unique password for better security.",
      icon: <FaLock className="mr-2 h-4 w-4" />
    },
    {
      id: "item-2",
      question: "How can I control who sees my posts?",
      answer: "You can control your privacy settings by going to Settings > Privacy. There you can choose who can see your posts, stories, and profile information.",
      icon: <FaUserShield className="mr-2 h-4 w-4" />
    },
    {
      id: "item-3",
      question: "How do I report inappropriate content?",
      answer: "To report a post, tap the three dots in the top right of the post and select 'Report'. Follow the on-screen instructions to complete your report.",
      icon: <FaExclamationCircle className="mr-2 h-4 w-4" />
    },
    {
      id: "item-4",
      question: "How do I message another user?",
      answer: "To message another user, go to their profile and tap the 'Message' button. You can also use the Messages tab to start a new conversation.",
      icon: <FaCommentAlt className="mr-2 h-4 w-4" />
    },
    {
      id: "item-5",
      question: "How do I customize my notification settings?",
      answer: "Go to Settings > Notifications to customize which notifications you receive and how you receive them. You can toggle different types of notifications on or off.",
      icon: <FaCog className="mr-2 h-4 w-4" />
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 flex">
        <Sidebar activePage="" />
        
        <div className="w-full md:w-4/5 py-6">
          <h1 className="text-3xl font-bold mb-6 text-foreground">Help & Support</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - FAQ */}
            <div className="md:col-span-2">
              <div className="bg-card rounded-lg shadow p-6 mb-6">
                <div className="flex items-center mb-4">
                  <FaQuestionCircle className="h-5 w-5 text-primary mr-2" />
                  <h2 className="text-xl font-semibold text-foreground">Frequently Asked Questions</h2>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item) => (
                    <AccordionItem value={item.id} key={item.id}>
                      <AccordionTrigger className="text-left text-foreground flex items-center">
                        <div className="flex items-center">
                          {item.icon}
                          <span>{item.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
              
              <div className="bg-card rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <FaEnvelope className="h-5 w-5 text-primary mr-2" />
                  <h2 className="text-xl font-semibold text-foreground">Contact Support</h2>
                </div>
                
                {contactSubmitted ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <FaCheckCircle className="h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Thank You!</h3>
                    <p className="text-center text-muted-foreground">
                      Your message has been sent to our support team. We'll get back to you as soon as possible.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Name
                      </label>
                      <Input placeholder="Your name" required />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Email
                      </label>
                      <Input type="email" placeholder="Your email address" required />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Subject
                      </label>
                      <Input placeholder="Subject of your inquiry" required />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Message
                      </label>
                      <Textarea placeholder="How can we help you?" rows={5} required />
                    </div>
                    
                    <Button type="submit" className="w-full">
                      Send Message
                    </Button>
                  </form>
                )}
              </div>
            </div>
            
            {/* Right Column - Contact Info & Quick Links */}
            <div className="space-y-6">
              <div className="bg-card rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">Contact Information</h3>
                <div className="space-y-3 text-muted-foreground">
                  <p className="flex items-center">
                    <FaEnvelope className="mr-2 h-4 w-4" />
                    support@pictagram.com
                  </p>
                  <p>Response Time: Within 24 hours</p>
                  <div className="pt-3 border-t border-border mt-3">
                    <p className="text-sm">
                      For urgent matters, please include "URGENT" in the subject line of your message.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3 text-foreground">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-primary hover:underline flex items-center">
                      <FaLock className="mr-2 h-4 w-4" />
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-primary hover:underline flex items-center">
                      <FaUserShield className="mr-2 h-4 w-4" />
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-primary hover:underline flex items-center">
                      <FaCommentAlt className="mr-2 h-4 w-4" />
                      Community Guidelines
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-primary hover:underline flex items-center">
                      <FaCog className="mr-2 h-4 w-4" />
                      Account Settings
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}