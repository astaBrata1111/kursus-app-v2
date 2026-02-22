import AppShellLoader from "@/app/components/AppShellLoader";
import type { ReactNode } from "react";
export default function TeacherLayout({ children }: { children: ReactNode }) {
    return <AppShellLoader>{children}</AppShellLoader>;
}
