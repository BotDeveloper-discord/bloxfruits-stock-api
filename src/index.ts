import express, { Request, Response } from "express";
import cors from "cors";
import axios from "axios";
import cheerio from "cheerio";
import bodyParser from "body-parser";

// Create the app instance
const app = express();

// Middleware for parsing JSON and URL-encoded data
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);

// Dynamic port assignment for Render
const port: number = process.env.PORT ? parseInt(process.env.PORT) : 3300;

// URL to scrape the data from
const url: string = "https://blox-fruits.fandom.com/wiki/Blox_Fruits_%22Stock%22";

// Interface for the fruit data
interface FruitObj {
    name: string;
    price: number;
}

// Function to remove duplicate fruit names
const removeDuplicateItems = (arr: string[]): string[] => {
    const uniqueFruitsSet: Set<string> = new Set(arr);
    const uniqueFruitsArr: string[] = [...uniqueFruitsSet];
    return uniqueFruitsArr;
}

// Function to get the fruit names
const getFruits = (typeStockElement: string, res: Response): Promise<string[]> => {
    return axios(url).then(result => {
        const data = result.data;
        const $ = cheerio.load(data);
        const toRemoveDuplicateFruits: string[] = [];

        $(typeStockElement, data).each((i, ele) => {
            const getFruitName: any = $(ele).find("big b a").attr("title");
            toRemoveDuplicateFruits.push(getFruitName);
        });

        const fruitNames: string[] = removeDuplicateItems(toRemoveDuplicateFruits);

        return fruitNames;
    }).catch (error => {
        console.log(error);
        res.status(500).json();
        return [];
    });
}

// Function to get the fruit prices
const getPriceFruits = (typeStockElement: string, res: Response): Promise<string[]> => {
    return axios(url).then(result => {
        const data = result.data;
        const $ = cheerio.load(data);
        const toRemoveDuplicatePrice: string[] = [];

        $(typeStockElement, data).each((i, ele) => {
            const getFruitName: any = $(ele).find("span").last().text();
            toRemoveDuplicatePrice.push(getFruitName);
        });

        const fruitPrices = removeDuplicateItems(toRemoveDuplicatePrice);
        return fruitPrices;
    }).catch (error => {
        console.log(error);
        res.status(500).json();
        return [];
    });
}

// Route to get the current stock
app.get("/v1/currentstock", async (req: Request, res: Response) => {
    const currentStockElement: string = "#mw-customcollapsible-current figure > figcaption > center";
    const fruitNames = await getFruits(currentStockElement, res);
    const fruitPrices = await getPriceFruits(currentStockElement, res);
    const fruitsJson: FruitObj[] = [];

    for (let i = 0; i < fruitNames.length; i++) {
        fruitsJson.push({
            name: fruitNames[i],
            price: parseFloat(fruitPrices[i].replace(/,/g, '')),
        })
    }

    res.status(200).json(fruitsJson);
});

// Route to get the last stock
app.get("/v1/laststock", async (req: Request, res: Response) => {
    const lastStockElement: string = "#mw-customcollapsible-last figure > figcaption > center";
    const fruitNames = await getFruits(lastStockElement, res);
    const fruitPrices = await getPriceFruits(lastStockElement, res);
    const fruitsJson: FruitObj[] = [];
    for (let i = 0; i < fruitNames.length; i++) {
        fruitsJson.push({
            name: fruitNames[i],
            price: parseFloat(fruitPrices[i].replace(/,/g, "")),
        })
    }
    res.status(200).json(fruitsJson);
});

// Start the server on the dynamic Render port
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
