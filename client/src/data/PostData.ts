import { User, userData } from "./UserData";

export interface Comment {
  user: User;
  text: string;
  timeAgo: string;
}

export interface Post {
  id: number;
  user: User;
  imageUrl: string;
  caption: string;
  likes: number;
  feeling: string;
  comments: Comment[];
  categories: string[];
}

export const posts: Post[] = [
  {
    id: 1,
    user: userData[6], // Phillip Tender
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=600&q=80",
    caption: "Amazing view from my hike today! Sometimes you need to disconnect to reconnect with nature. #hiking #sunset #mountains",
    likes: 124,
    feeling: "is feeling happy with @johndoe",
    comments: [
      {
        user: userData[0], // John Doe
        text: "Absolutely stunning! Where is this exactly?",
        timeAgo: "2h"
      },
      {
        user: userData[1], // Sophie Alexander
        text: "This view is breathtaking! I need to add this to my travel list.",
        timeAgo: "45m"
      }
    ],
    categories: ["travel", "photography"]
  },
  {
    id: 2,
    user: userData[1], // Sophie Alexander
    imageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=600&q=80",
    caption: "Exploring the mountains this weekend was exactly what I needed. The fresh air and stunning views were rejuvenating!",
    likes: 98,
    feeling: "is feeling refreshed",
    comments: [
      {
        user: userData[2], // Mark Johnson
        text: "This looks amazing! I need to visit there.",
        timeAgo: "1h"
      },
      {
        user: userData[0], // John Doe
        text: "Great shot! What camera did you use?",
        timeAgo: "30m"
      }
    ],
    categories: ["travel", "photography"]
  },
  {
    id: 3,
    user: userData[2], // Mark Johnson
    imageUrl: "https://images.unsplash.com/photo-1591871937573-74dbba515c4c?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=600&q=80",
    caption: "Coffee and code - the perfect way to start my day. Working on some exciting new projects!",
    likes: 210,
    feeling: "is feeling productive",
    comments: [
      {
        user: userData[4], // Robert Adams
        text: "What are you working on? Looks interesting!",
        timeAgo: "3h"
      },
      {
        user: userData[5], // Emily Wilson
        text: "Nothing better than coffee and coding! ☕💻",
        timeAgo: "1h"
      }
    ],
    categories: ["food", "art"]
  },
  {
    id: 4,
    user: userData[3], // Sarah Parker
    imageUrl: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=600&q=80",
    caption: "Beach sunset vibes 🌊 Nothing compares to the sound of waves and the colors of sunset.",
    likes: 156,
    feeling: "is feeling peaceful",
    comments: [
      {
        user: userData[1], // Sophie Alexander
        text: "This is gorgeous! Where is this beach?",
        timeAgo: "4h"
      },
      {
        user: userData[0], // John Doe
        text: "Perfect sunset shot! I love the colors.",
        timeAgo: "2h"
      }
    ],
    categories: ["travel", "photography"]
  },
  {
    id: 5,
    user: userData[4], // Robert Adams
    imageUrl: "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=600&q=80",
    caption: "City lights and urban nights. There's something magical about cities after dark.",
    likes: 89,
    feeling: "is feeling inspired",
    comments: [
      {
        user: userData[2], // Mark Johnson
        text: "Great composition! The lighting is perfect.",
        timeAgo: "5h"
      },
      {
        user: userData[5], // Emily Wilson
        text: "I love night photography in the city!",
        timeAgo: "3h"
      }
    ],
    categories: ["photography", "art"]
  },
  {
    id: 6,
    user: userData[5], // Emily Wilson
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=600&q=80",
    caption: "Meet my new furry friend! 🐱 She's been keeping me company while I work from home.",
    likes: 287,
    feeling: "is feeling happy",
    comments: [
      {
        user: userData[3], // Sarah Parker
        text: "So adorable! What's her name?",
        timeAgo: "1h"
      },
      {
        user: userData[1], // Sophie Alexander
        text: "Those eyes! 😍 Cats make the best work companions.",
        timeAgo: "30m"
      }
    ],
    categories: ["pets"]
  }
];
