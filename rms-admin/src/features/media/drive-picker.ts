const clientId = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID?.trim();
const apiKey = import.meta.env.VITE_GOOGLE_PICKER_API_KEY?.trim();
const projectNumber = import.meta.env.VITE_GOOGLE_DRIVE_PROJECT_NUMBER?.trim();
const scope = "https://www.googleapis.com/auth/drive.file";

export const drivePickerConfigured = Boolean(clientId && apiKey && projectNumber);

type PickerView = {
  setMimeTypes(value: string): PickerView;
  setIncludeFolders(value: boolean): PickerView;
  setMode(value: string): PickerView;
};

export type DriveItem = { id: string; name: string };

type PickerBuilder = {
  addView(view: PickerView): PickerBuilder;
  setAppId(id: string): PickerBuilder;
  setDeveloperKey(key: string): PickerBuilder;
  setOAuthToken(token: string): PickerBuilder;
  setOrigin(origin: string): PickerBuilder;
  setTitle(title: string): PickerBuilder;
  setSelectableMimeTypes(value: string): PickerBuilder;
  enableFeature(feature: string): PickerBuilder;
  setCallback(callback: (result: { action: string; docs?: DriveItem[] }) => void): PickerBuilder;
  build(): { setVisible(value: boolean): void; dispose(): void };
};

const googleWindow = window as Window & {
  gapi?: { load: (module: string, options: { callback: () => void; onerror: () => void; timeout: number; ontimeout: () => void }) => void };
  google?: {
    accounts?: { oauth2: {
      initTokenClient(config: {
        client_id: string;
        scope: string;
        include_granted_scopes: boolean;
        callback: (response: { access_token?: string; error?: string }) => void;
        error_callback: (error: { type: string }) => void;
      }): { requestAccessToken(options: { prompt: string }): void };
    } };
    picker?: {
      DocsView: new () => PickerView;
      DocsViewMode: { LIST: string };
      PickerBuilder: new () => PickerBuilder;
      Feature: { MULTISELECT_ENABLED: string; NAV_HIDDEN: string };
      Action: { PICKED: string; CANCEL: string; ERROR: string };
    };
  };
};

function loadScript(url: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      reject(new Error("Google Drive could not load. Please try again."));
    };
    document.head.append(script);
  });
}

let loading: Promise<void> | undefined;
export function loadDrivePicker() {
  loading ??= Promise.all([
    googleWindow.google?.accounts ? Promise.resolve() : loadScript("https://accounts.google.com/gsi/client"),
    googleWindow.gapi ? Promise.resolve() : loadScript("https://apis.google.com/js/api.js"),
  ]).then(() => new Promise<void>((resolve, reject) => {
    const fail = () => reject(new Error("Google Drive could not load. Please try again."));
    if (!googleWindow.gapi) return fail();
    googleWindow.gapi.load("picker", { callback: resolve, onerror: fail, timeout: 10000, ontimeout: fail });
  })).catch((error: unknown) => {
    loading = undefined;
    throw error;
  });

  return loading;
}

function getAccessToken() {
  const oauth = googleWindow.google?.accounts?.oauth2;
  if (!oauth || !clientId) throw new Error("Google Drive is still loading.");

  return new Promise<string | null>((resolve, reject) => {
    oauth.initTokenClient({
      client_id: clientId,
      scope,
      include_granted_scopes: false,
      callback: ({ access_token, error }) => {
        if (error === "access_denied") resolve(null);
        else if (access_token) resolve(access_token);
        else reject(new Error("Could not connect to Google Drive. Please try again."));
      },
      error_callback: ({ type }) => {
        if (type === "popup_closed") resolve(null);
        else reject(new Error("Could not open Google sign-in. Allow pop-ups and try again."));
      },
    }).requestAccessToken({ prompt: "select_account" });
  });
}

