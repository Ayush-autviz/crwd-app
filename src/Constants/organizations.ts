export interface Organization {
  id: string;
  name: string;
  imageUrl: string;
  color?: string;
  shortDesc?: string;
  description?: string;
}

export const CROWDS: Organization[] = [
  {
    id: "1",
    name: "Feed the hungry",
    imageUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    color: "#1a8cff",
    shortDesc: "Fighting hunger in local communities",
    description: "We work to provide meals and food security to families in need across our community."
  },
  {
    id: "2", 
    name: "Clean Water Initiative",
    imageUrl: "https://randomuser.me/api/portraits/women/25.jpg",
    color: "#00bcd4",
    shortDesc: "Providing clean water access",
    description: "Ensuring access to clean, safe drinking water for communities worldwide."
  },
  {
    id: "3",
    name: "Education for All",
    imageUrl: "https://randomuser.me/api/portraits/men/45.jpg", 
    color: "#4caf50",
    shortDesc: "Quality education access",
    description: "Breaking barriers to education and providing learning opportunities for all children."
  }
];

export const RECENTS: Organization[] = [
  {
    id: "4",
    name: "Animal Rescue Network",
    imageUrl: "https://randomuser.me/api/portraits/women/30.jpg",
    color: "#ff9800",
    shortDesc: "Rescuing and caring for animals",
    description: "Providing shelter, medical care, and finding homes for abandoned animals."
  },
  {
    id: "5",
    name: "Youth Development",
    imageUrl: "https://randomuser.me/api/portraits/men/28.jpg",
    color: "#9c27b0",
    shortDesc: "Empowering young people",
    description: "Creating opportunities and programs for youth development and leadership."
  },
  {
    id: "6",
    name: "Environmental Action",
    imageUrl: "https://randomuser.me/api/portraits/women/35.jpg",
    color: "#2e7d32",
    shortDesc: "Protecting our environment",
    description: "Working to preserve and protect our natural environment for future generations."
  }
];

export const SUGGESTED: Organization[] = [
  {
    id: "7",
    name: "Healthcare Access",
    imageUrl: "https://randomuser.me/api/portraits/men/40.jpg",
    color: "#d32f2f",
    shortDesc: "Medical care for all",
    description: "Ensuring everyone has access to quality healthcare regardless of their circumstances."
  },
  {
    id: "8",
    name: "Housing First",
    imageUrl: "https://randomuser.me/api/portraits/women/42.jpg",
    color: "#1976d2",
    shortDesc: "Ending homelessness",
    description: "Providing housing solutions and support services for those experiencing homelessness."
  },
  {
    id: "9",
    name: "Mental Health Support",
    imageUrl: "https://randomuser.me/api/portraits/men/38.jpg",
    color: "#7b1fa2",
    shortDesc: "Mental wellness for all",
    description: "Breaking stigma and providing mental health resources and support."
  },
  {
    id: "10",
    name: "Senior Care",
    imageUrl: "https://randomuser.me/api/portraits/women/50.jpg",
    color: "#f57c00",
    shortDesc: "Supporting our elders",
    description: "Providing care, companionship, and support for senior citizens in our community."
  }
];
