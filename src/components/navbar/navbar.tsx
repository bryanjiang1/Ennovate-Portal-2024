"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { navbarLinks } from "@/constants/navbar";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const { isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const handleScroll = () => setScrollPosition(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMounted]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleAuthAction = () => {
    if (!isLoading) {
      setIsMenuOpen(false);
      if (isAuthenticated) logout();
      else router.push("/login");
    }
  };

  return (
    <nav
      className="fixed w-full z-50 top-0 start-0"
      style={{
        backgroundColor:
          pathname === "/"
            ? `rgba(0, 59, 111, ${Math.min(scrollPosition * 0.01, 1)})`
            : "#003B6F",
      }}
    >
      <div className="max-w-screen-xl h-20 flex items-center justify-between mx-auto px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img src="/ennovate/ennovate-w.webp" className="h-12" alt="Logo" />
        </Link>

        {/* Right side: Admin + Hamburger */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleAuthAction}
            className="text-ennovate-dark-blue text-sm md:text-base font-extrabold bg-ennovate-yellow hover:bg-white rounded-3xl px-4 py-2"
          >
            {isAuthenticated ? "LOGOUT" : "ADMIN"}
          </button>

          {/* Hamburger (always visible) */}
          <button
            ref={hamburgerRef}
            onClick={toggleMenu}
            type="button"
            className="inline-flex items-center bg-transparent p-2 w-10 h-10 justify-center rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
            aria-controls="navbar-menu"
            aria-expanded={isMenuOpen}
            style={{
              pointerEvents: "auto",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <svg
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="white"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Dropdown (appears under navbar) */}
      {isMenuOpen && (
        <div className="absolute top-20 left-0 w-full bg-ennovate-main px-4 py-4 z-50">
          <ul className="flex flex-col gap-4 max-w-screen-xl mx-auto">
            {isAuthenticated && (
              <li>
                <Link
                  href="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-white font-bold hover:underline"
                >
                  DASHBOARD
                </Link>
              </li>
            )}
            {navbarLinks.map((link, index) => (
              <li key={index}>
                <Link
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-white font-bold hover:underline"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