export async function chooseDriveFiles(mimeTypes: string, multiple: boolean, existingToken?: string) {
  const picker = googleWindow.google?.picker;
  if (!picker || !apiKey || !projectNumber) throw new Error("Google Drive is still loading.");
  // Adding more files to a running import reuses the sign-in instead of asking again.
  const token = existingToken ?? await getAccessToken();
  if (!token) return null;

  const view = new picker.DocsView()
    .setIncludeFolders(true)
    .setMimeTypes(mimeTypes)
    .setMode(picker.DocsViewMode.LIST);
  const builder = new picker.PickerBuilder()
    .addView(view)
    .setTitle("Choose media from Google Drive")
    .enableFeature(picker.Feature.NAV_HIDDEN)
    .setAppId(projectNumber)
    .setDeveloperKey(apiKey)
    .setOAuthToken(token)
    .setOrigin(window.location.origin)
    .setSelectableMimeTypes(mimeTypes);
  if (multiple) builder.enableFeature(picker.Feature.MULTISELECT_ENABLED);

  const openDialogs = [...document.querySelectorAll<HTMLDialogElement>("dialog:modal")];
  const focused = document.activeElement;
  const root = document.documentElement;
  let dialog: ReturnType<PickerBuilder["build"]> | undefined;

  // Google attaches its picker to the body, outside Studio's native modal layer.
  // Lock the page before closing those dialogs so the picker owns scrolling.
  root.classList.add("drive-picker-open");
  try {
    for (const openDialog of [...openDialogs].reverse()) openDialog.close();
    const items = await new Promise<DriveItem[]>((resolve, reject) => {
      dialog = builder.setCallback(({ action, docs }) => {
        if (action === picker.Action.PICKED) {
          resolve((docs ?? []).map(({ id, name }) => ({ id, name: name || "Drive file" })));
        } else if (action === picker.Action.CANCEL) {
          resolve([]);
        } else if (action === picker.Action.ERROR) {
          reject(new Error("Google Drive could not open. Please try again."));
        }
      }).build();
      dialog.setVisible(true);
    });
    return { items, token };
  } finally {
    try {
      dialog?.dispose();
    } finally {
      root.classList.remove("drive-picker-open");
      for (const openDialog of openDialogs) {
        if (openDialog.isConnected && !openDialog.open) openDialog.showModal();
      }
      if (focused instanceof HTMLElement && focused.isConnected) {
        focused.focus({ preventScroll: true });
      }
    }
  }
}

export async function downloadDriveFile(id: string, token: string, mimeTypes: string, signal?: AbortSignal) {
  const headers = { Authorization: `Bearer ${token}` };
  const options = { headers, signal };
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}`;
  const metadata = await fetch(`${url}?supportsAllDrives=true&fields=name,mimeType,size,capabilities(canDownload)`, options);
  if (!metadata.ok) throw new Error("Google Drive could not read the selected file.");
  const { name, mimeType, size, capabilities } = await metadata.json();
  if (!mimeTypes.split(",").includes(mimeType)) throw new Error(`${name} is an unsupported file type.`);
  if (capabilities?.canDownload === false) throw new Error(`Your Google account cannot download ${name}.`);
  const bytes = Number(size);
  if (!Number.isSafeInteger(bytes) || bytes < 1 || bytes > (mimeType.startsWith("image/") ? 15 : 100) * 1024 * 1024) {
    throw new Error(`${name} exceeds the upload limit or is empty.`);
  }
  const response = await fetch(`${url}?alt=media&supportsAllDrives=true`, options);
  if (!response.ok) throw new Error(`Google Drive could not download ${name}.`);
  const blob = await response.blob();
  // Drive reports a type from the file name, which is often wrong (a WebP or PNG
  // saved as .jpg, for example). Trust the file's own bytes, as the server does.
  const actual = await sniffMediaType(blob);
  if (!actual) {
    throw new Error(
      `${name} is not a JPG, PNG, WebP, GIF, MP4 or WebM file. If it is a HEIC photo, export it as JPG first.`,
    );
  }
  if (!mimeTypes.split(",").includes(actual)) throw new Error(`${name} is an unsupported file type.`);
  return new File([blob], name, { type: actual });
}

async function sniffMediaType(blob: Blob) {
  const bytes = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  const text = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (["GIF87a", "GIF89a"].includes(text(0, 6))) return "image/gif";
  if (text(0, 4) === "RIFF" && text(8, 12) === "WEBP") return "image/webp";
  if (text(4, 8) === "ftyp") return "video/mp4";
  if ([26, 69, 223, 163].every((value, index) => bytes[index] === value)) return "video/webm";
  return null;
}
