import AppShellLoader from "@/app/components/AppShellLoader";
import type { ReactNode } from "react";
export default function StudentLayout({ children }: { children: ReactNode }) {
    return <AppShellLoader>{children}</AppShellLoader>;
}
