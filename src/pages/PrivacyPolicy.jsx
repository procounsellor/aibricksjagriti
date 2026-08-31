import PolicyLayout from "../components/PolicyLayout";

const PrivacyPolicy = () => {
  return (
    <PolicyLayout title="Privacy Policy" lastUpdated="December 2025">
      <section>
        <h2 className="text-xl font-semibold text-white mb-3">Introduction</h2>
        <p className="text-gray-300 leading-relaxed">
          At Devvo (devvo.in), we respect your privacy and are committed to
          protecting your personal information.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-3">
          Information We Collect
        </h2>
        <ul className="list-disc pl-6 text-gray-300 space-y-2">
          <li>Personal details such as name, email, and phone number</li>
          <li>Technical data including IP address and browser information</li>
          <li>Usage data collected through cookies and analytics tools</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-3">
          How We Use Your Information
        </h2>
        <p className="text-gray-300 leading-relaxed">
          We use your information to provide services, respond to inquiries, and
          improve our website.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-3">Data Security</h2>
        <p className="text-gray-300 leading-relaxed">
          We implement appropriate security measures to protect your data.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-3">Contact Us</h2>
        <p className="text-gray-300">
          Email us at{" "}
          <span className="text-white font-medium">contact@devvo.in</span>
        </p>
      </section>
    </PolicyLayout>
  );
};

export default PrivacyPolicy;
