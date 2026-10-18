import { CACHE_KEY_EXPIRY_TIME } from "@/constants/actions";
import { connectToDatabase } from "@/lib/mongoose";
import { redis } from "@/lib/redis";
import Blog from "@/models/Blog";
import { captureException } from "@sentry/nextjs";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { parse } from "node-html-parser";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const cacheKey = body.featured ? "blog?featured" : "blog";

    const cachedValue = await redis?.get(cacheKey);
    if (cachedValue) {
      return NextResponse.json(JSON.parse(cachedValue));
    }

    let blogs;
    if (body.featured) {
      blogs = await Blog.find({ featured: true });
    } else {
      blogs = await Blog.find();
    }

    const blogData = await Promise.all(
      blogs.map(async (blog) => {
        const url = blog.mediumUrl;

        const isMedium = url.includes("medium.com"); // if isMedium false, is LinkedIn post

        // do not use axios to avoid 403
        const res = await fetch(url);
        const html = await res.text();
        const root = parse(html);

        const coverImage = (isMedium ? root.querySelector('meta[property="og:image"]') : root.querySelectorAll('meta[property="og:image"]')[1])?.getAttribute("content")

        const title = isMedium ? root
          .querySelector('meta[property="og:title"]')
          ?.getAttribute("content") : root.querySelector('title')?.textContent?.trim();

        const subtitle = isMedium ? root
          .querySelector('meta[property="og:description"]')
          ?.getAttribute("content") : "";

        const readingTime = root
          .querySelector(`meta[name="twitter:data${isMedium ? 1 : 2}"]`)
          ?.getAttribute("content")

        const dateUploaded = isMedium ? new Date(
          root
            .querySelector('meta[property="article:published_time"]')!
            .getAttribute("content")
            ?.split("T")[0]!
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }) : root.querySelector('.base-main-card__metadata')?.textContent?.trim().replace('Published ', '').trim();

        return {
          coverImage,
          title,
          subtitle,
          readingTime,
          dateUploaded,
          mediumUrl: blog.mediumUrl,
          featured: blog.featured,
          id: blog._id,
        };
      })
    );

    await redis
      ?.pipeline()
      .set(cacheKey, JSON.stringify(blogData))
      .expire(cacheKey, CACHE_KEY_EXPIRY_TIME)
      .exec();

    return NextResponse.json(blogData);
  } catch (e) {
    captureException(e);
    console.error()
    return NextResponse.json(
      { message: "Failed to fetch blog data" },
      { status: 500 }
    );
  }
}
