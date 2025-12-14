import type { Metadata } from "next";
import { Nunito, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "World Recipe | Cozy Culinary Adventure",
  description: "A cozy 3D life-sim where you travel to themed maps, befriend NPCs, gather ingredients, and cook dishes from around the world.",
  keywords: ["game", "cooking", "cozy", "3D", "RPG", "life-sim"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${nunito.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
