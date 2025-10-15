
import { useState } from "react";

function App() {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!symptoms.trim()) {
      setError("Please enter some symptoms before analyzing.");
      return;
    }

    setIsLoading(true);
    setResult("");
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/analyze_symptoms/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "An unknown server error occurred." }));
        throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.analysis);

    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to get a response from the server. Is it running?");
    } finally {
      setIsLoading(false);
    }
  };

  // Improved formatting component
  const FormattedResult = ({ text }) => {
    const sections = text.split("###").filter(Boolean);

    return (
      <div className="space-y-6">
        {sections.map((section, idx) => {
          const [headingLine, ...contentLines] = section.trim().split("\n").filter(Boolean);
          const heading = headingLine.replace(/:/, "").trim();
          const content = contentLines.join("\n").trim();
          const listItems = content.split(/\n\d+\. |\n\* /).filter(Boolean);

          return (
            <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              {heading && <h3 className="text-lg font-semibold text-gray-800 mb-2">{heading}</h3>}
              {listItems.length > 1 ? (
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                  {listItems.map((item, index) => (
                    <li key={index} className="mb-1">{item}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-gray-700 whitespace-pre-line">{content}</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center font-sans px-4">
      <div className="p-8 max-w-2xl mx-auto bg-white rounded-xl shadow-lg w-full">
        <div className="flex items-center space-x-4 mb-6">
          <div className="text-4xl">🩺</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Healthcare Symptom Checker</h1>
            <p className="text-gray-500">Enter your symptoms to get potential insights.</p>
          </div>
        </div>

        <div className="mb-4">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            rows="5"
            placeholder="For example: 'I have a sore throat, a fever of 101°F, and a persistent cough...'"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <button
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:bg-blue-300 disabled:cursor-not-allowed"
          onClick={analyze}
          disabled={isLoading || !symptoms.trim()}
        >
          {isLoading ? "Analyzing..." : "Analyze Symptoms"}
        </button>

        {error && (
          <div className="mt-6 p-4 border-l-4 border-red-500 bg-red-100 text-red-800 rounded-r-lg" role="alert">
            <h2 className="font-bold">Error</h2>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Analysis Results:</h2>
            <FormattedResult text={result} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
