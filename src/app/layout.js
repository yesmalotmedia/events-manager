import "./globals.css";
import Providers from "@/components/ui/Providers";
import ConditionalShell from "@/components/ui/ConditionalShell";

export const metadata = {
  title: "מיאל | ניהול סיורים והופעות",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <Providers>
          <ConditionalShell>{children}</ConditionalShell>
        </Providers>
      </body>
    </html>
  );
}
