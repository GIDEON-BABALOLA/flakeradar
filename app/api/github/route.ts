import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url param" }, { status: 400 });

  // Only allow GitHub API urls
  if (!url.startsWith("https://api.github.com/")) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  try {
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    });

    return NextResponse.json(res.data, {
      headers: { link: res.headers["link"] ?? "" },
    });
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } }).response?.status ?? 500;
    const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "GitHub API error";
    return NextResponse.json({ message }, { status });
  }
}