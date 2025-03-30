const express = require('express');
const router = express.Router();
const verifyToken = require('../utils/authUtil');
const { getAllColleges, getOneCollege, search, getcount } = require("../controller/CollegeController");
// const { getAllColleges, getOneCollege,addCollege } = require("../controller/CollegeController");

router.get("/getAllColleges", getAllColleges)
router.post("/onecollge", getOneCollege)
router.post("/serach", search);
router.post("/getcount", getcount)
// router.post("/addCollege", addCollege)

module.exports = router;
