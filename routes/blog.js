const { Router } = require("express");

const multer = require("multer");
const path = require("path");

const Blog = require("../models/blog");
const Comment = require("../models/comments");

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve("./public/uploads/"));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

router.get("/add-new", (req, res) => {
  try {
    return res.render("addBlog", {
      user: req.user,
    });
  } catch (error) {
    console.error("Error rendering addBlog view:", error);
    return res
      .status(500)
      .send("An error occurred while rendering the addBlog view.");
  }
});

router.get("/delete-blog", async (req, res) => {
  try {
    const allUserBlogs = await Blog.find({ createdBy: req.user._id }).sort({
      createdAt: -1,
    });

    return res.render("deleteandupdateblog", {
      user: req.user,
      blogs: allUserBlogs,
    });
  } catch (err) {
    console.error("Error retrieving user blogs:", err);
    return res.status(500).send("Internal Server Error");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("createdBy");

    const comments = await Comment.find({ blogId: req.params.id })
      .populate("createdBy")
      .sort({ createdAt: -1 }); // Sort comments by createdAt in descending order

    return res.render("blog", {
      user: req.user,
      blog,
      comments,
    });
  } catch (error) {
    console.error("Error fetching blog or comments:", error);
    res.status(500).send("Server error zz");
  }
});
router.get("/update/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("createdBy");

    return res.render("update", {
      user: req.user,
      blog,
    });
  } catch (error) {
    console.error("Error fetching blog or :", error);
    res.status(500).send("Server error zz");
  }
});

router.post("/delete/:blogId", async (req, res) => {
  const { blogId } = req.params;

  try {
    // Find the blog by ID and delete it
    const deletedBlog = await Blog.findByIdAndDelete(blogId);

    if (!deletedBlog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    // Delete all comments associated with the blog
    await Comment.deleteMany({ blogId });

    // Successfully deleted
    res.json({
      success: true,
      message: "Blog and associated comments deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blog and comments:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/comment/:blogId", async (req, res) => {
  try {
    // Validate request body
    if (!req.body.content) {
      return res.status(400).send("Comment content is required.");
    }

    const comment = await Comment.create({
      content: req.body.content,
      createdBy: req.user._id,
      blogId: req.params.blogId,
    });

    if (!comment) {
      throw new Error("Failed to create comment.");
    }

    return res.redirect(`/blog/${req.params.blogId}`);
  } catch (err) {
    console.error("Error creating comment:", err);
    return res
      .status(500)
      .send("Failed to create comment. Please try again later.");
  }
});

router.post("/", upload.single("coverImage"), async (req, res) => {
  try {
    if (!req.user) {
      console.log("User is not authenticated");
      return res.redirect("/user/signin");
    }
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).send("Title and body are required.");
    }

    // Check if file was successfully uploaded
    if (!req.file) {
      return res.status(400).send("Cover image is required.");
    }

    // Create a new blog post
    const blog = await Blog.create({
      title,
      body,
      createdBy: req.user._id,
      coverImageURL: `uploads/${req.file.filename}`,
    });

    // Redirect to the newly created blog post
    return res.redirect(`/blog/${blog._id}`);
  } catch (err) {
    // Handle any errors that occur during blog creation
    console.error("Error creating blog:", err);
    return res
      .status(500)
      .send("Failed to create blog. Please try again later.");
  }
});

router.post("/update/:id", async (req, res) => {
  const { id } = req.params;
  const { title, body } = req.body;
  try {
    // Find the blog by ID and update it
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { title, body },
      { new: true, runValidators: true } // Options: return the updated document and run validation
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({ message: "Update Successful", blog: updatedBlog });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the blog." });
  }
});

module.exports = router;
