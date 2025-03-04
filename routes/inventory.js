const express = require("express");
const inventory = require("../models/Inventory");
const router = express.Router();

// Root route
router.get("/", (req, res) => {
  res.json({
    success: true,
    authorized: true,
    message:
      "This is your inventory. You can Add, Update, Delete or Get items.",
  });
});

// Search items
router.get("/s", async (req, res) => {
  try {
    // Extract all information
    const query = String(req.query.query || "");
    const page = Number(req.query.page - 1 || 0);
    const limit = Number(req.query.limit || 5);
    const sno = String(req.query.sno || "");
    const id = String(req.query.id || "");
    let results;
    let total;

    // Priortize Id > Sno > Query 
    if (id) {
      console.log(id)
      results = await inventory.findById(id);
      total = 1;
    } else {
      const q = sno? sno:query
      console.log(q)
      results = await inventory
        .find({
          [sno?"sno":"name"]: {
            $regex: q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
            $options: "i",
          },
        })
        .skip(page * limit)
        .limit(limit);
      total = await inventory.countDocuments({
        [sno?"sno":"name"]: {
          $regex: q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
          $options: "i",
        },
      });
    }

    if (results && Object.keys(results).length) {
    res.status(200).json({ success: true, total, results: results });
      return;
    }

    // If results are empty
      res.status(400).json({
        success: false,
        message: "No item found.",
      });

  } catch (error) {
    if (error.name == "CastError") {
      error.message = "Invalid Id";
    }
    res.send({ success: true, error: error.name, message: error.message });
  }
});

// Add Items
router.post("/add", async (req, res) => {
  try {
    //Extract data from body
    const data = req.body;
    const item = new inventory(data);

    // check whether item is already present or not
    const itemAlreadyPresent = await inventory.findOne({ sno: data.sno });
    if (itemAlreadyPresent) {
      res.status(400).json({
        success: false,
        message: "Item already in inventory, consider updating.",
      });
      return;
    }

    //Save new item
    await item.save();
    res.status(201).json({ success: true, message: "Item added", data: item });
  } catch (error) {
    res.send({ success: true, error: error.name, message: error.message });
  }
});

// Update items
router.put("/update", async (req, res) => {
  try {
    // Id of item to be updated
    let id = req.query.id;
    let sno = req.query.sno;
    const data = req.body;

    // Check for id and data
    if ((!id && !sno) || Object.keys(data).length == 0) {
      res
        .status(400)
        .json({ success: false, message: "ID/Sno or Data not provided" });
      return;
    }

    // Updating
    let oldData;
    if (id) {
      oldData = await inventory.findByIdAndUpdate(id, data);
    } else if (sno) {
      oldData = await inventory.findOneAndUpdate({ sno }, data);
    }

    // If no data is found for that id -> invalid id
    if (!oldData) {
      res.status(400).json({
        success: false,
        message: "Id does not match any element in inventory.",
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

// Delete Item
router.delete("/delete", async (req, res) => {
  try {
    // Id of item to be deleted
    let id = req.query.id;
    let sno = req.query.sno;
    // Check if id or sno is provided or not
    if (!(id || sno)) {
      res.status(400).json({ success: false, message: "Id/Sno not provided" });
      return;
    }

    let deletedItem;
    // Delete item
    if (id) {
      deletedItem = await inventory.findByIdAndDelete(id);
    } else if (sno) {
      deletedItem = await inventory.findOneAndDelete({ sno });
    }

    // If no item was present for that id
    if (!deletedItem) {
      res.status(400).json({
        success: false,
        message: "Id does not match any element in inventory.",
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

module.exports = router;
