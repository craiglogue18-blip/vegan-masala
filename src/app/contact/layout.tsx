import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Vegan Masala",
  description:
    "Contact Vegan Masala with recipe questions, suggestions, partnership enquiries or feedback about the website.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
