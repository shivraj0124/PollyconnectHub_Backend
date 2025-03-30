const HodModel = require("../model/hod");
const ProjectModel = require("../model/projects");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const cloudinary = require("../utils/imageuploadUtils");
dotenv.config();
const jwtkey = process.env.jwt_key;

const getAllHod = async (req, res) => {
  const Hods = await HodModel.find();

  return res.status(200).json({
    data: {
      status: true,
      data: Hods,
    },
  });
};

const getOneHod = async (req, res) => {
  try {
    const { hod } = req.body;
    const data = await HodModel.findOne({ _id: hod });
    if (!data) {
      return res.status(404).json({
        data: {
          status: false,
          msg: "not found",
        },
      });
    }
    return res.status(200).json({
      data: {
        status: true,
        data: data,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      data: {
        status: false,
        error: err,
      },
    });
  }
};

const addProject = async (req, res) => {
  const {
    title,
    description,
    multimedia,
    contributers,
    live_demo,
    college,
    department,
    type,
    userType,
    timestamp,
  } = req.body;
  if (userType != "HOD") {
    return res.status(200).json({
      data: {
        status: false,
        msg: "Not have permission  to do this task.",
      },
    });
  }
  const existProject = await ProjectModel.findOne({
    title: title,
    allocated_college: college,
  });
  if (existProject) {
    return res.status(200).json({
      data: {
        status: false,
        msg: "Project with same name exist in your collage.",
      },
    });
  }
  const imageUrl = await cloudinary.uploader.upload(multimedia);
  console.log("imageUrl", imageUrl);
  const project = new ProjectModel({
    title: title,
    description: description,
    multimedia: imageUrl.secure_url,
    contributers: contributers,
    live_demo: live_demo,
    allocated_college: college,
    allocated_department: department,
    type: type,
    isActive: true,
    userType: "HOD"
  });
  await project.save();

  return res.status(200).json({
    data: {
      status: true,
      msg: "Project added Sucessfully....",
    },
  });
};

const HodLogin = async (req, res) => {
  const { username, password } = req.body;

  const Hod = await HodModel.findOne({ username: username });
  if (!Hod) {
    return res.status(200).json({
      data: {
        status: false,
        msg: "username or password is invalid...",
      },
    });
  }

  const match = await bcrypt.compare(password, Hod.password);
  if (match) {
    const data = {
      id: Hod._id,
      name: Hod.username,
      email: Hod.email,
      type: "HOD",
    };
    const token = jwt.sign(data, jwtkey);
    return res.status(200).json({
      data: {
        status: true,
        msg: "login sucessful...",
        token: token,
        hodDetails: Hod,
      },
    });
  }
  return res.status(400).json({
    data: {
      status: false,
      msg: "username or password is invalid.",
    },
  });
};

const deleteproject = async (req, res) => {
  const { project_id } = req.body;
  const user = req.user;
  if (user.type != "HOD") {
    return res.status(403).json({
      data: {
        status: false,
        msg: "Not have permission to do this task.",
      },
    });
  }

  const collge = await ProjectModel.findByIdAndDelete(project_id);

  if (!collge) {
    return res.status(404).json({
      data: {
        status: false,
        msg: "project not found.",
      },
    });
  }

  return res.status(200).json({
    data: {
      status: true,
      msg: "Project Deleted Successfully",
    },
  });
};

const getProjects = async (req, res) => {
  try {
    const { allocated_college, allocated_department } = req.body;
    const projects = await ProjectModel.find({
      allocated_college: allocated_college,
      allocated_department: allocated_department,
    }).sort({ time: -1 })
      .populate("allocated_college")
      .populate("allocated_department");
    const projectCount = await ProjectModel.find({
      allocated_college: allocated_college,
      allocated_department: allocated_department,
    })
      .populate("allocated_college")
      .populate("allocated_department")
      .countDocuments();

    return res.status(200).json({
      data: {
        status: true,
        data: projects,
        projectCount,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      data: {
        status: false,
        msg: err,
      },
    });
  }
};

const editProject = async (req, res) => {
  try {
    const {
      id,
      title,
      description,
      multimedia,
      userType,
      contributers,
      live_demo,
      type,
    } = req.body;
    if (userType !== "HOD") {
      return res.status(200).json({
        data: {
          status: false,
          msg: "You do not have permission to perform this action.",
        },
      });
    }

    const existingProject = await ProjectModel.findById(id);
    if (!existingProject) {
      return res.status(200).json({
        data: {
          status: false,
          msg: "Project not found.",
        },
      });
    }
    if (multimedia.length > 0) {
      const imageUrl = await cloudinary.uploader.upload(multimedia);
      existingProject.multimedia = imageUrl.secure_url;
    }
    existingProject.title = title;
    existingProject.description = description;
    existingProject.contributers = contributers;
    existingProject.live_demo = live_demo;
    existingProject.type = type;

    const updatedProject = await existingProject.save();

    return res.status(200).json({
      data: {
        status: true,
        msg: "Project Updated Successfully.",
        updatedProject: updatedProject,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      data: {
        status: false,
        msg: "Error occurred while updating college.",
      },
    });
  }
};

const searchProject = async (req, res) => {
  try {
    const { search } = req.query;
    const { allocated_department } = req.body;

    console.log(search, allocated_department);

    const projects = await ProjectModel.find({
      allocated_department: allocated_department,
      $or: [
        { title: { $regex: ".*" + search + ".*", $options: "i" } },
        { description: { $regex: ".*" + search + ".*", $options: "i" } },
        { contributers: { $regex: ".*" + search + ".*", $options: "i" } },
        { multimedia: { $regex: ".*" + search + ".*", $options: "i" } },
        { live_demo: { $regex: ".*" + search + ".*", $options: "i" } },
        { type: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    });

    res.status(200).send({ success: true, projects });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ success: false, message: "Internal server error" });
  }
};

const hodDashboardDetails = async (req, res) => {
  try {
    const { department_id, hod_id, college_id } = req.body;
    const totalProjects = await ProjectModel.countDocuments({
      allocated_department: department_id,
    });
    const data = await HodModel.find({ _id: hod_id, allocated_college: college_id }).populate("allocated_college").populate("allocated_department")
    res.send({ totalProjects, hodData: data })
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      data: {
        status: false,
        msg: "Error occurred while updating college.",
      },
    });
  }
};

const handleStatus = async (req, res) => {
  try {
    const { project_id, active } = req.body
    const existingProject = await ProjectModel.findById(project_id);

    if (!existingProject) {
      return res.status(200).json({
        data: {
          status: false,
          msg: "College not found.",
        },
      });
    }
    existingProject.isActive = active
    const updatedProject = await existingProject.save()
    return res.status(200).json({
      data: {
        status: true,
        msg: "Status Updated Successfully.",
        updatedProject: updatedProject,
      },
    });

  } catch (err) {
    console.error(err);
    return res.status(400).json({
      data: {
        status: false,
        msg: "Error occurred while updating college.",
      },
    });
  }
}


module.exports = {
  getAllHod,
  getOneHod,
  addProject,
  HodLogin,
  deleteproject,
  getProjects,
  editProject,
  searchProject, hodDashboardDetails, handleStatus
};
