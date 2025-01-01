import React from "react";
import { Github } from "lucide-react";

const Navbar: React.FC = () => {
  return (
    <nav className="bg-primary text-primary-foreground p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">RAG Chat</h1>
        <div className="flex space-x-4">
          <a
            href="https://github.com/yourusername/rag-chat-frontend"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 hover:text-accent-foreground"
          >
            <Github size={20} />
            <span>Frontend</span>
          </a>
          <a
            href="https://github.com/yourusername/rag-chat-backend"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 hover:text-accent-foreground"
          >
            <Github size={20} />
            <span>Backend</span>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
