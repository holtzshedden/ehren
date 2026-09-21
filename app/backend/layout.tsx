import type { Metadata } from "next";
import BackendGate from "./BackendGate";
import "./backend.css";

export const metadata: Metadata = {
  title: "EHRENFELD ERP",
  description: "Internes EHRENFELD ERP",
};

export default function BackendLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <BackendGate>{children}</BackendGate>;
}
