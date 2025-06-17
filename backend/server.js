const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });
const apiKey = process.env.API_KEY || 'AIzaSyB6OR20OI_yHyGvt7YF1gJyluD-AsRtho8';
const cseApiKey = process.env.CSE_API_KEY || 'AIzaSyCECLQFakMf6-sPWTtoS341VL536ck7LS4';
const cseId = process.env.CSE_ID || 'c6f44c0a865334347';

app.use(cors());
app.use(express.json());

app.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    const imageData = fs.readFileSync(req.file.path, 'base64');
    const mode = req.body.mode || 'products';

    if (mode === 'images') {
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          requests: [
            {
              image: { content: imageData },
              features: [{ type: 'WEB_DETECTION', maxResults: 10 }],
            },
          ],
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      const webDetection = response.data.responses[0].webDetection;
      const similarImages = webDetection.webEntities
        .filter(entity => entity.score > 0.5)
        .map(entity => ({
          title: entity.description,
          image: entity.image?.url || 'https://via.placeholder.com/150',
          link: entity.webEntityId || '#',
        }));

      fs.unlinkSync(req.file.path);
      res.json({ images: similarImages });
    } else {
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

        // เพิ่มเปอร์เซ็นต์การค้นหาด้วย Google Vision API (สมมติจากความน่าเชื่อถือของ label)
        const visionConfidence = (label.score * 100).toFixed(2);

        return {
          name,
          confidence,
          similar,
          compatible,
          similarItems,
          visionConfidence,
        };
      }));

      fs.unlinkSync(req.file.path);
      res.json({ labels: enhancedResults });
    }
  } catch (error) {
    console.error('Error analyzing image:', error.response ? error.response.data : error.message);
    fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to analyze image. Check server logs for details.' });
  }
});

// ฟังก์ชันค้นหาสินค้าที่คล้ายกัน (ปรับปรุงให้ได้ลิงก์หน้าการขาย)
async function searchSimilarItems(itemName) {
  try {
    let allItems = [];
    let start = 1;
    const maxResults = 50; // ลดจาก 100 เป็น 50 ตามคำขอ

    while (allItems.length < maxResults && start <= 100) {
      const response = await axios.get(
        `https://customsearch.googleapis.com/customsearch/v1?key=${cseApiKey}&cx=${cseId}&q=${encodeURIComponent(itemName)}&searchType=image&num=10&start=${start}`
      );
      if (response.data.error) {
        throw new Error(`API Error: ${response.data.error.message || 'Unknown error'}`);
      }
      const items = response.data.items || [];
      if (items.length === 0) break;
      allItems = allItems.concat(items.map(item => {
        let productLink = item.link;
        if (item.pagemap?.product && item.pagemap.product.length > 0) {
          productLink = item.pagemap.product[0].url || item.link;
        } else if (!/product|shop|item/i.test(item.link)) {
          productLink = '#';
        }
        return {
          title: item.title,
          image: item.pagemap?.cse_image?.[0]?.src || item.image?.thumbnailLink || 'https://via.placeholder.com/150',
          link: productLink,
        };
      }).filter(item => item.image));
      start += 10;
    }

    return allItems.slice(0, maxResults);
  } catch (error) {
    console.error('Search error:', error.message, error.response ? error.response.data : '');
    return [{ title: `Error: ${error.message}`, image: 'https://via.placeholder.com/150', link: '#' }];
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));