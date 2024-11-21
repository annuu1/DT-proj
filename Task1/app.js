const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

app.use(bodyParser.json()); // For parsing JSON bodies

// Connect to MongoDB
client.connect().then(() => {
    console.log("Connected to MongoDB");
    const db = client.db('eventDB');
    const eventsCollection = db.collection('events');

    // 1. Get Event by ID
    app.get('/api/v3/app/events', async (req, res) => {
        const { id, type, limit, page } = req.query;
        if (id) {
            try {
                const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
                if (event) {
                    res.json(event);
                } else {
                    res.status(404).json({ message: 'Event not found' });
                }
            } catch (err) {
                res.status(500).json({ message: err.message });
            }
        } else if (type === 'latest') {
            try {
                const events = await eventsCollection.find().sort({ schedule: -1 }).limit(parseInt(limit) || 5).skip(((parseInt(page) || 1) - 1) * (parseInt(limit) || 5)).toArray();
                res.json(events);
            } catch (err) {
                res.status(500).json({ message: err.message });
            }
        } else {
            res.status(400).json({ message: 'Invalid request' });
        }
    });

    // 2. Create an Event
    app.post('/api/v3/app/events', async (req, res) => {
        const { name, files, tagline, schedule, description, moderator, category, sub_category, rigor_rank } = req.body;
        try {
            const newEvent = {
                name, files, tagline, schedule, description, moderator, category, sub_category, rigor_rank, attendees: []
            };
            const result = await eventsCollection.insertOne(newEvent);
            res.json({ eventId: result.insertedId });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // 3. Update an Event
    app.put('/api/v3/app/events/:id', async (req, res) => {
        const eventId = req.params.id;
        const { name, files, tagline, schedule, description, moderator, category, sub_category, rigor_rank } = req.body;
        try {
            const updatedEvent = {
                name, files, tagline, schedule, description, moderator, category, sub_category, rigor_rank
            };
            const result = await eventsCollection.updateOne({ _id: new ObjectId(eventId) }, { $set: updatedEvent });
            if (result.modifiedCount > 0) {
                res.json({ message: 'Event updated successfully' });
            } else {
                res.status(404).json({ message: 'Event not found' });
            }
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // 4. Delete an Event
    app.delete('/api/v3/app/events/:id', async (req, res) => {
        const eventId = req.params.id;
        try {
            const result = await eventsCollection.deleteOne({ _id: ObjectId(eventId) });
            if (result.deletedCount > 0) {
                res.json({ message: 'Event deleted successfully' });
            } else {
                res.status(404).json({ message: 'Event not found' });
            }
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    // Start the server
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => console.error("Error connecting to MongoDB:", err));

