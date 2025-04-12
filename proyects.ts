const projectsData: {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  link: string;
  featured?: boolean;
}[] = [
  {
    id: "project-1",
    title: "Digital Experience Platform",
    description:
      "A comprehensive digital platform with interactive user experience and real-time data visualization.",
    image: "/assets/projects/project1.jpg",
    tags: ["React", "TypeScript", "Node.js"],
    link: "#",
    featured: true,
  },
  {
    id: "project-2",
    title: "E-commerce Solution",
    description:
      "Modern e-commerce platform with customizable product showcases and integrated payment systems.",
    image: "/assets/projects/project2.jpg",
    tags: ["Next.js", "Tailwind CSS", "Stripe"],
    link: "#",
  },
  {
    id: "project-3",
    title: "Portfolio Generator",
    description:
      "Web application that helps creators build beautiful portfolios with minimal effort.",
    image: "/assets/projects/project3.jpg",
    tags: ["Vue.js", "GraphQL", "Netlify"],
    link: "#",
  },
  {
    id: "project-4",
    title: "Content Management System",
    description:
      "Flexible CMS designed for content creators with powerful editing tools.",
    image: "/assets/projects/project4.jpg",
    tags: ["PHP", "MySQL", "JavaScript"],
    link: "#",
  },
  {
    id: "project-5",
    title: "Mobile Finance App",
    description:
      "Financial management app with budget tracking and investment portfolio analysis.",
    image: "/assets/projects/project5.jpg",
    tags: ["React Native", "Firebase", "Redux"],
    link: "#",
    featured: true,
  },
  {
    id: "project-6",
    title: "AI-Powered Analytics",
    description:
      "Business intelligence tool with machine learning algorithms for predictive analytics.",
    image: "/assets/projects/project6.jpg",
    tags: ["Python", "TensorFlow", "Flask"],
    link: "#",
  },
];
