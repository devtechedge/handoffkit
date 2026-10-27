import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>Client-ready handover packs for automation agencies.</p>
        </div>
        <div className="footer-links">
          <div>
            <p className="footer-heading">Product</p>
            <a href="/demo">Live demo</a>
            <a href="/pricing">Pricing</a>
            <a href="/login">Sign in</a>
            <a href="/signup">Start free</a>
          </div>
          <div>
            <p className="footer-heading">Company</p>
            <a href="/contact">Contact</a>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/refunds">Refunds</a>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} HandoffKit</span>
        <span>Built in Mumbai for agencies everywhere.</span>
      </div>
    </footer>
  );
}
