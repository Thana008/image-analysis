import { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    if (selectedFile) {
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post('http://localhost:5000/analyze-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResults(response.data.labels);
    } catch (error) {
      console.error('Error analyzing image:', error);
      setResults({ error: 'Failed to analyze image. Check server logs for details.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-lg p-4" style={{ borderRadius: '15px', border: '1px solid #3498db' }}>
        <h1 className="text-center mb-4" style={{ color: '#2c3e50', fontFamily: 'Arial, sans-serif' }}>Image Analysis</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="form-control form-control-lg"
              style={{ borderColor: '#3498db', transition: 'border-color 0.3s' }}
              onFocus={(e) => (e.target.style.borderColor = '#2980b9')}
              onBlur={(e) => (e.target.style.borderColor = '#3498db')}
            />
          </div>
          {imagePreview && (
            <div className="mb-4 text-center">
              <img
                src={imagePreview}
                alt="Preview"
                className="img-thumbnail"
                style={{ maxWidth: '300px', border: '2px solid #3498db', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
              />
            </div>
          )}
          <div className="text-center">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={!file || loading}
              style={{ backgroundColor: '#3498db', border: 'none', padding: '12px 40px', transition: 'transform 0.2s' }}
              onMouseOver={(e) => (e.target.style.transform = 'scale(1.05)')}
              onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                'Analyze Image'
              )}
            </button>
          </div>
        </form>
        {results && (
          <div className="mt-5">
            <h2 className="text-center mb-4" style={{ color: '#2c3e50', fontFamily: 'Arial, sans-serif' }}>Results</h2>
            {results.error ? (
              <div className="alert alert-danger text-center" role="alert">
                {results.error}
              </div>
            ) : (
              <div className="list-group">
                {results.map((item, index) => (
                  <div key={index} className="list-group-item mb-3 p-4 shadow-sm" style={{ borderRadius: '10px', borderLeft: '5px solid #3498db' }}>
                    <h5 className="mb-2" style={{ color: '#2c3e50' }}>
                      {item.name} <span className="badge bg-info text-white">Confidence: {item.confidence}</span>
                    </h5>
                    <p className="mb-1"><strong>Similar:</strong> {item.similar}</p>
                    <p className="mb-1"><strong>Compatible:</strong> {item.compatible.join(', ') || 'None'}</p>
                    <p className="mb-2"><strong>Similar Items:</strong></p>
                    <div className="d-flex flex-wrap justify-content-center">
                      {item.similarItems.map((similarItem, i) => (
                        <a
                          key={i}
                          href={similarItem.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="card m-2"
                          style={{ width: '150px', textDecoration: 'none', color: '#333', transition: 'transform 0.2s' }}
                          onMouseOver={(e) => (e.target.style.transform = 'scale(1.05)')}
                          onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
                        >
                          <img
                            src={similarItem.image}
                            alt={similarItem.title}
                            className="card-img-top"
                            style={{ height: '100px', objectFit: 'cover', borderRadius: '5px' }}
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; e.target.alt = 'Image not available'; }}
                          />
                          <div className="card-body p-2">
                            <p className="card-text text-center" style={{ fontSize: '0.9rem' }}>{similarItem.title}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;