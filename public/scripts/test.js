async function fetcEndLife(foodItem, storageType, startLife) {
    const apiUrl = `https://your-ai-model-api.com/predict?shelf_life=${foodItem}&storage_type=${storageType}&start_life=${startLife}`;

    const headers = {
        'Authorization': `Bearer ${process.env.EDEN_AI_AUTHORIZATION_KEY}`,
        'Content-Type': 'application/json'
    };
    const url = 'https://api.edenai.run/v2/workflow/1b63438f-dfc7-4187-9473-d12de23ba7b4/execution/';

    const payload = { prompt: 'Answer by only stating a number + "days", "weeks","months", or "years". Let say I have ' + foodItem + " that is kept in " + storageType + " and was fresh since the unix time in seconds : " + startLife + ". When can I expect it to expire?"};

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        const url1 = `${url}${result.id}/`;
        let result1 = {};
        let started = Date.now();
        let flag = true;

        while (flag) {
            const response1 = await fetch(url1, { headers: headers });
            result1 = await response1.json();

            if (result1.content.results !== undefined && Object.keys(result1.content.results).length !== 0) {
                output = result1.content.results.text__chat.results[0].generated_text;
                return output;
                flag = false;
            }

            if (Date.now() - started > 13000) {
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (error) {
        console.error('Error:', error);
    }



        //default
            try {
                const response = await fetch(apiUrl);
                const data = await response.json();
                return data.end_life;  // Assuming the API returns an object with an end_life property
            } catch (error) {
                console.error('Error fetching end_life:', error);
                return 'TBD';  // Return a default value if the API call fails
            }
}

async function fetcchEndLife(foodItem, storageType, startLife) {

    const response = await fetch('/fetchEndLife', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          foodItem: foodItem,
          storageType: storageType,
          startLife: startLife
        })
      });
    
    return response.json.endLife;

}