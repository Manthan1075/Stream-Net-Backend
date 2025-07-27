import express from "express";
import cors from "cors";
import userRouter from "./routes/users.route.js";
import videoRouter from "./routes/video.route.js";
import commentRouter from "./routes/comment.route.js";
import subscriptionRouter from "./routes/subscription.route.js";
import likeRouter from "./routes/like.route.js";
import postRouter from "./routes/post.route.js";
import notificationRouter from "./routes/notification.route.js";
import dotenv from 'dotenv'
import cookieParser from "cookie-parser";
dotenv.config();
const app = express();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  // console.log("Req :: APP  =", req);
  console.log("Headers:", req.headers["content-type"]);
  next();
});


app.use(cookieParser())
app.use(cors(
  {
    origin: process.env.FRONTEND_URL,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header']
  }
))
app.use(express.json());
app.use(
  express.urlencoded({
    limit: "20kb",
    extended: true,
  })
);
app.use(express.static("public"));
app.use("/api/v1/users", userRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/post", postRouter);
app.use("/api/v1/notification", notificationRouter)


export default app;
