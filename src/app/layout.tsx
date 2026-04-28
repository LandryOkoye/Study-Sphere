import type { Metadata } from "next";
import { Inter, Fira_Code, Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { WalletProvider } from "@/context/WalletContext";
import { StudyTracker } from "@/components/layout/StudyTracker";
import Web3AuthProviderSetup from "@/context/Web3AuthProviderSetup";
import { Web3AuthContextProvider } from "@/context/Web3AuthContext";
import { CurriculumProvider } from "@/context/CurriculumContext";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudySphere",
  description: "Decentralized AI-powered structured learning platform",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body
        className={`${inter.variable} ${firaCode.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Web3AuthProviderSetup>
            <Web3AuthContextProvider>
              <WalletProvider>
                <CurriculumProvider>
                  <StudyTracker />
                  {children}
                </CurriculumProvider>
              </WalletProvider>
            </Web3AuthContextProvider>
          </Web3AuthProviderSetup>
        </ThemeProvider>
        <Script
          src="https://newwebpay.qa.interswitchng.com/inline-checkout.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
