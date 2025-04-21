const express = require('express')
const app = express()

app.use(express.static('public'));

app.get('/', (req, res) => {
  //res.send()
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`listening on port ${port}`)
});


const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app2 = express();
app2.use(cors());

app2.get('/search', async (req, res) => {
  const query = req.query.query + ' food';
  const searchUrl = `https://www.flaticon.com/search?word=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(searchUrl, {
      headers: {
        // Optional: helps bypass some basic scraping blocks
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const $ = cheerio.load(response.data);
    const firstIcon = $('li.icon--item').first();

    if (firstIcon.length > 0) {
      const iconUrl = firstIcon.attr('data-png');
      res.json({ icon_url: iconUrl });
    } else {
      res.json({ icon_url: 'No icon found.' });
    }
  } catch (error) {
    console.error('Error scraping Flaticon:', error.message);
    res.status(500).json({ error: 'Failed to fetch icon' });
  }
});

const port2 = 5000;

app2.listen(port2, () => {
  console.log(`Proxy server running on port ${port2}`);
});