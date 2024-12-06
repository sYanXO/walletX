import express from "express";
import { Client } from "pg";
import { Request,Response } from "express";
import dotenv from "dotenv";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const app = express();
app.use(express.json());
dotenv.config();

const client = new Client("postgresql://neondb_owner:FlwWXeb7p0Ln@ep-proud-pond-a5htffyx.us-east-2.aws.neon.tech/neondb?sslmode=require");
client.connect()
    .then(()=>{
        console.log("db cnnected");
    })
    .catch((err)=>{
        console.log("db nhi hua connect");
    })
 // query krne k liye



const JWT_secret  = "123123";

async function generateToken(userId:string){
    const jwttoken = jwt.sign(userId,JWT_secret);
    return jwttoken
}


// ends
app.post("/api/v1/signup", async (req:Request,res:Response)=>{
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;

    // case when user sends incomplete data
    if(!email || !username || !password){
        res.status(400).json({
            message : "Incomplete credentials, send again!"
        })
    }

    //check if user exists in DB

    try{
        const existingUser = await client.query('SELECT * FROM USERS WHERE email = $1',[email]);
        if(existingUser.rows.length>0){
            res.status(400).json({
                message : "User already exists"
            })
        }
        
        const hashedUserPassword = await bcrypt.hash(password,10);


        const newUser = await client.query('INSERT INTO users (username,email,password) VALUES ($1,$2,$3) RETURNING *',[username,email,hashedUserPassword]);
        
        const token = await generateToken(newUser.rows[0].id);

        res.json({
            message : "User signed up",
            token
        })
    }catch(e){
        console.log(e);
        res.json({
            message: "server crashed, db issue!",
            
        })
    }


});

// sign in EP

app.post("/api/v1/signin", async (req:Request,res:Response)=>{
    const email = req.body.email;
    const password = req.body.password;


   

    const token = req.headers["authorization"]?.split(' ')[1];

    

    if(!token){
        res.json({
            message : "give jwt"
        })
    }

   jwt.verify(token as string, JWT_secret, (err:any, decoded:any) =>{
    if(err){
        res.json({
            message : "Invalid jwt"
        })
    }
    const userId = decoded.userId;
    res.json({
        message : "Signed in",
    })
   })
    
});

// get EP

app.get('/',(req:Request,res:Response)=>{
    res.send("Welcome to WalletX");
})



app.listen(3000,()=>{
    console.log("Server running in port "+3000);
});

