"use client";

import { WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OfflinePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-dvh items-center justify-center bg-gray-50 px-6 text-center">
      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-6">
        <WifiOff className="w-8 h-8 text-gray-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">You are offline</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        Connect to the internet to load new data. Your local changes are saved and will sync automatically.
      </p>
      <button
        onClick={() => router.back()}
        className="w-full max-w-xs bg-farm-green text-white font-bold py-4 rounded-xl active:scale-95 transition-transform"
      >
        Go Back
      </button>
    </div>
  );
}
