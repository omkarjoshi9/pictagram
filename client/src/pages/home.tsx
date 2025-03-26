import React from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row">
          <Sidebar activePage="home" />
          <div className="md:w-4/5 py-6">
            <h1 className="text-2xl font-bold mb-6">Home</h1>
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-border">
              <div className="text-center">
                <h2 className="text-xl font-medium text-gray-600 mb-2">Welcome to InSocial</h2>
                <p className="text-muted mb-4">Your feed is empty right now</p>
                <Link href="/explore">
                  <a className="px-5 py-2 bg-primary text-white rounded-full text-sm font-medium">
                    Explore Content
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
