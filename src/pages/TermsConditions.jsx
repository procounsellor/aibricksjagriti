import PolicyLayout from "../components/PolicyLayout";

const TermsConditions = () => {
  return (
    <PolicyLayout title="Terms & Conditions" lastUpdated="December 2025">
      <section>
        <h2 className="text-xl font-semibold text-white mb-3">
          Acceptance of Terms
        </h2>
        <p className="text-gray-300 leading-relaxed">
          By accessing or using devvo.in, you agree to these terms.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-3">
          Use of Website
        </h2>
        <ul className="list-disc pl-6 text-gray-300 space-y-2">
          <li>You must use the website for lawful purposes only</li>
          <li>Unauthorized use is prohibited</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-3">
          Intellectual Property
        </h2>
        <p className="text-gray-300 leading-relaxed">
          All content and design elements belong to Devvo.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-3">
          Limitation of Liability
        </h2>
        <p className="text-gray-300 leading-relaxed">
          Devvo is not liable for damages arising from website usage.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-3">Governing Law</h2>
        <p className="text-gray-300">
          These terms are governed by the laws of India.
        </p>
      </section>
    </PolicyLayout>
  );
};

export default TermsConditions;
