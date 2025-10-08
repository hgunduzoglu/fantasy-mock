import "./globals.css";
import { DraftProvider } from "../context/DraftContext";

export const metadata = {
  title: "Fantasy Draft",
  description: "Mock draft simulator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DraftProvider>{children}</DraftProvider>
      </body>
    </html>
  );
}
