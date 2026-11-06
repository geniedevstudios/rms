import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Customer = {
  email: string;
  givenName: string;
  familyName: string;
};

type AccountContextValue = {
  customer: Customer | null;
  ready: boolean;
  signup: (body: {
    givenName: string;
    familyName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  verify: (email: string, code: string) => Promise<void>;
  resend: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);

async function accountRequest(path: string, body?: unknown) {
  const response = await fetch(`/api/cms/account${path}`, {
    method: body === undefined && path === "" ? "GET" : "POST",
    headers: body === undefined && path === "" ? undefined : { "Content-Type": "application/json" },
    body: body === undefined && path === "" ? undefined : JSON.stringify(body ?? {}),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || "Please try again.") as Error & { verify?: boolean };
    error.verify = Boolean(data.verify);
    throw error;
  }
  return data;
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stop = false;
    accountRequest("")
      .then((data) => {
        if (!stop) setCustomer(data.customer);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!stop) setReady(true);
      });
    return () => {
      stop = true;
    };
  }, []);

  const value: AccountContextValue = {
    customer,
    ready,
    signup: async (body) => {
      await accountRequest("/signup", body);
    },
    login: async (email, password) => {
      const data = await accountRequest("/login", { email, password });
      setCustomer(data.customer);
    },
    verify: async (email, code) => {
      const data = await accountRequest("/verify", { email, code });
      setCustomer(data.customer);
    },
    resend: async (email) => {
      await accountRequest("/code", { email });
    },
    logout: async () => {
      await accountRequest("/logout", {});
      setCustomer(null);
    },
  };

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) throw new Error("useAccount must be used inside AccountProvider");
  return context;
}
