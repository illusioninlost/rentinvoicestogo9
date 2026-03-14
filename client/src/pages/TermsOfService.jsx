import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <Link to="/" className="legal-brand">RentInvoicesToGo</Link>
      </div>
      <div className="legal-content">
        <h1>Terms of Service</h1>
        <p className="legal-date">Effective date: March 13, 2026</p>

        <p>These Terms of Service ("Terms") govern your use of RentInvoicesToGo ("Service"), operated by RentInvoicesToGo ("we", "us"). By creating an account, you agree to these Terms.</p>

        <h2>1. Description of Service</h2>
        <p>RentInvoicesToGo is invoicing software for residential landlords and property managers. It allows you to create, manage, and send rental invoices to tenants. The Service is not a payment processor, legal advisor, tax advisor, or accounting firm. We are not responsible for the accuracy of invoices you create or any legal or financial consequences arising from their use.</p>

        <h2>2. Account Registration</h2>
        <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your password and for all activity under your account. Notify us immediately at itsoveragainagain@gmail.com if you suspect unauthorized access.</p>

        <h2>3. Subscription Plans</h2>
        <p><strong>Free Plan:</strong> Allows up to 3 tenants and 5 invoices at no charge.</p>
        <p><strong>Pro Plan:</strong> $10/month (billed monthly). Includes unlimited tenants and invoices. You may cancel at any time through the Manage Subscription portal. Cancellation takes effect at the end of the current billing period. We do not offer partial-month refunds.</p>
        <p>We reserve the right to change pricing with 30 days' notice to your registered email address.</p>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to use the Service to:</p>
        <ul>
          <li>Violate any applicable law or regulation</li>
          <li>Send unsolicited or misleading communications to tenants</li>
          <li>Impersonate any person or entity</li>
          <li>Attempt to gain unauthorized access to the Service or its infrastructure</li>
          <li>Resell or sublicense the Service without written permission</li>
        </ul>

        <h2>5. Your Data</h2>
        <p>You retain ownership of all data you enter into the Service, including invoice information and tenant details. You grant us a limited license to store and process that data solely to provide the Service to you. We do not sell your data to third parties.</p>

        <h2>6. Termination</h2>
        <p>You may delete your account at any time by contacting itsoveragainagain@gmail.com. We may suspend or terminate your account for violation of these Terms, with or without notice. Upon termination, your data may be deleted after a reasonable retention period.</p>

        <h2>7. Disclaimer of Warranties</h2>
        <p>The Service is provided "as is" without warranties of any kind, express or implied. We do not warrant that the Service will be error-free, uninterrupted, or meet your specific requirements.</p>

        <h2>8. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, RentInvoicesToGo shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including loss of data or revenue, even if we have been advised of the possibility of such damages. Our total liability to you shall not exceed the amount you paid us in the 12 months preceding the claim.</p>

        <h2>9. Governing Law</h2>
        <p>These Terms are governed by the laws of the United States. Any disputes shall be resolved in a court of competent jurisdiction.</p>

        <h2>10. Changes to These Terms</h2>
        <p>We may update these Terms from time to time. We will notify you by email at least 14 days before material changes take effect. Continued use of the Service after that date constitutes acceptance of the updated Terms.</p>

        <h2>11. Contact</h2>
        <p>Questions about these Terms? Contact us at <a href="mailto:itsoveragainagain@gmail.com">itsoveragainagain@gmail.com</a>.</p>
      </div>
      <div className="legal-footer">
        <Link to="/privacy">Privacy Policy</Link>
        <span>·</span>
        <Link to="/login">Sign in</Link>
      </div>
    </div>
  );
}
