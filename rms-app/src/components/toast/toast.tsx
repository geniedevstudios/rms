import { Check } from "lucide-react";
import { useToast } from "./toast.context";
import "./toast.styles.css";

export function Toast() {
  const { message } = useToast();
  return message ? (
    <div role="status" className="toast">
      <Check size={15} />
      {message}
    </div>
  ) : null;
}
