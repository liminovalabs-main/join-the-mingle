import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/layout/providers";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mingler — Curated Social Experiences in London",
  description:
    "Discover London's most engaging curated dining, cocktails, and cultural experiences. Connect naturally with discerning people at exceptional venues.",
  keywords: [
    "London social events",
    "Curated dining London",
    "London cocktail mixers",
    "Meet people London",
    "Mingler London",
  ],
  authors: [{ name: "Mingler London" }],
  openGraph: {
    title: "Mingler — Curated Social Experiences in London",
    description:
      "London's curated platform for intimate group dining, tastings, and connection.",
    url: "https://mingler.co.uk",
    siteName: "Mingler",
    locale: "en_GB",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-GB"
      suppressHydrationWarning
      className={`${archivo.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var isExtAttr = function(attr) {
                    return attr && (attr.indexOf('bis_') === 0 || attr.indexOf('__processed_') === 0);
                  };
                  var observer = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes') {
                        var name = m.attributeName;
                        if (isExtAttr(name) && m.target.hasAttribute && m.target.hasAttribute(name)) {
                          m.target.removeAttribute(name);
                        }
                      }
                    }
                  });
                  observer.observe(document.documentElement, {
                    attributes: true,
                    subtree: true
                  });
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-brand-ivory text-brand-ink selection:bg-brand-coral selection:text-white"
      >
        <Providers>
          <Suspense fallback={<div className="h-20 bg-brand-navy" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
