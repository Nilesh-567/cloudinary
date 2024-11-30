import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const url =  process.env.MONGO_URL || "mongodb://localhost:27017/"; 

async function checkConnection() {
    try {
const client = new MongoClient(url);
const db = await client.db(process.env.DB_NAME || "Vercel");
const collection = db.collection(process.env.COLLECTION_NAME || "projects");  

return {client,db,collection}; 
    }
    catch(err) {
        console.log("error");
        return false; 
    }
};

export { checkConnection };

