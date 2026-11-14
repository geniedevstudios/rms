import { useState, useEffect } from "react";
export function useRoute() {
  const [route, setRoute] = useState(window.location.hash.slice(1) || "/");
  useEffect(() => {
    const update = () => {
      const hash = window.location.hash.slice(1);
      if (!hash || hash.startsWith("/")) setRoute(hash || "/");
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return route;
}
