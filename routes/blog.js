const express = require("express");
const router = express.Router();
const blogSchema = require("../models/blogs.js");

// Creating model for currently logged in user 
let blogs;
router.use((req, res, next) => {
  blogs = require("mongoose").model(req.user.email, blogSchema);
  next();
});
// Root route
router.get("/", (req, res) => {
  res.json({
    success: true,
    authorized: true,
    message: "Add, delete, update or search your blogs",
  });
});

router.get("/s", async (req, res) => {
  try {
    // Extract all information
    const query = String(req.query.query || "");
    const id = String(req.query.id || "");
    let results;

    // Priortize Id > Sno > Query
    if (id) {
      results = await blogs.findById(id);
    } else {
      results = await blogs.find({
        title: {
          $regex: query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
          $options: "i",
        },
      });
    }

    if (results && Object.keys(results).length) {
      res.status(200).json({ success: true, results: results });
      return;
    }

    // If results are empty
    res.status(400).json({
      success: false,
      message: "No Blog found.",
    });
  } catch (error) {
    if (error.name == "CastError") {
      error.message = "Invalid Id";
    }
    res.send({ success: true, error: error.name, message: error.message });
  }
});

//Add Blog
router.post("/add", async (req, res) => {
  try {
    //Extract data from body
    const data = req.body;
    if (data.like || data.comment) {
      delete data.comment;
      delete data.like;
    }
    const item = new blogs(data);

    // check whether blog is already present or not
    const itemAlreadyPresent = await blogs.findOne({
      title: { $regex: `^${data.title}$`, $options: "i" },
    });
    if (itemAlreadyPresent) {
      res.status(400).json({
        success: false,
        message: "Blog with same title already present , consider changing.",
      });
      return;
    }

    //Save new blog
    await item.save();
    res.status(201).json({ success: true, message: "blog added", data: item });
  } catch (error) {
    res.send({ success: true, error: error.name, message: error.message });
  }
});

// Update blog 
router.put("/update", async (req, res) => {
  try {
    // Id of blog to be updated
    let id = req.query.id;
    const data = req.body;
    if (data.like || data.comment) {
      delete data.comment;
      delete data.like;
    }
    // Check for id and data
    if (!id || Object.keys(data).length == 0) {
      res
        .status(400)
        .json({ success: false, message: "ID or Data not provided" });
      return;
    }

    // Updating
    let oldData;
    oldData = await blogs.findByIdAndUpdate(id, data);

    // If no data is found for that id -> invalid id
    if (!oldData) {
      res.status(400).json({
        success: false,
        message: "Id does not match any blog in database.",
      });
      return;
    }
    res
      .status(201)
      .json({ success: true, message: "Updated Successfully", oldData });
  } catch (error) {
    if (error.name == "CastError") {
      error.message = "Invalid Id";
    }
    res.send({ success: true, error: error.name, message: error.message });
  }
});

// Delete Blog 
router.delete("/delete", async (req, res) => {
  try {
    // Id of blog to be deleted
    let id = req.query.id;
    // Check if id or sno is provided or not
    if (!id) {
      res.status(400).json({ success: false, message: "Id not provided" });
      return;
    }

    // Delete blog
    let deletedItem = await blogs.findByIdAndDelete(id);

    // If no blog was present for that id
    if (!deletedItem) {
      res.status(400).json({
        success: false,
        message: "Id does not match any blog in database.",
      });
      return;
    }
    res
      .status(200)
      .json({ success: true, message: "Deleted Successfully", deletedItem });
  } catch (error) {
    if (error.name == "CastError") {
      error.message = "Invalid Id";
    }
    res.send({ success: true, error: error.message });
  }
});

// Comments for a blog
router.post("/comment", async (req, res) => {
  try {
    const data = req.body;
    const id = req.query.id;
    if (
      !(
        data.comment &&
        (typeof(data.comment) == "string" || data.comment instanceof Array)
      )
    ) {
      res
        .status(400)
        .json({ success: false, message: "Comment not provided or invalid" });
      return;
    }

    // Updating
    let itemFound = await blogs.findById(id);

    // If no data is found for that id -> invalid id
    if (!itemFound) {
      res.status(400).json({
        success: false,
        message: "Id does not match any blog in database.",
      });
      return;
    }

    data.comment= typeof(data.comment)=="string"? [data.comment]: data.comment
    itemFound.comment = [...itemFound.comment, ...data.comment]
    const oldData = await blogs.findByIdAndUpdate(id,itemFound)

    res
      .status(201)
      .json({ success: true, message: "Updated Successfully", oldData });
  } catch (error) {
    if (error.name == "CastError") {
      error.message = "Invalid Id";
    }
    res.status(500).send({ success: true, error: error.message });
  }
});
router.get("/like", async (req, res) => {
  try {
    const id = req.query.id;
    // If id is not provided
    if (!id) {
      res.status(400).json({ success: false, message: "Id not provided" });
      return;
    }
    const itemFound = await blogs.findById(id);
    itemFound.like += 1;
    await blogs.findByIdAndUpdate(id,itemFound);
    if (itemFound) {
      res
        .status(200)
        .json({ success: true, message: "Liked the blog successfully." });
      return;
    }

    // If no blog is found for that particular id
    res
      .status(400)
      .json({ success: false, message: "No blog can be found with that id." });
  } catch (error) {
    if (error.name == "CastError") {
      error.message = "Invalid Id";
    }
    res.send({ success: true, error: error.message });
  }
});
module.exports = router;
