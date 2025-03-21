import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "destructive" | "outline"; // "destructive" ,"outline" 추가
}

export const Button: React.FC<ButtonProps> = ({ variant = "primary", ...props }) => {
  const getClassName = () => {
    switch (variant) {
      case "secondary":
        return "bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded";
      case "danger":
        return "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded";
      case "destructive":
        return "bg-black-500 hover:bg-black-600 text-white px-4 py-2 rounded";
      case "outline":
        return "bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded";
      default:
        return "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded";
    }
  };

  return <button className={getClassName()} {...props} />;
};
