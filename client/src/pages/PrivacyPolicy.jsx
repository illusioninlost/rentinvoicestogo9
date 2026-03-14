import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <Link to="/" className="legal-brand">RentInvoicesToGo</Link>
      </div>
      <div className="legal-content">
        <h1>Privacy Policy</h1>
        <p className="legal-date">Effective date: March 13, 2026</p>

        <p>This Privacy Policy explains how RentInvoicesToGo ("we", "us") collects, uses, and protects information when you use our Service at rentinvoicestogo.com.</p>

        <h2>1. Information We Collect</h2>
        <p><strong>Account information:</strong> Your name, email address, and optional phone number when you sign up.</p>
        <p><strong>Invoice and tenant data:</strong> Property addresses, tenant names, addresses, phone numbers, emails, and invoice details that you enter into the Service.</p>
        <p><strong>Billing information:</strong> Payment is processed by Stripe. We store your Stripe customer ID but never see or store your card details.</p>
        <p><strong>Usage data:</strong> Basic server logs (IP address, request timestamps) for security and debugging purposes.</p>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To provide and operate the Service</li>
          <li>To send invoices to tenants on your behalf when you request it</li>
          <li>To process subscription payments via Stripe</li>
          <li>To send account-related emails (password resets, billing notices)</li>
          <li>To diagnose errors and maintain service reliability</li>
        </ul>
        <p>We do not sell your personal information to third parties.</p>

        <h2>3. Third-Party Services</h2>
        <p>We share data with the following providers solely to operate the Service:</p>
        <ul>
          <li><strong>Stripe</strong> — payment processing (stripe.com/privacy)</li>
          <li><strong>Supabase</strong> — database hosting (supabase.com/privacy)</li>
          <li><strong>Render</strong> — backend server hosting (render.com/privacy)</li>
          <li><strong>Vercel</strong> — frontend hosting (vercel.com/legal/privacy-policy)</li>
          <li><strong>Google Fonts</strong> — font delivery (fonts.google.com)</li>
        </ul>

        <h2>4. Tenant Data</h2>
        <p>When you send an invoice email to a tenant, their email address is used solely to deliver that invoice. We do not market to your tenants or share their data with anyone other than the infrastructure providers listed above.</p>

        <h2>5. Data Retention</h2>
        <p>We retain your account data and invoices for as long as your account is active. If you request account deletion, we will remove your data within 30 days, except where retention is required by law.</p>

        <h2>6. Your Rights</h2>
        <p>Depending on your location, you may have rights including:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of the data we hold about you</li>
          <li><strong>Correction:</strong> Request correction of inaccurate data</li>
          <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
          <li><strong>Portability:</strong> Request your invoice data in a portable format</li>
        </ul>
        <p>To exercise any of these rights, email us at <a href="mailto:itsoveragainagain@gmail.com">itsoveragainagain@gmail.com</a>. We will respond within 30 days.</p>

        <h2>7. Security</h2>
        <p>We use industry-standard measures to protect your data, including encrypted connections (HTTPS), hashed passwords, and access-controlled database storage. No system is completely secure; please use a strong, unique password for your account.</p>

        <h2>8. Cookies</h2>
        <p>We do not use tracking cookies. Session authentication is handled via a token stored in your browser's session storage, which is cleared when you close your browser tab.</p>

        <h2>9. Children's Privacy</h2>
        <p>The Service is not directed at children under 13. We do not knowingly collect personal information from children.</p>

        <h2>10. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you by email before material changes take effect. Continued use of the Service after that date constitutes acceptance of the updated policy.</p>

        <h2>11. Contact</h2>
        <p>Privacy questions or data requests: <a href="mailto:itsoveragainagain@gmail.com">itsoveragainagain@gmail.com</a>.</p>
      </div>
      <div className="legal-footer">
        <Link to="/tos">Terms of Service</Link>
        <span>·</span>
        <Link to="/login">Sign in</Link>
      </div>
    </div>
  );
}
