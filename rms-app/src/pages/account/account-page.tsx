import { Account } from "../../features/account/account";

export function AccountPage() {
  return (
    <section className="section account-page">
      <div className="page-intro">
        <span className="eyebrow">YOUR RMS</span>
        <h1>Your account</h1>
        <p>Saved pieces, orders, and the details that belong to you.</p>
      </div>
      <Account />
    </section>
  );
}
