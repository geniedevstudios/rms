import { HttpError } from "./content-store.mjs";

const countries = [
  ["GH", "Ghana"],
  ["AE", "United Arab Emirates"],
  ["AT", "Austria"],
  ["AU", "Australia"],
  ["BE", "Belgium"],
  ["BJ", "Benin"],
  ["BF", "Burkina Faso"],
  ["BR", "Brazil"],
  ["CM", "Cameroon"],
  ["CA", "Canada"],
  ["CN", "China"],
  ["CI", "Côte d'Ivoire"],
  ["DK", "Denmark"],
  ["EG", "Egypt"],
  ["ET", "Ethiopia"],
  ["FR", "France"],
  ["GM", "Gambia"],
  ["DE", "Germany"],
  ["HK", "Hong Kong"],
  ["IN", "India"],
  ["IE", "Ireland"],
  ["IT", "Italy"],
  ["JP", "Japan"],
  ["KE", "Kenya"],
  ["LR", "Liberia"],
  ["MA", "Morocco"],
  ["MX", "Mexico"],
  ["NL", "Netherlands"],
  ["NZ", "New Zealand"],
  ["NG", "Nigeria"],
  ["NO", "Norway"],
  ["PT", "Portugal"],
  ["QA", "Qatar"],
  ["RW", "Rwanda"],
  ["SA", "Saudi Arabia"],
  ["SN", "Senegal"],
  ["SL", "Sierra Leone"],
  ["SG", "Singapore"],
  ["ZA", "South Africa"],
  ["KR", "South Korea"],
  ["ES", "Spain"],
  ["SE", "Sweden"],
  ["CH", "Switzerland"],
  ["TZ", "Tanzania"],
  ["TG", "Togo"],
  ["TR", "Turkey"],
  ["UG", "Uganda"],
  ["GB", "United Kingdom"],
  ["US", "United States"],
];

const names = new Map(countries);
const codes = new Map(countries.map(([code, name]) => [name.toLowerCase(), code]));

export function countryCode(value) {
  const raw = String(value || "").trim();
  const upper = raw.toUpperCase();
  if (names.has(upper)) return upper;
  return codes.get(raw.toLowerCase()) || "";
}

export function countryName(code) {
  return names.get(code) || "";
}

export function shippingCountries() {
  return countries.map(([code, name]) => ({ code, name }));
}

function origin(env) {
  return {
    name: "RIVERMINDSTYLE",
    street1: String(env.SHIPPO_FROM_STREET || "Vanilla Street").trim(),
    city: String(env.SHIPPO_FROM_CITY || "Adenta").trim(),
    state: String(env.SHIPPO_FROM_STATE || "Greater Accra").trim(),
    zip: String(env.SHIPPO_FROM_ZIP || "").trim(),
    country: "GH",
    email: String(env.SHIPPO_FROM_EMAIL || "rivermindstyle.operations@gmail.com").trim(),
    ...(String(env.SHIPPO_FROM_PHONE || "").trim()
      ? { phone: String(env.SHIPPO_FROM_PHONE).trim() }
      : {}),
  };
}

function clean(value, max) {
  return String(value || "").trim().slice(0, max);
}

function placeKey(address) {
  return [address.country, address.state, address.city, address.zip, address.street]
    .map((part) => part.toLowerCase().replace(/\s+/g, " "))
    .join("|");
}

function httpsUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

