const express = require('express');
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser');
const {v4 : uuidv4} = require('uuid');
const port = 4043;
const app = express();
const {createClient} = require('redis');
const md5 = require('md5');
const { json } = require('body-parser');

const redisClient = createClient(
{
      url:'redis://default@localhost:6379',
}
);

app.use(bodyParser.json());

https.createServer({
    key: fs.readFileSync('./SSL/server.key'),
    cert: fs.readFileSync('./SSL/server.cert'),
    ca:fs.readFileSync('./SSL/chain.pem')
}, app).listen(port, async ()=>{
    await redisClient.connect();//creating a TCP socket with Redis
    console.log("Listening on port: "+port);
})

app.get('/',(req,res)=>{
    res.send('Hello Sean!');
});

app.post('/user',(req,res)=>{
    const newUserRequestObject = req.body;
    console.log('New User:',JSON.stringify(newUserRequestObject));
    redisClient.hSet('users',req.body.email,JSON.stringify(newUserRequestObject));
    res.send('New user'+newUserRequestObject.email+' added');
});

app.post('/login', async (req,res)=>{
    const loginEmail = req.body.userName;
    console.log(JSON.stringify(req.body));
    console.log('loginEmail',loginEmail);
    const loginPassword = req.body.password;
    console.log('loginPasword',loginPassword);

    const userString=await redisClient.hGet('users',loginEmail);
    const userObject = JSON.parse(userString);
    if(userString=='' || userString==null){
        res.status(404);
        res.send('User not found');
    }
    else if (loginEmail==userObject.userName && loginPassword==userObject.password){
        const token = uuidv4();
        res.send(token);
    } else{
        res.status(401);//unauthorized
        res.send('Invalid user or password');
    }

});