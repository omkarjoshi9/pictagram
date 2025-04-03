export interface User {
  id: number;
  name: string;
  username?: string; // Added to match with other User interfaces
  profilePic: string;
  error?: string;
}

export const userData: User[] = [
  {
    id: 1,
    name: "Omkar Joshi",
    username: "omkarjoshi",
    profilePic: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&h=48&q=80"
  },
  {
    id: 2,
    name: "Malhar Inamdar",
    username: "malharinamdar",
    profilePic: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&h=48&q=80"
  },
  {
    id: 3,
    name: "Sarvesh Joshi",
    username: "sarveshjoshi",
    profilePic: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&h=48&q=80"
  },
  {
    id: 4,
    name: "Swayam Gosavi",
    username: "swayamgosavi",
    profilePic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&h=48&q=80"
  },
  {
    id: 5,
    name: "Omkar Joshi",
    username: "omkar_j",
    profilePic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&h=48&q=80"
  },
  {
    id: 6,
    name: "Malhar Inamdar",
    username: "malhar_i",
    profilePic: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&h=48&q=80"
  },
  {
    id: 7,
    name: "Sarvesh Joshi",
    username: "sarvesh_j",
    profilePic: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&h=48&q=80"
  }
];
