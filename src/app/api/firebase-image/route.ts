// pages/api/firebase-image.ts
import { adminBucket } from "@/services/firebaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { existingPath, userId, cardId, imageType } = await req.json();

    if (!existingPath) {
      return NextResponse.json(
        { message: "Missing existingPath" },
        { status: 400 }
      );
    }

    // 🧩 Extract the internal storage path
    let cleanPath = existingPath;

    // If it's a full URL, extract the path after "/o/"
    if (existingPath.startsWith("http")) {
      const match = existingPath.match(/\/o\/(.*?)\?/);
      if (match && match[1]) {
        cleanPath = decodeURIComponent(match[1]);
      } else {
        throw new Error("Invalid Firebase Storage URL");
      }
    }

    // Define source and destination
    const srcFile = adminBucket.file(cleanPath);
    const destPath = `cards/${userId}/${cardId}/${imageType}_copy_${Date.now()}.jpg`;
    const destFile = adminBucket.file(destPath);
   // return NextResponse.json({ srcFile,destPath,destFile }, { status: 200 });
    // Copy file inside the bucket
    await srcFile.copy(destFile);

    // Generate new public URL
    const url = `https://firebasestorage.googleapis.com/v0/b/${
      adminBucket.name
    }/o/${encodeURIComponent(destFile.name)}?alt=media`;

    return NextResponse.json({ url }, { status: 200 });
  } catch (error: any) {
    console.error("🔥 Firebase copy failed:", error);
    return NextResponse.json(
      {
        message: error.message || "Server error",
        code: error.code,
        adminBucket,
      },
      { status: 500 }
    );
  }
}
