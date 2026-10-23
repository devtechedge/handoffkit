import { accountPlan, type Account } from "@/lib/auth";
import { planLabel } from "@/lib/format";
import { Logo } from "./Logo";
import { LogoutButton } from "./LogoutButton";

export function AppHeader({ account }: { account: Account }) {
  const plan = accountPlan(account);
  return (
    <header className="site-header app-header">
      <div className="container header-inner">
        <Logo />
        <nav className="nav app-nav" aria-label="App">
          <a href="/app">Packs</a>
          <a href="/app/new">New pack</a>
          <a href="/app/settings">Settings</a>
        </nav>
        <div className="header-actions">
          <span className="account-chip">
            <span className="account-name">{account.agency_name}</span>
            <span className={`badge badge-${plan}`}>{planLabel(plan)}</span>
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
