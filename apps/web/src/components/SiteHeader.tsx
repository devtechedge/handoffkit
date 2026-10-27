import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <nav className="nav" aria-label="Main">
          <a href="/#product">Product</a>
          <a href="/demo">Demo</a>
          <a href="/pricing">Pricing</a>
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          {signedIn ? (
            <a className="btn btn-primary btn-sm" href="/app">
              Open app
            </a>
          ) : (
            <>
              <a className="btn btn-ghost btn-sm" href="/login">
                Sign in
              </a>
              <a className="btn btn-primary btn-sm" href="/signup">
                Start free
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
