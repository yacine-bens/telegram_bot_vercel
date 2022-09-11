require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const TOKEN = process.env.TOKEN;
// VERCEL_URL : prefixed by Vercel
const SERVER_URL = `https://${process.env.VERCEL_URL}`;
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

// MongoDB
const { MongoClient, ServerApiVersion } = require('mongodb');
const DB_URI = "mongodb+srv://vercel-admin-user:dKkJWnHudcEg8Q5c@cluster0.teexhmd.mongodb.net/test";
const client = new MongoClient(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// client.connect(err=>{
//     const collection = client.db("test").collection("chats");
//     // perform actions on the collection object
//     client.close();
// })

// Last bot_command
// {chat_id1: "last_bot_cmd", chat_id2: "last_bot_cmd"}
let chats = {};

// Receive messages
app.post(URI, async (req, res) => {
    console.log(req.body);

    let db = await client.connect();
    let collection = db.db('test').collection('chats');
    let results = collection.find().toArray();

    console.log(results);

    // Update is not a message
    if (!req.body.message || !req.body.message.text) return res.send();

    const chatId = req.body.message.chat.id;
    const text = req.body.message.text;

    // Default mode (first time)
    if (!chats[chatId]) chats[chatId] = "/chars";

    let response_message = "";

    // Check for bot commands
    if (isBotCommand(req.body.message)) {
        if (text === '/start') return res.send();
        if (text === '/mode') {
            let mode = (chats[chatId] === "/chars") ? "characters count" : "words count";
            response_message = `Current mode is ${mode}`;
        }
        else {
            chats[chatId] = text;
            response_message = "Please send some text."
        }
    }
    else {
        let count = chats[chatId] === "/chars" ? `${charCount(text)} characters.` : `${wordCount(text)} words.`;
        response_message = `Your message contains ${count}`;
    }


    // Respond to user
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: response_message
    })

    // Respond to Telegram server
    return res.send();
})

app.listen(process.env.PORT || 5000, async () => {
    console.log('App is running on port', process.env.PORT || 5000);
    await init();
})

function wordCount(str) {
    return str.split(' ').filter(l => l != '').length;
}

function charCount(str) {
    return str.replaceAll(' ', '').length;
}

function isBotCommand(msg) {
    if (msg.text.startsWith('/') && msg.entities) {
        for (let entity of msg.entities) {
            return entity.type === "bot_command";
        }
    }
}