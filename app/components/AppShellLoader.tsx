"use client";

import AppShell from "./AppShell";
import { type ReactNode } from "react";

export default function AppShellLoader({ children }: { children: ReactNode }) {
    return <AppShell>{children}</AppShell>;
}
