const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });
const apiKey = process.env.API_KEY || 'AIzaSyB6OR20OI_yHyGvt7YF1gJyluD-AsRtho8';

app.use(cors());
app.use(express.json());

app.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    const imageData = fs.readFileSync(req.file.path, 'base64');
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        requests: [
          {
            image: { content: imageData },
            features: [{ type: 'LABEL_DETECTION', maxResults: 10 }],
          },
        ],
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    const labels = response.data.responses[0].labelAnnotations;

    const enhancedResults = await Promise.all(labels.map(async (label) => {
      const name = label.description;
      const confidence = (label.score * 100).toFixed(2) + '%';
      const similar = `Similar to ${name}`;
      const compatible = ['table', 'lamp'].includes(name.toLowerCase()) ? ['chair'] : [];

      const similarItems = await searchSimilarItems(name);

      return {
        name,
        confidence,
        similar,
        compatible,
        similarItems,
      };
    }));

    fs.unlinkSync(req.file.path);
    res.json({ labels: enhancedResults });
  } catch (error) {
    console.error('Error analyzing image:', error.response ? error.response.data : error.message);
    fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to analyze image. Check server logs for details.' });
  }
});

// ฟังก์ชันค้นหาสินค้าที่คล้ายกันด้วย Custom Search API
async function searchSimilarItems(itemName) {
  try {
    const cseApiKey = process.env.CSE_API_KEY || 'AIzaSyCECLQFakMf6-sPWTtoS341VL536ck7LS4';
    const cseId = process.env.CSE_ID || 'c6f44c0a865334347';
    console.log(`Searching for: ${itemName}, CSE API Key: ${cseApiKey}, CSE ID: ${cseId}, Environment Loaded: ${!!process.env.CSE_API_KEY}`);
    const response = await axios.get(
      `https://customsearch.googleapis.com/customsearch/v1?key=${cseApiKey}&cx=${cseId}&q=${encodeURIComponent(itemName)}&searchType=image&num=10`
    );
    if (response.data.error) {
      throw new Error(`API Error: ${response.data.error.message || 'Unknown error'}`);
    }
    return response.data.items.map(item => ({
      title: item.title,
      image: item.pagemap?.cse_image?.[0]?.src || item.image?.thumbnailLink || 'https://via.placeholder.com/150',
      link: item.link,
    })).filter(item => item.image); // กรอง item ที่ไม่มีภาพ
  } catch (error) {
    console.error('Search error:', error.message, error.response ? error.response.data : '');
    return [{ title: `Error: ${error.message}`, image: 'https://via.placeholder.com/150', link: '#' }];
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));