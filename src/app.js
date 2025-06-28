import express from 'express';
import cookieParser from 'cookie-parser'
import cors from 'cors'
import userRouter from './routes/users.route.js';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}))
app.use(express.json({
    limit: "20kb"
}));
app.use(express.urlencoded({
    limit: "20kb",
    extended: true
}));
app.use(express.static('public'));
app.use(cookieParser());

app.use('/api/v1/users', userRouter);

export default app;