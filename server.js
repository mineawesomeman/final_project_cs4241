import express from 'express';
import ViteExpress from 'vite-express';

const app = express();

app.use(express.json());

// Sample data (to be replaced with database connection)
const data = [];

// Add function
app.post('/add', (req, res) => {
    const item = req.body;

    // TODO: Add database connection here to save the item
    data.push(item);

    res.status(200).send({ message: 'Item added successfully!' });
});

// Delete function
app.delete('/delete/:id', (req, res) => {
    const { id } = req.params;

    // TODO: Add database connection here to delete the item by its ID
    const index = data.findIndex(item => item.id === id);
    if (index !== -1) {
        data.splice(index, 1);
        res.status(200).send({ message: 'Item deleted successfully!' });
    } else {
        res.status(404).send({ message: 'Item not found!' });
    }
});

ViteExpress.listen(app, 3000);
