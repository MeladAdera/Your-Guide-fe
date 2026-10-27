"use client";

import { useEffect } from "react";
import { clearDeviceData } from "@/lib/device-data";

/**
 * Clears device data again when the signed-out page opens, so what that page
 * promises is true however the person arrived. Renders nothing.
 */
export function ClearOnMount() {
  useEffect(() => {
    clearDeviceData();
  }, []);
  return null;
}
