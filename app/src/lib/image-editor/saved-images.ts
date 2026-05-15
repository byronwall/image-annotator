import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type SavedImageRecord = {
  id: string;
  name: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  createdAt: string;
};

export type SavedImageSummary = Omit<SavedImageRecord, "filename"> & {
  url: string;
};

type SavedImageStore = {
  schemaVersion: 1;
  images: SavedImageRecord[];
};

type SaveImageInput = {
  name: string;
  mimeType: string;
  width: number;
  height: number;
  bytes: Uint8Array;
};

const getWorkspaceRoot = () => {
  const cwd = process.cwd();
  return path.basename(cwd) === "app" ? path.dirname(cwd) : cwd;
};

const getAppRoot = () => path.join(getWorkspaceRoot(), "app");

const getRuntimeDataDir = () => {
  const configured = process.env.APP_DATA_DIR?.trim();

  if (!configured) {
    return path.join(getAppRoot(), "data");
  }

  return path.isAbsolute(configured)
    ? configured
    : path.join(getWorkspaceRoot(), configured);
};

const getImageEditorDataDir = () => path.join(getRuntimeDataDir(), "image-editor");
const getImagesDir = () => path.join(getImageEditorDataDir(), "saved-images");
const getStorePath = () => path.join(getImageEditorDataDir(), "saved-images.json");

export const listSavedImages = async (): Promise<SavedImageSummary[]> => {
  const store = await readStore();

  return store.images.map(toSummary);
};

export const saveImage = async (
  input: SaveImageInput,
): Promise<SavedImageSummary> => {
  const id = randomUUID();
  const filename = `${id}.png`;
  const record: SavedImageRecord = {
    id,
    name: input.name.trim() || "Saved image",
    filename,
    mimeType: input.mimeType || "image/png",
    size: input.bytes.byteLength,
    width: input.width,
    height: input.height,
    createdAt: new Date().toISOString(),
  };
  const imagesDir = getImagesDir();

  await mkdir(imagesDir, { recursive: true });
  await writeFile(path.join(imagesDir, filename), input.bytes);

  const store = await readStore();
  await writeStore({
    schemaVersion: 1,
    images: [record, ...store.images].slice(0, 100),
  });

  return toSummary(record);
};

export const readSavedImage = async (
  id: string,
): Promise<{ record: SavedImageRecord; bytes: Uint8Array } | undefined> => {
  const store = await readStore();
  const record = store.images.find((image) => image.id === id);

  if (!record) {
    return undefined;
  }

  const bytes = await readFile(path.join(getImagesDir(), record.filename));

  return { record, bytes };
};

const toSummary = (record: SavedImageRecord): SavedImageSummary => ({
  id: record.id,
  name: record.name,
  mimeType: record.mimeType,
  size: record.size,
  width: record.width,
  height: record.height,
  createdAt: record.createdAt,
  url: `/api/image-editor/saved-images/${record.id}`,
});

const readStore = async (): Promise<SavedImageStore> => {
  try {
    return JSON.parse(await readFile(getStorePath(), "utf8")) as SavedImageStore;
  } catch (error) {
    if (isMissingFile(error)) {
      return { schemaVersion: 1, images: [] };
    }

    throw error;
  }
};

const writeStore = async (store: SavedImageStore) => {
  const storePath = getStorePath();
  await mkdir(path.dirname(storePath), { recursive: true });
  const tempPath = `${storePath}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  await rename(tempPath, storePath);
};

const isMissingFile = (error: unknown) => {
  if (!isNodeError(error) || error.code !== "ENOENT") {
    return false;
  }

  return true;
};

const isNodeError = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && "code" in error;
