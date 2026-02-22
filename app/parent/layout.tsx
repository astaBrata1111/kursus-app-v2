import AppShellLoader from "@/app/components/AppShellLoader";
import type { ReactNode } from "react";
export default function ParentLayout({ children }: { children: ReactNode }) {
    return <AppShellLoader>{children}</AppShellLoader>;
}
