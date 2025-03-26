export interface User {
  id: number;
  name: string;
  profilePic: string;
  error?: string;
}

export const userData: User[] = [
  {
    id: 1,
    name: "John Doe",
    profilePic: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&h=48&q=80"
  },
  {
    id: 2,
    name: "Sophie Alexander",
    profilePic: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&h=48&q=80"
  },
  {
    id: 3,
    name: "Mark Johnson",
    profilePic: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&h=48&q=80"
  },
  {
    id: 4,
    name: "Sarah Parker",
    profilePic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&h=48&q=80"
  },
  {
    id: 5,
    name: "Robert Adams",
    profilePic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&h=48&q=80"
  },
  {
    id: 6,
    name: "Emily Wilson",
    profilePic: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&h=48&q=80"
  },
  {
    id: 7,
    name: "Phillip Tender",
    profilePic: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&h=48&q=80"
  }
];
