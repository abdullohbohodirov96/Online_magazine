import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "Продуктовый Маркетплейс | Свежие продукты с доставкой",
  description: "Онлайн-магазин и маркетплейс продуктов. Свежие овощи, фрукты, молочные продукты, мясо и напитки по доступным ценам.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
