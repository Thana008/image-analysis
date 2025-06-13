import { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import Swal from 'sweetalert2';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());

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
    if (!file) {
      Swal.fire({
        icon: 'warning',
        title: 'No File Selected',
        text: 'Please choose an image to analyze!',
        confirmButtonColor: '#3498db',
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post('http://localhost:5000/analyze-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const enhancedResults = response.data.labels.map(item => ({
        ...item,
        similarItems: item.similarItems.map(si => ({
          ...si,
          confidence: si.confidence || (Math.random() * 0.8 + 0.1),
          price: `${(Math.random() * 20 + 10).toFixed(2)}-${(Math.random() * 30 + 20).toFixed(2)}`,
          orders: Math.floor(Math.random() * 10),
          rating: Math.random() * 5,
          special: Math.random() > 0.7 ? 'USE YOUR OWN COLORS & DESIGNS' : '',
        }))
      }));
      setResults(enhancedResults);
      setSelectedItems(new Set());
      Swal.fire({
        icon: 'success',
        title: 'Analysis Complete',
        text: 'Image has been analyzed successfully!',
        confirmButtonColor: '#3498db',
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      setResults({ error: 'Failed to analyze image. Check server logs for details.' });
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to analyze image. Please try again.',
        confirmButtonColor: '#e74c3c',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setFile(null);
    setResults(null);
    setImagePreview(null);
    setSelectedItems(new Set());
  };

  const handleItemSelect = (index) => {
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(index)) {
      newSelectedItems.delete(index);
    } else {
      newSelectedItems.add(index);
    }
    setSelectedItems(newSelectedItems);
  };

  const handleBatchSelect = () => {
    if (results && results[0]?.similarItems) {
      const allIndices = new Set(results[0].similarItems.map((_, i) => i));
      setSelectedItems(allIndices);
    }
  };

  const handleClear = () => {
    setSelectedItems(new Set());
  };

  const handleOpenAll = () => {
    if (results && results[0]?.similarItems) {
      results[0].similarItems.forEach((item, i) => {
        if (item.link && selectedItems.has(i)) {
          window.open(item.link, '_blank');
        }
      });
    }
  };

  const handleCardClick = (item, index) => {
    if (item.link) {
      window.open(item.link, '_blank');
    }
  };

  return (
    <div className="container-fluid p-0" style={{ background: 'linear-gradient(135deg, #1a1a1a, #2c2c2c)', color: '#ffffff', minHeight: '100vh' }}>
      <div className="p-4">
        <h2 className="text-center mb-4" style={{ color: '#3498db', fontFamily: 'Arial, sans-serif', textShadow: '0 0 10px rgba(52, 152, 219, 0.5)' }}>Image Search</h2>
        <div className="row g-0">
          {/* ฝั่งซ้าย: อัปโหลดและตัวกรอง */}
          <div className="col-md-4 p-3" style={{ backgroundColor: 'rgba(44, 44, 44, 0.9)', borderRadius: '10px', boxShadow: '0 0 15px rgba(0, 0, 0, 0.5)' }}>
            <p className="text-muted small mb-2">Upload an image to find similar items!</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="form-control form-control-lg mb-3"
              style={{ borderColor: '#3498db', backgroundColor: '#333333', color: '#ffffff', borderRadius: '8px' }}
            />
            {imagePreview && (
              <div className="text-center mb-3">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="img-thumbnail"
                  style={{ maxWidth: '200px', border: '3px solid #3498db', borderRadius: '10px', boxShadow: '0 0 10px rgba(52, 152, 219, 0.7)' }}
                />
              </div>
            )}
            <div className="d-flex justify-content-between mb-3 align-items-center">
              <button
                onClick={handleStartOver}
                className="btn btn-outline-secondary btn-sm"
                style={{ color: '#3498db', borderColor: '#3498db', borderRadius: '5px' }}
              >
                Start over
              </button>
              <div className="input-group w-50">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search in results"
                  style={{ backgroundColor: '#333333', color: '#ffffff', borderColor: '#3498db', borderRadius: '5px' }}
                />
              </div>
            </div>
            <div className="mb-3">
              <h6 style={{ color: '#3498db', fontWeight: 'bold' }}>Rating</h6>
              <div className="form-check mb-1">
                <input className="form-check-input" type="radio" name="rating" id="any" defaultChecked />
                <label className="form-check-label" htmlFor="any" style={{ color: '#ffffff' }}>Any</label>
              </div>
              <div className="form-check mb-1">
                <input className="form-check-input" type="radio" name="rating" id="high" />
                <label className="form-check-label" htmlFor="high" style={{ color: '#ffffff' }}>High</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="radio" name="rating" id="veryHigh" />
                <label className="form-check-label" htmlFor="veryHigh" style={{ color: '#ffffff' }}>Very High</label>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-primary btn-lg w-100"
              disabled={!file || loading}
              style={{ background: 'linear-gradient(90deg, #3498db, #ff6f61)', border: 'none', padding: '10px', fontSize: '1.1rem', borderRadius: '8px', transition: 'transform 0.3s' }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {loading ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : 'Analyze Image'}
            </button>
          </div>

          {/* ฝั่งขวา: แกลเลอรี่ผลลัพธ์ */}
          <div className="col-md-8 p-3">
            <div className="d-flex justify-content-between align-items-center mb-3 w-100" style={{ background: 'linear-gradient(90deg, #3498db, #2c3e50)', padding: '8px', borderRadius: '10px', boxShadow: '0 0 10px rgba(52, 152, 219, 0.5)' }}>
              <span style={{ fontWeight: 'bold' }}>{selectedItems.size} Selected</span>
              <span style={{ fontWeight: 'bold' }}>40 Results</span>
              <div>
                <select className="form-select form-select-sm me-2" style={{ backgroundColor: '#2c2c2c', color: '#ffffff', borderColor: '#3498db', borderRadius: '5px', width: '120px' }}>
                  <option>Relevancy</option>
                  <option>All Matches</option>
                </select>
                <button className="btn btn-sm btn-outline-light me-1" style={{ borderRadius: '5px' }} onClick={handleBatchSelect}>Batch Select</button>
                <button className="btn btn-sm btn-outline-light me-1" style={{ borderRadius: '5px' }} onClick={handleClear}>Clear</button>
                <button className="btn btn-sm btn-outline-light" style={{ borderRadius: '5px' }} onClick={handleOpenAll}>Open All</button>
              </div>
            </div>
            {results && !results.error && (
              <div className="row flex-wrap g-3">
                {results[0]?.similarItems.map((similarItem, i) => (
                  <div key={i} className="col-12 col-md-3">
                    <div
                      className="card h-100 card-hover"
                      style={{ borderRadius: '12px', backgroundColor: '#333333', border: selectedItems.has(i) ? '2px solid #3498db' : '1px solid #444444', transition: 'all 0.3s ease', cursor: similarItem.link ? 'pointer' : 'default' }}
                      onClick={() => handleCardClick(similarItem, i)}
                    >
                      <div className="card-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(i)}
                          onChange={() => handleItemSelect(i)}
                          style={{ margin: '5px' }}
                        />
                      </div>
                      <img
                        src={similarItem.image || `https://via.placeholder.com/150?text=Item+${i+1}`}
                        alt={similarItem.title}
                        className="card-img-top"
                        style={{ height: '180px', objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; e.target.alt = 'Image not available'; }}
                      />
                      <div className="card-body p-2 text-center" style={{ backgroundColor: '#2c2c2c', color: '#ffffff' }}>
                        <p className="card-text" style={{ fontSize: '0.95rem', marginBottom: '2px', fontWeight: '500' }}>{similarItem.title || `Item ${i + 1}`}</p>
                        <p className="card-text" style={{ fontSize: '0.9rem', marginBottom: '2px', color: '#ff6f61' }}><strong>${similarItem.price}</strong></p>
                        <p className="card-text" style={{ fontSize: '0.8rem', marginBottom: '2px', color: '#bdc3c7' }}>{similarItem.orders} Orders</p>
                        <div className="text-warning" style={{ fontSize: '0.85rem' }}>
                          {'★'.repeat(Math.floor(similarItem.rating)) + '☆'.repeat(5 - Math.floor(similarItem.rating))}
                        </div>
                        {similarItem.special && (
                          <p className="text-danger" style={{ fontSize: '0.8rem', marginTop: '2px', fontStyle: 'italic' }}>{similarItem.special}</p>
                        )}
                        <p className="text-info" style={{ fontSize: '0.7rem' }}>Match: {(similarItem.confidence * 100).toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;