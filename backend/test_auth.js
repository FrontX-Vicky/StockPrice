require('dotenv').config();
const { SmartAPI } = require('smartapi-javascript');
const totp = require('totp-generator');
const smart_api = new SmartAPI({ api_key: process.env.API_KEY });
async function test() {
    const session = await smart_api.generateSession(process.env.CLIENT_CODE, process.env.PIN, totp(process.env.TOTP_SECRET));
    console.log(JSON.stringify(session, null, 2));
}
test();
