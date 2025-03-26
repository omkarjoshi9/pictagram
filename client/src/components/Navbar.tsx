"use client";
import { Link, useLocation } from "wouter";
import React, { useEffect, useState } from "react";
import { MdSearch, MdClose, MdSettings } from "react-icons/md";
import { FaAngleRight } from "react-icons/fa";
import { FaAngleDown, FaFaceFrown } from "react-icons/fa6";
import { RiQuestionFill } from "react-icons/ri";
import { userData } from "@/data/UserData";
import { motion } from "framer-motion";
import { useClickOutside } from "@mantine/hooks";

const Navbar = () => {
  const [isFocused, setIsFocused] = useState(false);
  const ref = useClickOutside(() => setIsFocused(false));
  const [searchValue, setSearchValue] = useState("");
  const [profileMenu, setProfileMenu] = useState(false);
  const [searchedUser, setSearchedUser] = useState(userData);
  const [searchPanel, setSearchPanel] = useState(false);
  const [location] = useLocation();

  const searchUsers = (value: string) => {
    if (value === "") {
      setSearchedUser(userData);
      return;
    }
    
    const searchResults = userData.filter((user) => {
      return user.name.toLowerCase().includes(value.toLowerCase());
    });
    
    setSearchedUser(
      searchResults.length === 0 ? [{ error: "User Not Found", id: -1, name: "", profilePic: "" }] : searchResults
    );
  };

  useEffect(() => {
    window.addEventListener("click", (e) => {
      const target = e.target as Element;
      if (!target.closest(".userProfile")) {
        setProfileMenu(false);
      }
    });
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="px-4 py-2 mx-auto flex items-center justify-between max-w-6xl">
          <Link href="/" className="text-2xl font-bold text-primary">
            InSocial
          </Link>
          
          <div
            ref={ref}
            className={`relative flex-grow max-w-md mx-4 ${isFocused ? "ring-2 ring-primary rounded-full" : ""}`}
          >
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                <MdSearch className="h-5 w-5" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-border rounded-full bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                placeholder="Search"
                value={searchValue}
                onFocus={() => setIsFocused(true)}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  searchUsers(e.target.value);
                }}
              />
              {searchValue.length >= 1 && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <MdClose
                    className="h-5 w-5 text-muted cursor-pointer"
                    onClick={() => {
                      setSearchValue("");
                      setIsFocused(false);
                      setTimeout(() => {
                        setSearchedUser(userData);
                      }, 300);
                    }}
                  />
                </div>
              )}
            </div>

            <motion.div
              className="absolute w-full bg-white mt-2 rounded-lg shadow-lg z-50 overflow-hidden"
              initial={{ y: 30, opacity: 0, pointerEvents: "none" }}
              animate={{
                y: isFocused ? 0 : 30,
                opacity: isFocused ? 1 : 0,
                pointerEvents: isFocused ? "auto" : "none",
              }}
            >
              {isFocused &&
                searchedUser.map((user, index) => {
                  if (user.error) {
                    return (
                      <div className="flex items-center justify-center p-4" key={index}>
                        <FaFaceFrown className="text-muted mr-2" />
                        <h3 className="text-sm text-muted">Sorry, {user.error}</h3>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={index}
                        className="flex items-center p-3 hover:bg-secondary cursor-pointer"
                        onClick={() => {
                          setSearchValue(user.name);
                          setIsFocused(false);
                        }}
                      >
                        <div className="h-8 w-8 rounded-full overflow-hidden mr-2">
                          <img src={user.profilePic} alt="" className="h-full w-full object-cover" />
                        </div>
                        <h3 className="text-sm font-medium">{user.name}</h3>
                      </div>
                    );
                  }
                })}
            </motion.div>
          </div>
          
          <div className="flex items-center">
            <div className="block md:hidden cursor-pointer mr-3" onClick={() => setSearchPanel(true)}>
              <MdSearch className="h-6 w-6 text-muted" />
            </div>
            <Link href="/create">
              <a className="hidden md:block px-5 py-1.5 bg-primary text-white rounded-full text-sm font-medium">
                Create
              </a>
            </Link>
            <div className="userProfile ml-4 relative">
              <div
                className="h-8 w-8 rounded-full overflow-hidden cursor-pointer"
                onClick={() => setProfileMenu(!profileMenu)}
              >
                <img
                  src="/assets/image/avatar_default.jpg"
                  alt="User Profile"
                  className="h-full w-full object-cover"
                />
              </div>
              <motion.div
                className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-50 overflow-hidden"
                initial={{ y: 40, opacity: 0, pointerEvents: "none" }}
                animate={{
                  y: !profileMenu ? 40 : 0,
                  opacity: profileMenu ? 1 : 0,
                  pointerEvents: profileMenu ? "auto" : "none",
                }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-3 border-b border-border">
                  <div className="flex items-center">
                    <img
                      src="/assets/image/avatar_default.jpg"
                      alt="User Profile"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium">John Doe</div>
                      <span className="text-xs text-primary cursor-pointer">See Profile</span>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <div className="px-3 py-2 hover:bg-secondary cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-3 text-muted">
                          <MdSettings className="h-5 w-5" />
                        </span>
                        <span className="text-sm">Settings & Privacy</span>
                      </div>
                      <span className="text-muted">
                        <FaAngleRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-2 hover:bg-secondary cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-3 text-muted">
                          <RiQuestionFill className="h-5 w-5" />
                        </span>
                        <span className="text-sm">Help & Support</span>
                      </div>
                      <span className="text-muted">
                        <FaAngleRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </nav>

      <motion.div
        className="fixed inset-0 bg-white z-50"
        initial={{ y: "100vh", pointerEvents: "none", display: "none" }}
        animate={{
          display: searchPanel ? "block" : "none",
          y: searchPanel ? 0 : "100vh",
          pointerEvents: searchPanel ? "auto" : "none",
        }}
        transition={{
          bounce: 0.23,
          type: "spring",
        }}
      >
        <div 
          className="flex justify-center items-center p-4 border-b border-border"
          onClick={() => setSearchPanel(false)}
        >
          <FaAngleDown className="h-5 w-5 text-muted" />
        </div>

        <div className="p-4">
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              <MdSearch className="h-5 w-5" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-border rounded-full bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
              placeholder="Search"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                searchUsers(e.target.value);
              }}
            />
            {searchValue.length >= 1 && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <MdClose
                  className="h-5 w-5 text-muted cursor-pointer"
                  onClick={() => {
                    setSearchValue("");
                    setSearchedUser(userData);
                  }}
                />
              </div>
            )}
          </div>

          <div className="mt-4">
            {searchedUser.map((user, index) => {
              if (user.error) {
                return (
                  <div className="flex items-center justify-center p-4" key={index}>
                    <FaFaceFrown className="text-muted mr-2" />
                    <h3 className="text-sm text-muted">Sorry, {user.error}</h3>
                  </div>
                );
              } else {
                return (
                  <div
                    key={index}
                    className="flex items-center p-3 hover:bg-secondary cursor-pointer"
                    onClick={() => {
                      setSearchValue(user.name);
                      setSearchPanel(false);
                    }}
                  >
                    <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                      <img src={user.profilePic} alt="" className="h-full w-full object-cover" />
                    </div>
                    <h3 className="text-sm font-medium">{user.name}</h3>
                  </div>
                );
              }
            })}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Navbar;
