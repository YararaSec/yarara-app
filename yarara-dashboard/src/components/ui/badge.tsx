import React from "react";

interface BadgeProps {
  variant?: "outline" | "filled";
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = "filled", children, className }) => {
  const variantClasses =
    variant === "outline"
      ? "border border-gray-300 text-gray-700 bg-white"
      : "bg-blue-600 text-white";

  return (
    <span className={`inline-block py-1 px-3 rounded-full text-xs font-medium ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};
