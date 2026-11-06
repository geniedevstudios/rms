export type AppointmentReceipt = {
  id: string;
  name: string;
  service: string;
  meeting: string;
  appointment: string;
  fee: number;
  vision?: string;
};

const key = (id: string) => `rms-appointment:${id}`;

export function rememberAppointment(receipt: AppointmentReceipt) {
  sessionStorage.setItem(key(receipt.id), JSON.stringify(receipt));
}

export function readAppointment(id: string): AppointmentReceipt | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(key(id)) || "");
    if (!parsed || parsed.id !== id || typeof parsed.service !== "string") return null;
    return parsed as AppointmentReceipt;
  } catch {
    return null;
  }
}

export function formatAppointmentDay(value: string) {
  const [year, month, date] = value.split("-").map(Number);
  if (!year || !month || !date) return value;
  return new Intl.DateTimeFormat("en-GH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, date, 12)));
}
