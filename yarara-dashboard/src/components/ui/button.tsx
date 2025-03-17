import React from "react";

interface ButtonProps {
  variant?: "outline" | "filled";
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?:boolean
}

export const Button: React.FC<ButtonProps> = ({ variant = "filled", className, onClick, children,disabled=false }) => {
  const baseClasses = "px-4 py-2 rounded-md text-sm font-semibold focus:outline-none";
  const variantClasses =
    variant === "outline"
      ? "border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
      : "bg-blue-600 text-white hover:bg-blue-700";

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </button>
  );
};
