const http = require('http');
const {logger} = require('./util/logger');
const fs = require('fs');

const PORT = 3000;

let data = JSON.parse(fs.readFileSync('groceryList.json', 'utf8'));

const server = http.createServer((req, res) => {
    logger.info(`[${req.method}]: ${req.url}`);

    let body = '';

    req.on('data', (chunk) => {
        body += chunk;
    });

    req.on('end', () => {
        body = body.length > 0 ? JSON.parse(body) : {};
        const contentType = {'Content-Type': 'application/json'};

        if(req.url.startsWith("/items")){
            logger.info(req.url.split('/'));
            let itemName = req.url.split("/")[2]; // Extract item name from URL

            switch(req.method) {
                case "POST": {
                    const { name, price, quantity } = body;
                    if (!name || !price || !quantity) {
                        res.writeHead(400, contentType);
                        return res.end(JSON.stringify({ message: "Please provide name, quantity, and price" }));
                    }

                    let newItem = { name, price, quantity, purchased: false };
                    data.grocery_list.push(newItem);
                    
                    fs.writeFileSync("groceryList.json", JSON.stringify(data, null, 2), 'utf8');
                    res.writeHead(201, contentType);
                    return res.end(JSON.stringify({ message: "Item added!" }));
                }
                case "GET": {
                    res.writeHead(200, contentType);
                    return res.end(JSON.stringify(data.grocery_list));
                }

                case "DELETE": {
                    let nameToDelete = itemName;
                    const initialLength = data.grocery_list.length;

                    data.grocery_list = data.grocery_list.filter(el => el.name !== nameToDelete);

                    if (data.grocery_list.length === initialLength) {
                        res.writeHead(404, contentType);
                        return res.end(JSON.stringify({ message: "Item not found" }));
                    }

                    fs.writeFileSync("groceryList.json", JSON.stringify(data, null, 2), 'utf8');
                    res.writeHead(200, contentType);
                    return res.end(JSON.stringify({ message: "Item deleted" }));
                }

                case "PUT": {
                    let nameToPurchase = itemName;
                    let itemFound = false;

                    data.grocery_list = data.grocery_list.map(el => {
                        if (el.name === nameToPurchase) {
                            itemFound = true;
                            return { ...el, purchased: true };
                        }
                        return el;
                    });

                    if (!itemFound) {
                        res.writeHead(404, contentType);
                        return res.end(JSON.stringify({ message: "Item not found" }));
                    }

                    fs.writeFileSync("groceryList.json", JSON.stringify(data, null, 2), 'utf8');
                    res.writeHead(200, contentType);
                    return res.end(JSON.stringify({ message: "Marked as purchased" }));
                }

                default:
                    res.writeHead(405, contentType);
                    return res.end(JSON.stringify({ message: "Method Not Allowed" }));
            }
        }
    });
});

server.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});