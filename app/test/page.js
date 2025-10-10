'use client'

import { useState } from 'react';
import Navbar from './Navbar';

export default function TestPage() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [conversionResult, setConversionResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [dbReviews, setDbReviews] = useState([]);
  const [loadingDbReviews, setLoadingDbReviews] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setConversionResult(null);
    setAnalysisResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Please select a file');
      return;
    }

    setProcessing(true);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Step 1: Upload file
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();
      
      if (!uploadResponse.ok) {
        alert('Upload failed: ' + uploadData.error);
        return;
      }

      // Step 2: Convert file
      const convertResponse = await fetch('/api/covert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: uploadData.filename }),
      });

      const convertData = await convertResponse.json();

      if (convertResponse.ok) {
        setConversionResult(convertData);
        alert('File uploaded and converted successfully!');
        setFile(null);
      } else {
        alert('Conversion failed: ' + convertData.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!conversionResult) {
      alert('No converted file to analyze');
      return;
    }

    setAnalyzing(true);

    try {
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ textFilename: conversionResult.textFilename }),
      });

      const analyzeData = await analyzeResponse.json();

      if (analyzeResponse.ok) {
        setAnalysisResult(analyzeData);
        alert('Analysis completed successfully!');
      } else {
        alert('Analysis failed: ' + analyzeData.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // Note: Manual review pushing removed - reviews are now automatically pushed during analysis

  const loadDbReviews = async () => {
    setLoadingDbReviews(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok) {
        setDbReviews(data.reviews);
      } else {
        alert('Failed to load database reviews: ' + data.error);
      }
    } catch (error) {
      alert('Error loading database reviews: ' + error.message);
    } finally {
      setLoadingDbReviews(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ padding: '50px', maxWidth: '600px', margin: '0 auto', paddingTop: '140px' }}>
        <h1>Testing Dashboard</h1>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <input 
            type="file" 
            accept=".pdf,.txt,.md,.docx,.doc,.odt,.rtf,.epub"
            onChange={handleFileChange}
            style={{ display: 'block', marginBottom: '10px' }}
          />
          {file && <p>Selected: {file.name}</p>}
        </div>
        
        <button 
          type="submit" 
          disabled={processing}
          style={{
            padding: '10px 20px',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: processing ? 'not-allowed' : 'pointer'
          }}
        >
          {processing ? 'Processing...' : 'Upload & Convert'}
        </button>
      </form>

      {conversionResult && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#e8f5e9', borderRadius: '5px' }}>
          <h3>Conversion Result</h3>
          <p><strong>Text file:</strong> {conversionResult.textFilename}</p>
          <p><strong>Length:</strong> {conversionResult.length} characters</p>
          <div style={{ 
            marginTop: '10px', 
            padding: '10px', 
            background: 'white', 
            border: '1px solid #ccc',
            borderRadius: '3px',
            maxHeight: '300px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            fontSize: '14px'
          }}>
            {conversionResult.plaintext}
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={analyzing}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: analyzing ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {analyzing ? 'Analyzing with AI...' : 'Analyze with OpenAI'}
          </button>
        </div>
      )}

      {analysisResult && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#e3f2fd', borderRadius: '5px' }}>
          <h3>AI Analysis Result</h3>
          <p><strong>Review file:</strong> {analysisResult.reviewFilename}</p>
          <p><strong>Tokens used:</strong> {analysisResult.tokensUsed}</p>
          
          <div style={{ 
            marginTop: '15px', 
            padding: '15px', 
            background: 'white', 
            border: '1px solid #ccc',
            borderRadius: '3px',
            maxHeight: '500px',
            overflow: 'auto'
          }}>
            <h4 style={{ marginTop: 0 }}>Title: {analysisResult.analysis.title}</h4>
            
            <div style={{ marginBottom: '15px' }}>
              <h5>Originality Review</h5>
              <p><strong>Score:</strong> {analysisResult.analysis.originality_review.originality_score}</p>
              <p><strong>Rationale:</strong> {analysisResult.analysis.originality_review.rationale}</p>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <h5>Clarity Review</h5>
              <p><strong>Score:</strong> {analysisResult.analysis.clarity_review.clarity_score}</p>
              <p><strong>Rationale:</strong> {analysisResult.analysis.clarity_review.rationale}</p>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <h5>Rigor & Reproducibility</h5>
              <p><strong>Rigor Score:</strong> {analysisResult.analysis.rigor_reproducibility_review.rigor_score}</p>
              <p><strong>Reproducibility Score:</strong> {analysisResult.analysis.rigor_reproducibility_review.reproducibility_score}</p>
              <p><strong>Rationale:</strong> {analysisResult.analysis.rigor_reproducibility_review.rationale}</p>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <h5>Data Transparency</h5>
              <p><strong>Score:</strong> {analysisResult.analysis.data_transparency_review.data_transparency_score}</p>
              <p><strong>Rationale:</strong> {analysisResult.analysis.data_transparency_review.rationale}</p>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <h5>Interpretation & Ethics</h5>
              <p><strong>Score:</strong> {analysisResult.analysis.interpretation_ethics_review.interpretation_congruence_score}</p>
              <p><strong>Conflict of Interest:</strong> {analysisResult.analysis.interpretation_ethics_review.conflict_of_interest ? 'Yes' : 'No'}</p>
              <p><strong>Rationale:</strong> {analysisResult.analysis.interpretation_ethics_review.rationale}</p>
            </div>

            <details style={{ marginTop: '20px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>View Full JSON</summary>
              <pre style={{ 
                marginTop: '10px', 
                padding: '10px', 
                background: '#f5f5f5', 
                borderRadius: '3px',
                fontSize: '12px',
                overflow: 'auto'
              }}>
                {JSON.stringify(analysisResult.analysis, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      <div style={{ marginTop: '40px', padding: '20px', background: '#e8f5e9', borderRadius: '5px', borderTop: '3px solid #4caf50' }}>
        <h3>✅ Automatic Database Sync</h3>
        <p style={{ fontSize: '14px', color: '#2e7d32' }}>
          Reviews are now automatically pushed to the database during analysis. 
          All files are stored in Supabase Storage for scalability and Vercel compatibility.
        </p>
        <p style={{ fontSize: '14px', color: '#2e7d32', marginTop: '10px' }}>
          <strong>Storage Architecture:</strong>
        </p>
        <ul style={{ fontSize: '14px', color: '#2e7d32', marginLeft: '20px' }}>
          <li>Uploaded files → Supabase Storage (uploads bucket)</li>
          <li>Converted text files → Supabase Storage (temporary)</li>
          <li>Reviews → Supabase Database only</li>
          <li>Text files auto-deleted after successful analysis</li>
        </ul>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: '#e8f4f8', borderRadius: '5px', borderTop: '3px solid #0070f3' }}>
        <h3>Database Reviews</h3>
        <p style={{ fontSize: '14px', color: '#333', marginBottom: '15px' }}>
          View all reviews stored in your Supabase database.
        </p>
        
        <button 
          onClick={loadDbReviews}
          disabled={loadingDbReviews}
          style={{
            padding: '10px 20px',
            background: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: loadingDbReviews ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}
        >
          {loadingDbReviews ? 'Loading...' : 'Load Database Reviews'}
        </button>

        {dbReviews.length > 0 && (
          <div style={{ marginTop: '15px', overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              background: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderRadius: '5px',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{ background: '#0070f3', color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Created At</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Title</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Paper ID</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dbReviews.map((review, index) => (
                  <tr 
                    key={review.id}
                    style={{
                      borderBottom: index < dbReviews.length - 1 ? '1px solid #e0e0e0' : 'none',
                      background: index % 2 === 0 ? '#f9f9f9' : 'white'
                    }}
                  >
                    <td style={{ padding: '12px', fontSize: '13px' }}>{review.id}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      {new Date(review.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: '500' }}>
                      {review.title || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', fontFamily: 'monospace', color: '#666' }}>
                      {review.paper_id}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <a
                        href={`/review/${review.id}`}
                        style={{
                          display: 'inline-block',
                          padding: '6px 16px',
                          background: '#0070f3',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '5px',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#0051cc'}
                        onMouseOut={(e) => e.target.style.background = '#0070f3'}
                      >
                        View Report
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}>
              Total reviews: {dbReviews.length}
            </p>
          </div>
        )}

        {dbReviews.length === 0 && !loadingDbReviews && (
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            Click "Load Database Reviews" to see reviews from Supabase.
          </p>
        )}
      </div>
    </div>
    </>
  );
}
