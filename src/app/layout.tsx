import type { ReactNode } from "react";

export const metadata = {
  title: "Todo",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", margin: "2rem auto", maxWidth: 480 }}>
        {children}
      </body>
    </html>
  );
}
