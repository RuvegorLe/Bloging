const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const userRoute = require("./routes/user");
const blogRoute = require("./routes/blog");
const { checkForAuthentication } = require("./middlewares/authentication");

const Blog = require("./models/blog");

const app = express();

const PORT = process.env.PORT || 8000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Connection error:", err));

// Cài đặt view engine  
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(checkForAuthentication());
app.use(express.static(path.resolve("./public")));
app.use(express.json());

//landingpage
app.get("/", async (req, res) => {
  try {
    const allBlogs = await Blog.find({}).sort({ createdAt: -1 });
    res.render("home", { user: req.user, blogs: allBlogs });
  } catch (error) {
    console.error("Error fetching blogs or rendering home view:", error);
    res
      .status(500)
      .send(
        "An error occurred while fetching blogs or rendering the home view."
      );
  }
});

// other route pages
app.use("/user", userRoute);
app.use("/blog", blogRoute);

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
