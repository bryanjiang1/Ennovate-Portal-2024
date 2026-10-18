"use client";

import { TYPEWRITER_ONE_LINERS } from "@/constants/landing";
import Image from "next/image";
import { Typewriter } from "react-simple-typewriter";

const Landing = () => {
  return (
    <div style={{ height: "100vh", width: "100vw" }} className="relative">
      {/* Background Image */}
      <div className="h-full">
        <Image
          src="/ennovate/landing-banner-new.webp"
          alt="Landing Banner Image"
          fill={true}
          className="object-cover"
        />
      </div>

      {/* Blue Overlay */}
      <div className="absolute inset-0 bg-ennovate-main opacity-30"></div>
      {/* 
      1. Choice 1: 500 - 30
      2. Choice 2: 900 - 40
      3. Choice 3: 700 - 20
      */}

      {/* Text Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center h-full">
        <div className="relative flex flex-col md:flex-row items-center">
          {/* ENNOVATE Text */}
          <div className="text-white text-center font-semibold text-6xl md:text-9xl">
            ENNOVATE
          </div>
          {/* Logo Image */}
          <div className="relative h-36 w-36 md:h-52 md:w-52 ml-4">
            <Image
              src="/ennovate/ennovate-w.webp"
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Typewriter Effect */}
        <div className="text-white text-center text-xl md:text-3xl md:text-4xl">
          <Typewriter
            words={TYPEWRITER_ONE_LINERS}
            loop={true}
            cursor
            cursorStyle="_"
            typeSpeed={80}
            deleteSpeed={40}
            delaySpeed={2000}
          />
        </div>
        <div className="relative flex flex-col md:flex-row items-center mt-12">
          <button
            onClick={() =>
              document
                .querySelector("#about")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="text-white hover:text-ennovate-dark-blue text-md md:text-xl font-extrabold bg-ennovate-main hover:bg-white rounded-xl px-4 py-2 text-center"
          >
            Get Started
          </button>
          <button
            onClick={() =>
              document
                .querySelector("#stats")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="md:ml-8 text-ennovate-dark-blue mt-4 md:mt-0 text-md md:text-xl font-extrabold bg-ennovate-yellow hover:bg-white rounded-xl px-4 py-2 text-center"
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