export function createShippo(env = process.env, fetchImpl = fetch) {
  const token = String(env.SHIPPO_API_TOKEN || "").trim();
  const from = origin(env);
  const quotes = new Map();
  const fx = new Map();

  async function cedisRate(currency) {
    const code = String(currency || "").toUpperCase();
    if (code === "GHS") return 1;
    const cached = fx.get(code);
    if (cached && Date.now() - cached.at < 60 * 60 * 1000) return cached.rate;
    const response = await fetchImpl(
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(code)}&to=GHS`,
    );
    const data = await response.json().catch(() => ({}));
    const rate = Number(data?.rates?.GHS);
    if (!response.ok || !Number.isFinite(rate) || rate <= 0)
      throw new HttpError(503, "Delivery prices are unavailable right now.");
    fx.set(code, { at: Date.now(), rate });
    return rate;
  }

  async function shippo(path, body) {
    if (!token) throw new HttpError(503, "Delivery prices are not available yet.");
    const response = await fetchImpl(`https://api.goshippo.com${path}`, {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.detail || data.messages?.[0]?.text || data.error || "";
      throw new HttpError(502, clean(message, 180) || "Delivery prices could not be checked.");
    }
    return data;
  }

  return {
    enabled: Boolean(token),
    async rates(input) {
      const code = countryCode(input?.address?.country);
      if (!code) throw new HttpError(400, "Choose a delivery country.");
      if (code === "GH") return [];
      const address = {
        country: code,
        state: clean(input.address?.state, 80),
        city: clean(input.address?.city, 80),
        zip: clean(input.address?.zip, 20),
        street: clean(input.address?.street, 120),
      };
      const name = clean(input.name, 80);
      const phone = clean(input.phone, 30);
      const email = clean(input.email, 254);
      const pieces = Math.round(Number(input.pieces));
      if (!address.street || !address.city || !address.zip || !name || !phone || !email)
        throw new HttpError(400, "Add the full delivery address to see carrier prices.");
      if (!Number.isInteger(pieces) || pieces < 1 || pieces > 30)
        throw new HttpError(400, "Add pieces to your bag.");
      const weight = Math.min(5, pieces * 0.4).toFixed(2);
      const shipment = await shippo("/shipments/", {
        address_from: from,
        address_to: {
          name,
          street1: address.street,
          city: address.city,
          state: address.state,
          zip: address.zip,
          country: address.country,
          phone,
          email,
        },
        parcels: [
          {
            length: "32",
            width: "24",
            height: "8",
            distance_unit: "cm",
            weight,
            mass_unit: "kg",
          },
        ],
        async: false,
      });
      const key = `${placeKey(address)}|${pieces}`;
      const offered = [];
      for (const rate of shipment.rates || []) {
        const amount = Number(rate.amount);
        if (!rate.object_id || !Number.isFinite(amount) || amount <= 0) continue;
        const perCedi = await cedisRate(rate.currency);
        const cedis = Math.ceil(amount * perCedi * 100) / 100;
        const saved = {
          id: rate.object_id,
          carrier: clean(rate.provider, 40),
          service: clean(rate.servicelevel?.name || rate.servicelevel?.token, 60),
          days: Number.isFinite(Number(rate.estimated_days)) ? Number(rate.estimated_days) : null,
          cedis,
          pieces,
          place: key,
          expires: Date.now() + 20 * 60 * 1000,
        };
        quotes.set(saved.id, saved);
        offered.push(saved);
      }
      offered.sort((a, b) => a.cedis - b.cedis);
      return offered.slice(0, 8).map(({ id, carrier, service, days, cedis }) => ({
        id,
        carrier,
        service,
        days,
        cedis,
      }));
    },
    quoted(id, address, pieces) {
      const found = quotes.get(String(id || ""));
      if (!found || found.expires <= Date.now()) return null;
      const code = countryCode(address?.country);
      const key = `${placeKey({
        country: code,
        state: address?.state,
        city: address?.city,
        zip: address?.zip,
        street: address?.street,
      })}|${pieces}`;
      if (found.place !== key) return null;
      return {
        rateId: found.id,
        carrier: found.carrier,
        service: found.service,
        days: found.days,
        cedis: found.cedis,
      };
    },
    async buy(rateId) {
      const data = await shippo("/transactions", {
        rate: rateId,
        label_file_type: "PDF",
        async: false,
      });
      if (data.status === "ERROR") {
        const message = data.messages?.[0]?.text || "The delivery label could not be bought.";
        throw new HttpError(502, clean(message, 180));
      }
      return {
        status: data.status === "SUCCESS" ? "bought" : "pending",
        trackingNumber: clean(data.tracking_number, 80),
        trackingUrl: httpsUrl(data.tracking_url_provider),
        labelUrl: httpsUrl(data.label_url),
      };
    },
  };
}
