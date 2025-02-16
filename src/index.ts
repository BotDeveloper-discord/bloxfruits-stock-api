import express, { Request, Response } from "express";
import cors from "cors";
import axios from "axios";
import cheerio from "cheerio";
import bodyParser from "body-parser";

// Initialize the express app
const app = express();

// Set up middleware
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));

// Define the port and URL for the web scraping
const port: number = process.env.PORT || 3300;
const url: string = "https://blox-fruits.fandom.com/wiki/Blox_Fruits_%22Stock%22";

// Fruit object interface for structuring data
interface FruitObj {
    name: string;
    price: number;
}

// Helper function to remove duplicates from an array
const removeDuplicateItems = (arr: string[]): string[] => {
    const uniqueFruitsSet: Set<string> = new Set(arr);
    return [...uniqueFruitsSet];
}

// Function to fetch fruit names based on the stock element type
const getFruits = (typeStockElement: string, res: Response): Promise<string[]> => {
    return axios(url).then(result => {
        const data = result.data;
        const $ = cheerio.load(data);
        const toRemoveDuplicateFruits: string[] = [];

        $(typeStockElement, data).each((i, ele) => {
            const getFruitName: any = $(ele).find("big b a").attr("title");
            toRemoveDuplicateFruits.push(getFruitName);
        });

        return removeDuplicateItems(toRemoveDuplicateFruits);
    }).catch(error => {
        console.log(error);
        res.status(500).json();
        return [];
    });
}

// Function to fetch fruit prices based on the stock element type
const getPriceFruits = (typeStockElement: string, res: Response): Promise<string[]> => {
    return axios(url).then(result => {
        const data = result.data;
        const $ = cheerio.load(data);
        const toRemoveDuplicatePrice: string[] = [];

        $(typeStockElement, data).each((i, ele) => {
            const getFruitPrice: any = $(ele).find("span").last().text();
            toRemoveDuplicatePrice.push(getFruitPrice);
        });

        return removeDuplicateItems(toRemoveDuplicatePrice);
    }).catch(error => {
        console.log(error);
        res.status(500).json();
        return [];
    });
}

// Route to fetch current stock
app.get("/v1/currentstock", async (req: Request, res: Response) => {
    const currentStockElement: string = "#mw-customcollapsible-current figure > figcaption > center";
    const fruitNames = await getFruits(currentStockElement, res);
    const fruitPrices = await getPriceFruits(currentStockElement, res);
    const fruitsJson: FruitObj[] = [];

    for (let i = 0; i < fruitNames.length; i++) {
        fruitsJson.push({
            name: fruitNames[i],
            price: parseFloat(fruitPrices[i].replace(/,/g, '')),
        });
    }

    res.status(200).json(fruitsJson);
});

// Route to fetch last stock
app.get("/v1/laststock", async (req: Request, res: Response) => {
    const lastStockElement: string = "#mw-customcollapsible-last figure > figcaption > center";
    const fruitNames = await getFruits(lastStockElement, res);
    const fruitPrices = await getPriceFruits(lastStockElement, res);
    const fruitsJson: FruitObj[] = [];

    for (let i = 0; i < fruitNames.length; i++) {
        fruitsJson.push({
            name: fruitNames[i],
            price: parseFloat(fruitPrices[i].replace(/,/g, '')),
        });
    }

    res.status(200).json(fruitsJson);
});

// Default route to check if the server is up
app.get("/", (req: Request, res: Response) => {
    res.send("API is running smoothly!");
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
