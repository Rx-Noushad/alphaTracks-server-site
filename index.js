const express = require('express');
// const { MongoClient } = require('mongodb');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());


// database connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ay7ws3o.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();

        const database = client.db('Shop');
        const bikesCollection = database.collection('bikes');
        const ordersCollection = database.collection('orders');
        const usersCollection = database.collection('users');
        const reviewsCollection = database.collection('reviews');
        const paymentsCollection = database.collection('payments');
        const newsBlogCollection = database.collection('newsBlog');

        // get API
        app.get('/bikes', async (req, res) => {
            const cursor = bikesCollection.find({});
            const result = await cursor.toArray();
            // console.log(result);
            res.send(result);
        });

        app.get('/bikes/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await bikesCollection.findOne(query);

            res.send(result);
        });
        
        app.get('/newsBlog', async (req, res) => {
            const cursor = newsBlogCollection.find({});
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/newsBlog/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await newsBlogCollection.findOne(query);
            res.send(result);
        });

        app.get('/orders/:email', async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };

            const cursor = ordersCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders)
        });

        app.get('/order/:orderId', async (req, res) => {
            const id = req.params.orderId;
            const query = { _id: ObjectId(id) };
            const order = await ordersCollection.findOne(query);
            res.send(order);
        });

        app.get('/brandItems/:brandName', async (req, res) => {
            const brandName = (req.params.brandName);

            const query = { brand: brandName };

            const cursor = bikesCollection.find(query);
            const brandBikes = await cursor.toArray();
            console.log(brandBikes);
            res.send(brandBikes)
        })

        app.get('/orders', async (req, res) => {
            const cursor = ordersCollection.find({});
            const orders = await cursor.toArray();
            res.send(orders)
        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });

        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        // single news blog
        app.get('/newsBlog/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await newsBlogCollection.findOne(query);
            res.send(result);
        });

        // post API
        app.post('/bikes', async (req, res) => {
            const newBike = req.body;
            // console.log(newBike);
            const addNewBike = newBike;
            const result = await bikesCollection.insertOne(addNewBike);
            // console.log(result);
            res.json(result);
        });

        app.post('/newsBlog', async (req, res) => {
            const newBlog = (req.body);
            const addNewBlog = newBlog;
            const result = await newsBlogCollection.insertOne(addNewBlog);
            console.log(result);
            res.json(result);
        });

        app.post('/orders', async (req, res) => {
            const order = req.body;
            const doc = order;
            const result = await ordersCollection.insertOne(doc);
            res.json(result);
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        });

        app.post('/reviews', async (req, res) => {
            const newReview = (req.body);
            const result = await reviewsCollection.insertOne(newReview);
            res.json(result);
        });

        app.post('/newsBlog', async (req, res) => {
            const newBlog = (req.body);
            const result = await newsBlogCollection.insertOne(newBlog);
            res.json(result);
        });

        app.post('/create-payment-intent', async (req, res) => {
            const {order} = req.body;

            const id = (Math.random() * 0xfffff * 100000000000).toString(16);
            const id2 = (Math.random() * 0xfffff * 100000000000).toString(16);

            const paymentId = "pi_" + id + "secret" + id2;

            res.send({ intent:"succeeded", paymentId });
        });

        app.post('/payments', async (req, res) => {
            const paymentInfo = req.body;
            paymentInfo.payment = true;
            const result = await paymentsCollection.insertOne(paymentInfo);
            const orderId = paymentInfo.orderId;

            const filter = {_id: ObjectId(orderId)};
            const updatedDoc = {
                $set: {
                    payment: true,
                    transactionId: paymentInfo.transactionId
                }
            }

            // console.log(paymentInfo)
            const updatedResult = await ordersCollection.updateOne(filter, updatedDoc);

            res.send(result);
        });




        // update API
        app.put('/bikes/:id', async (req, res) => {
            const id = req.params.id;
            const updateBike = req.body;
            const filter = { _id: ObjectId(id) };

            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    bike_name: updateBike.bike_name,
                    image: updateBike.image,
                    short_des: updateBike.short_des,
                    brand: updateBike.brand,
                    price: updateBike.price
                }
            }
            const result = await bikesCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        })

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } }
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        })

        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const updateOrder = req.body;

            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };

            const updateDoc = {
                $set: {
                    serviceId: updateOrder.serviceId,
                    orderStatus: updateOrder.orderStatus,
                    userName: updateOrder.userName,
                    userPhoneNumber: updateOrder.userPhoneNumber,
                    userEmail: updateOrder.userEmail,
                    userAddress: updateOrder.userAddress,
                    bike_name: updateOrder.bike_name,
                    brand: updateOrder.brand,
                    price: updateOrder.price
                }
            }
            const result = await ordersCollection.updateOne(filter, updateDoc, options);

            res.send(result);
        })

        // delete API
        app.delete('/bikes/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bikesCollection.deleteOne(query);
            console.log(result);
            res.json(result);
        })

        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.json(result);
        });

    }
    finally {
        // await client.close()
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})