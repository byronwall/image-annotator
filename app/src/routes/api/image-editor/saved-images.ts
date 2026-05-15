import type { APIEvent } from "@solidjs/start/server";
import {
  listSavedImages,
  saveImage,
} from "~/lib/image-editor/saved-images";

type SaveImageMetadata = {
  name?: unknown;
  width?: unknown;
  height?: unknown;
};

export async function GET() {
  return Response.json({ images: await listSavedImages() });
}

export async function POST(event: APIEvent) {
  try {
    const formData = await event.request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new Error("PNG file is required.");
    }

    const metadata = parseMetadata(formData.get("metadata"));
    const width = Number(metadata.width);
    const height = Number(metadata.height);
    const image = await saveImage({
      name: String(metadata.name ?? file.name ?? "Saved image"),
      mimeType: file.type || "image/png",
      width: Number.isFinite(width) && width > 0 ? Math.round(width) : 0,
      height: Number.isFinite(height) && height > 0 ? Math.round(height) : 0,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });

    return Response.json({
      image,
      images: await listSavedImages(),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Image could not be saved." },
      { status: 400 },
    );
  }
}

const parseMetadata = (
  value: FormDataEntryValue | null,
): SaveImageMetadata => {
  if (typeof value !== "string") {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    return isMetadata(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const isMetadata = (value: unknown): value is SaveImageMetadata =>
  typeof value === "object" && value !== null;
