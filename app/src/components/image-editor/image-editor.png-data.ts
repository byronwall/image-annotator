import {
  type HistoryEntry,
  type ImageEditorPngPayload,
  type ImageEditorProject,
} from "./image-editor.types";

const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10] as const;
const pngDataKeyword = "PNGDATA";
const textChunkType = "tEXt";
const iendChunkType = "IEND";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const createPngDataPayload = (
  project: ImageEditorProject,
  history: HistoryEntry[],
): ImageEditorPngPayload => ({
  kind: "image-annotator.project",
  version: 1,
  exportedAt: Date.now(),
  project,
  historyLog: history.map((entry) => ({
    id: entry.id,
    label: entry.label,
    timestamp: entry.timestamp,
  })),
  history,
});

export const appendPngDataToBlob = async (
  blob: Blob,
  payload: ImageEditorPngPayload,
): Promise<Blob> => {
  const bytes = new Uint8Array(await blob.arrayBuffer());

  if (!hasPngSignature(bytes)) {
    return blob;
  }

  const insertionOffset = findIendOffset(bytes);

  if (insertionOffset === undefined) {
    return blob;
  }

  const data = encoder.encode(`${pngDataKeyword}\0${JSON.stringify(payload)}`);
  const chunk = createPngChunk(textChunkType, data);

  return new Blob(
    [
      asArrayBuffer(bytes.slice(0, insertionOffset)),
      asArrayBuffer(chunk),
      asArrayBuffer(bytes.slice(insertionOffset)),
    ],
    { type: "image/png" },
  );
};

export const extractPngDataFromFile = async (
  file: File,
): Promise<ImageEditorPngPayload | undefined> => {
  if (file.type !== "image/png" && !file.name.toLowerCase().endsWith(".png")) {
    return undefined;
  }

  return extractPngDataFromBuffer(await file.arrayBuffer());
};

export const extractPngDataFromBuffer = (
  buffer: ArrayBuffer,
): ImageEditorPngPayload | undefined => {
  const bytes = new Uint8Array(buffer);

  if (!hasPngSignature(bytes)) {
    return undefined;
  }

  let offset: number = pngSignature.length;

  while (offset + 12 <= bytes.length) {
    const length = readUint32(bytes, offset);
    const typeStart = offset + 4;
    const dataStart = typeStart + 4;
    const dataEnd = dataStart + length;
    const crcEnd = dataEnd + 4;

    if (crcEnd > bytes.length) {
      return undefined;
    }

    const type = decoder.decode(bytes.slice(typeStart, dataStart));

    if (type === textChunkType) {
      const data = bytes.slice(dataStart, dataEnd);
      const separatorIndex = data.indexOf(0);

      if (separatorIndex > 0) {
        const keyword = decoder.decode(data.slice(0, separatorIndex));

        if (keyword === pngDataKeyword) {
          const text = decoder.decode(data.slice(separatorIndex + 1));
          let parsed: unknown;

          try {
            parsed = JSON.parse(text) as unknown;
          } catch {
            return undefined;
          }

          return isPngPayload(parsed) ? parsed : undefined;
        }
      }
    }

    offset = crcEnd;
  }

  return undefined;
};

export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read image file."));
    };
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });

const hasPngSignature = (bytes: Uint8Array): boolean =>
  pngSignature.every((value, index) => bytes[index] === value);

const findIendOffset = (bytes: Uint8Array): number | undefined => {
  let offset: number = pngSignature.length;

  while (offset + 12 <= bytes.length) {
    const length = readUint32(bytes, offset);
    const typeStart = offset + 4;
    const dataStart = typeStart + 4;
    const dataEnd = dataStart + length;
    const crcEnd = dataEnd + 4;

    if (crcEnd > bytes.length) {
      return undefined;
    }

    const type = decoder.decode(bytes.slice(typeStart, dataStart));

    if (type === iendChunkType) {
      return offset;
    }

    offset = crcEnd;
  }

  return undefined;
};

const createPngChunk = (type: string, data: Uint8Array): Uint8Array => {
  const typeBytes = encoder.encode(type);
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  view.setUint32(8 + data.length, crc32(chunk.slice(4, 8 + data.length)));

  return chunk;
};

const readUint32 = (bytes: Uint8Array, offset: number): number =>
  new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0);

const asArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

const crcTable = (() => {
  const table = new Uint32Array(256);

  for (let i = 0; i < 256; i += 1) {
    let value = i;

    for (let j = 0; j < 8; j += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[i] = value >>> 0;
  }

  return table;
})();

const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
};

const isPngPayload = (value: unknown): value is ImageEditorPngPayload => {
  if (!isRecord(value)) {
    return false;
  }

  const project = value.project;

  return (
    value.kind === "image-annotator.project" &&
    value.version === 1 &&
    typeof value.exportedAt === "number" &&
    isProject(project) &&
    Array.isArray(value.historyLog) &&
    (value.history === undefined ||
      (Array.isArray(value.history) && value.history.every(isHistoryEntry)))
  );
};

const isHistoryEntry = (value: unknown): value is HistoryEntry => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.timestamp === "number" &&
    isProject(value.project)
  );
};

const isProject = (value: unknown): value is ImageEditorProject => {
  if (!isRecord(value) || !isRecord(value.baseImage)) {
    return false;
  }

  return (
    value.version === 1 &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.width === "number" &&
    typeof value.height === "number" &&
    typeof value.baseImage.dataUrl === "string" &&
    Array.isArray(value.annotations)
  );
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
