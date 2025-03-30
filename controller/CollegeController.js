const CollegeModel = require("../model/College");
const HodModel = require("../model/hod");
const projectModel = require("../model/projects");
const authModel = require("../model/Auth");

const getAllColleges = async (req, res) => {
    const Hods = await CollegeModel.find();
    const totalColleges = await CollegeModel.countDocuments();
    return res.status(200).json({
        data: {
            status: true,
            data: Hods,
            totalColleges: totalColleges
        }
    })
}

const getOneCollege = async (req, res) => {
    try {
        const { college } = req.body;
        const data = await CollegeModel.findOne({ _id: college });
        if (!data) {
            return res.status(200).json({
                status: false,
                msg: "College not found"
            });
        }

        return res.status(200).json({
            status: true,
            data: data
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            msg: "Internal server error",
            error: err.message
        });
    }
};

// const addCollege = async(req,res)=>{
//     const {name,about,address,poc,departments} = req.body
//     const data = await CollegeModel.find({ name: name });
//     console.log("data",data);
//     if(data.length){
//         return res.status(200).json({
//             data: {
//                 status: false,
//                 msg:'College Already Exists'
//             }
//         })
//     }
//     const college = new CollegeModel({
//        name:name,
//        about:about,
//        address:address,
//        poc:poc,
//        departments:departments

//     })
//     await college.save()
//     return res.status(200).json({
//         data: {
//             status: true,
//             msg: 'College Created Successfully'
//         }
//     })

// }

const search = async (req, res) => {
    const { title } = req.body;
    console.log(title);
    try {
        const college = await CollegeModel.find({ name: { $regex: ".*" + title + ".*", $options: "i" } });
        if (college) {
            return res.status(200).json({
                data: { college }
            });
        }
        return res.status(404).json({ success: falsee, data: "not found" });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

const getcount = async (req, res) => {
    try {
        const { college_id } = req.body;
        const totalCountHod = await HodModel.countDocuments({ allocated_college: college_id });
        const totalcountProject = await projectModel.countDocuments({ allocated_college: college_id });
        const totalCountStudent = await authModel.countDocuments({ allocated_college: college_id })
        res.send({ totalcountProject, totalCountStudent, totalCountHod });
    } catch (err) {
        console.log(err);
        return res.status(200).json({
            err: err
        })
    }

}

module.exports = { getAllColleges, getOneCollege, search, getcount }