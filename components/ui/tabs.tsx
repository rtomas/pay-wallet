"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={className} data-value={value}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            _value: value,
            _onValueChange: onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
}

function TabsList({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { _value?: string; _onValueChange?: (v: string) => void }) {
  const { _value, _onValueChange, ...rest } = props as any;
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-xl bg-[var(--secondary)] p-1",
        className
      )}
      {...rest}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            _value,
            _onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
}

function TabsTrigger({
  value,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
  _value?: string;
  _onValueChange?: (v: string) => void;
}) {
  const { _value, _onValueChange, ...rest } = props as any;
  const isActive = _value === value;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
        isActive
          ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        className
      )}
      onClick={() => _onValueChange?.(value)}
      {...rest}
    >
      {children}
    </button>
  );
}

function TabsContent({
  value,
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value: string;
  _value?: string;
  _onValueChange?: (v: string) => void;
}) {
  const { _value, _onValueChange, ...rest } = props as any;
  if (_value !== value) return null;

  return (
    <div className={cn("mt-2", className)} {...rest}>
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
