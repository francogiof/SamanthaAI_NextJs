import { useState } from 'react';

export function useMediaDevices() {
  // Example: camera/mic device management
  const [isCameraOn, setIsCameraOn] = useState(false);
  // ...other state and logic...
  return {
    isCameraOn,
    setIsCameraOn,
    // ...other state and setters...
  };
}
