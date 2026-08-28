import type { Metadata } from "next";
import "./backend.css";

export const metadata: Metadata = {
  title: "EHRENFELD Backend",
  description: "Internes EHRENFELD Backend",
};

export default function BackendLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}