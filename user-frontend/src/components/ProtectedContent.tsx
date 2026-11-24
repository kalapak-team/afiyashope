"use client";

import type { PropsWithChildren } from "react";

export function ProtectedContent({ enabled, children }: PropsWithChildren<{ enabled: boolean }>) {
  if (!enabled) return children;

  return (
    <div
      className="select-protected"
      onContextMenu={(event) => event.preventDefault()}
      onCopy={(event) => event.preventDefault()}
    >
      {children}
    </div>
  );
}
