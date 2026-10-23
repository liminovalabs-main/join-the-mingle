"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

export function resolveMediaUrl(url?: string | Blob | null): string | undefined {
  if (!url) return undefined;
  if (typeof url !== "string") {
    return typeof window !== "undefined" ? URL.createObjectURL(url) : undefined;
  }
  // Strip any accidental "/media/https:/" or "/media/http:/" prefix
  if (url.startsWith("/media/https:/") || url.startsWith("/media/https%3A/")) {
    return url.replace(/^\/media\/https(%3A|:)\/?/, "https://");
  }
  if (url.startsWith("/media/http:/") || url.startsWith("/media/http%3A/")) {
    return url.replace(/^\/media\/http(%3A|:)\/?/, "http://");
  }
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  const backendBase = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, "")
    : "http://localhost:8000";
  return `${backendBase}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Avatar component with permanent fix for Base44 Defect #1 (Avatar distortion/squishing).
 * Strictly enforces `aspect-square`, `shrink-0`, and `object-cover`.
 */
export const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 aspect-square overflow-hidden rounded-full border border-border/80 shadow-xs bg-brand-stone/40",
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

export const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    src={resolveMediaUrl(src)}
    className={cn(
      "aspect-square h-full w-full shrink-0 object-cover",
      className
    )}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

export const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-brand-stone/60 text-brand-navy font-semibold text-xs uppercase select-none",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;
