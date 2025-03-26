import React from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function Settings() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 flex">
        <Sidebar activePage="settings" />
        
        <div className="w-full md:w-4/5 py-6">
          <div className="bg-card rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>
            
            <div className="space-y-6">
              <div className="border-b border-border pb-6">
                <h2 className="text-lg font-semibold mb-4">Account Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Username</label>
                    <input 
                      type="text" 
                      className="w-full md:w-1/2 px-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      defaultValue="omkarjoshi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input 
                      type="email" 
                      className="w-full md:w-1/2 px-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      defaultValue="omkar@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bio</label>
                    <textarea 
                      className="w-full md:w-1/2 px-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                      defaultValue="Software developer and photography enthusiast."
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-b border-border pb-6">
                <h2 className="text-lg font-semibold mb-4">Privacy & Security</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between w-full md:w-1/2">
                    <span className="text-sm font-medium">Private Account</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary-light"></div>
                      <span className="absolute h-4 w-4 bg-white rounded-full transition-all duration-200 left-1 top-1 peer-checked:left-6"></span>
                    </label>
                  </div>
                  <div className="flex items-center justify-between w-full md:w-1/2">
                    <span className="text-sm font-medium">Show Activity Status</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary-light"></div>
                      <span className="absolute h-4 w-4 bg-white rounded-full transition-all duration-200 left-1 top-1 peer-checked:left-6"></span>
                    </label>
                  </div>
                  <div className="pt-2">
                    <button className="text-sm text-primary font-medium">Change Password</button>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-4">Notifications</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between w-full md:w-1/2">
                    <span className="text-sm font-medium">Push Notifications</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary-light"></div>
                      <span className="absolute h-4 w-4 bg-white rounded-full transition-all duration-200 left-1 top-1 peer-checked:left-6"></span>
                    </label>
                  </div>
                  <div className="flex items-center justify-between w-full md:w-1/2">
                    <span className="text-sm font-medium">Email Notifications</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary-light"></div>
                      <span className="absolute h-4 w-4 bg-white rounded-full transition-all duration-200 left-1 top-1 peer-checked:left-6"></span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <button className="px-6 py-2 bg-primary text-white rounded-full text-sm font-medium">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}