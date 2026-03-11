import { WorkspaceShell } from "@/components/layout/workspace-shell";

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
