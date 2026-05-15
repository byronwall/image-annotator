import type { APIEvent } from "@solidjs/start/server";
import { readSavedImage } from "~/lib/image-editor/saved-images";

export async function GET(event: APIEvent) {
  const image = await readSavedImage(event.params.id);

  if (!image) {
    return Response.json({ error: "Image not found." }, { status: 404 });
  }

  return new Response(toArrayBuffer(image.bytes), {
    headers: {
      "content-type": image.record.mimeType,
      "content-length": image.record.size.toString(),
      "cache-control": "private, max-age=60",
    },
  });
}

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
