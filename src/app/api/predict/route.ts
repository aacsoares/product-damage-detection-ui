import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Forward the multipart form-data to the backend
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Prepare a new FormData to send to the backend
  const backendForm = new FormData();
  backendForm.append("file", file);

  // Forward the request to the backend
  const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8080";
  const backendRes = await fetch(
    `${backendUrl}/api/v1/custom-vision/predict-file`,
    {
      method: "POST",
      body: backendForm,
    }
  );

  const contentType = backendRes.headers.get("content-type") || "";
  if (!backendRes.ok) {
    return NextResponse.json({ error: "Backend error" }, { status: 500 });
  }

  if (contentType.includes("application/json")) {
    const data = await backendRes.json();
    return NextResponse.json(data);
  } else {
    const text = await backendRes.text();
    return new NextResponse(text, { status: backendRes.status });
  }
}
