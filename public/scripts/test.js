async function getText() {

    const query = "gimme text";
    const proxyUrl = `http://127.0.0.1:5000/getText?query=${query}`;

    try {
        const response = await fetch(proxyUrl);
        const data = await response.json();
        console.log(data.text);
    } catch(error){

    }
}