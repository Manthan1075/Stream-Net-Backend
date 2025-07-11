import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/users.route.js";
import videoRouter from "./routes/video.route.js";
import commentRouter from "./routes/comment.route.js";
import subsciptionRouter from "./routes/subscription.route.js";
import likeRouter from "./routes/like.route.js";
import postRouter from "./routes/post.route.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);
app.use(
  express.json({
    limit: "20kb",
  })
);
app.use(
  express.urlencoded({
    limit: "20kb",
    extended: true,
  })
);
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/subsciption", subsciptionRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/post", postRouter);

export default app;
