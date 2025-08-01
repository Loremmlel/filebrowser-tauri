import { useToastStore } from "@/stores/toastStore";
import React from "react";

export const ToastContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { message, visible } = useToastStore();

  return (
    <div className="relative w-full h-full">
      {children}

      {/* Toast */}
      <div
        className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <div className="bg-blue-200/50 border-blue-300 border-2 backdrop-blur-sm text-white px-6 py-2 rounded-2xl">
          <p className="text-sm font-medium whitespace-nowrap max-w-xs truncate">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export const toast = {
  show: (message: string, duration?: number) => {
    useToastStore.getState().showToast(message, duration);
  },
};
