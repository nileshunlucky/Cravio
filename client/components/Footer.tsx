"use client";
import React from "react";
import { Instagram } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full py-6">
      <div className="max-w-6xl mx-auto px-4 ">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Copyright */}
          <p className="text-sm text-zinc-400 text-center">
            © {year} <span className="theseason">Mellvitta</span> Inc. All rights reserved.
          </p>

          {/* Links + Instagram */}
          <div className="flex items-center flex-wrap gap-6 justify-center">

            {/* Links */}
            <ul className="flex items-center gap-4">
              <li>
                <Link
                  href="/policy"
                  className="text-sm text-zinc-300 hover:text-white transition"
                >
                  Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-zinc-300 hover:text-white transition"
                >
                  Terms
                </Link>
              </li>
            </ul>

            {/* Instagram */}
            <a
              href="https://instagram.com/mellvitta.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-zinc-300 hover:text-white transition"
            >
              <Instagram size={20} />
            </a>

          </div>
        </div>
      </div>
    </footer>
  );
}
