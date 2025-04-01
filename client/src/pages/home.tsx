import React from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row">
          <Sidebar activePage="home" />
          <div className="md:w-4/5 py-6">
            <h1 className="text-2xl font-bold mb-6">Home</h1>
            <div className="flex items-center justify-center h-64 bg-card rounded-lg border border-border">
              <div className="text-center">
                <h2 className="text-xl font-medium text-card-foreground mb-2">Welcome to PICTagram</h2>
                <p className="text-muted-foreground mb-4">Your feed is empty right now</p>
                <Link href="/explore" className="px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium inline-block">
                  Explore Content
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
