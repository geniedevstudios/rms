export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch("/api/cms/" + path, {
    ...options,
    headers: {
      ...(options.body instanceof Blob
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}
function legacyUpload(
  file: File,
  onProgress: (value: number) => void,
): Promise<import("../../shared/content.types").AdminState> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/cms/upload");
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );
    xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () =>
      reject(new Error("Upload interrupted. Please try again."));
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status < 200 || xhr.status >= 300)
          reject(new Error(data.error));
        else resolve(data.state);
      } catch {
        reject(new Error("Upload failed. Please try again."));
      }
    };
    xhr.send(file);
  });
}

type UploadPreparation =
  | { provider: "legacy" }
  | { provider: "r2"; uploadUrl: string; contentType: string; receipt: string };

async function uploadToR2<T>(
  file: File,
  purpose: "media" | "profile",
  onProgress: (value: number) => void,
): Promise<T | null> {
  const prepared = await api<UploadPreparation>("media/prepare", {
    method: "POST",
    body: JSON.stringify({ purpose, name: file.name, type: file.type, size: file.size }),
  });
  if (prepared.provider === "legacy") return null;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", prepared.uploadUrl);
    xhr.setRequestHeader("Content-Type", prepared.contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () => reject(new Error("Upload interrupted. Please try again."));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error("R2 could not store that file."));
    };
    xhr.send(file);
  });

  return api<T>("media/complete", {
    method: "POST",
    body: JSON.stringify({ purpose, receipt: prepared.receipt }),
  });
}

export async function upload(file: File, onProgress: (value: number) => void) {
  const result = await uploadToR2<{ state: import("../../shared/content.types").AdminState }>(
    file, "media", onProgress,
  );
  return result ? result.state : legacyUpload(file, onProgress);
}

export async function uploadProfilePhoto(file: File) {
  const result = await uploadToR2<{ url: string }>(file, "profile", () => {});
  if (result) return result.url;
  const legacy = await api<{ url: string }>("profile/photo", { method: "POST", body: file });
  return legacy.url;
}
