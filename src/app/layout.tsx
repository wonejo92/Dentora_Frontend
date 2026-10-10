import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { THEME_COOKIE } from "@/lib/constants";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Dentora", template: "%s · Dentora" },
  description: "Agenda, pacientes y reservas online para clínicas dentales.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // "light" o "dark" fijan el tema; sin valor (o "system") manda el sistema operativo.
  const theme = (await cookies()).get(THEME_COOKIE)?.value;
  return (
    <html
      lang="es"
      data-theme={theme === "light" || theme === "dark" ? theme : undefined}
      className={`${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
