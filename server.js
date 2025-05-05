const express = require('express')
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const app = express()

app.use(express.static('public'));
app.use(express.json());

const A_KEY = 

app.post('/fetchEndLife', async (req, res) => {
  const { foodItem, storageType, startLife } = req.body;

  // Eden AI setup
  const edenUrl = 'https://api.edenai.run/v2/workflow/1b63438f-dfc7-4187-9473-d12de23ba7b4/execution/';
  const headers = {
    'Authorization': `Bearer ${process.env.EDEN_AI_AUTHORIZATION_KEY}`,
    'Content-Type': 'application/json'
  };

  const payload = {
    prompt: `Answer by only stating a number + "days", "weeks","months", "years" or if it is not a food item state exactly the word "invalid". Let say I have ${foodItem} that is kept in ${storageType} and was fresh since the unix time in seconds: ${startLife}. When can I expect it to expire?`
  };

  try {
    // Step 1: Start EdenAI workflow
    const initResponse = await axios.post(edenUrl, payload, { headers });
    const result = initResponse.data;
    const pollUrl = `${edenUrl}${result.id}/`;

    // Step 2: Poll for result
    const startTime = Date.now();
    let output = null;

    while (Date.now() - startTime < 13000) { // 13 second timeout
      const pollResponse = await axios.get(pollUrl, { headers });
      const resultData = pollResponse.data;

      if (
        resultData.content &&
        resultData.content.results &&
        resultData.content.results.text__chat &&
        resultData.content.results.text__chat.results &&
        resultData.content.results.text__chat.results[0]
      ) {
        output = resultData.content.results.text__chat.results[0].generated_text;
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 sec
    }

    // Step 3: Return result or fallback
    if (output) {
      return res.json({ endLife: output });
    }
  } catch (error) {
    console.error('Error during EdenAI call:', error.message);
  }

  // Default/fallback endpoint if EdenAI fails
  try {
    const fallbackUrl = `https://your-ai-model-api.com/predict?shelf_life=${foodItem}&storage_type=${storageType}&start_life=${startLife}`;
    const fallbackResponse = await axios.get(fallbackUrl);
    const fallbackData = fallbackResponse.data;

    return res.json({ endLife: fallbackData.end_life || 'TBD' });
  } catch (error) {
    console.error('Error in fallback fetch:', error.message);
    return res.json({ endLife: 'TBD' });
  }
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`listening on port ${port}`)
});

app.get('/search', async (req, res) => {
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