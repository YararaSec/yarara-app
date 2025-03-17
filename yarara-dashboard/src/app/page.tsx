'use client'
import { LogIn } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import logo from "./../../public/logoVariants/fullWhite.svg"
const LoginPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      {/* Logo Image */}
      <div className="mb-8">
        <Image
          src={logo.src} // Replace with the path to your logo
          alt="Logo"
          width={150} // Adjust width as needed
          height={150} // Adjust height as needed
       // Optional: Add styling to the logo
        />
      </div>

      {/* Login Button */}
      <Button
        onClick={() => (window.location.href = "http://localhost:5000/auth/github")}
        className="cursor-pointer flex gap-2 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-gray-100 transition-all duration-200"
      >
        <LogIn size={16} /> Login with GitHub
      </Button>
    </div>
  );
};

export default LoginPage;