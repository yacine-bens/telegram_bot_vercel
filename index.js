require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const {TOKEN, SERVER_URL} = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const URI = `/webhook/${TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;

const app = express();
app.use(bodyParser.json());

// Tell Telegram server where to send POST requests
const init = async () => {
    const res = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`);
    console.log(res.data);
}

app.post(URI, async (req, res) => {
    console.log(req.body);
    console.log({"Token": TOKEN, "Url": SERVER_URL})

    const chatId = req.body.message.chat.id;
    const text = req.body.message.text;

    const message = `Your message contains ${wordCount(text)} words.`;
    
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: message
    })
    
    return res.send();
})

app.listen(process.env.PORT || 5000, async () => {
    console.log('App is running on port', process.env.PORT || 5000);
    await init();
})

function wordCount(str){
    return str.split(' ').filter(l => l != '').length;
}