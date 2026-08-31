const PolicyLayout = ({ title, lastUpdated, children }) => {
  return (
    <div className="min-h-screen bg-black pt-20">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-sm text-gray-400">
            Last updated: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-black border border-gray-800 rounded-xl p-6 md:p-10 space-y-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PolicyLayout;
