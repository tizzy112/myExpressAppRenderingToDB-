const express =require("express");
const router = express.Router();
const User =require('../models/users');
const multer = require('multer');
//const fs = require('fs');
const fs = require('fs').promises; 
const path = require('path'); // Ensure path module is required



//image upload
let storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'./uploads');
    },
    filename:function(req,file,cb){
        cb(null, file.fieldname+"_"+Date.now()+"_"+ file.originalname);
    },
});

let upload = multer({
    storage:storage,
}).single("image");

//insert an user into database route
router.post("/", upload,(req,res)=>{
    const user = new User({
        name:req.body.name,
        email:req.body.email,
        phone:req.body.phone,
        image:req.file.filename,
    });
    /*
    user.save((err)=>{
        if(err){
            res.json({message: err.message, type:'danger'});
        }else{
            req.session.message={
                type:'success',
                message:'User added successfully'
            };
            res.redirect('/');
        }
    })*/
        user.save()
        .then(() => {
            req.session.message = {
                type: 'success',
                message: 'User added successfully'
            };
            res.redirect('/');
        })
        .catch(err => {
            res.json({ message: err.message, type: 'danger' });
        });
    

})

/*
router.get("/",(req,res)=>{
    res.render("index",{title:"Home page"});
}); */

//get all users route
router.get("/", (req, res) => {
    User.find().exec()
        .then(users => {
            res.render("index", {
                title: "Home page",
                users: users
            });
        })
        .catch(err => {
            res.json({ message: err.message });
        });
});

router.get("/add",(req,res)=>{
    res.render("add_users",{title:"Add Users"});
});
//edit an user route
router.get("/edit/:id",(req,res)=>{
  let id =req.params.id;
  /*User.findById(id,(err, user)=>{  // old approach
    if (err){
        res.redirect("/");
    }else{
        if (user == null){
            res.redirect("/");
        }else{
            res.render("edit_users",{
                title:"Edit user",
                user: user,
            });
        }
    }
  }); */
     User.findById(id).exec()
     .then(user=>{
        if(!user){
            res.redirect("/");
        }else{
            res.render("edit_users",{
                title:"Edit user",
                user: user,
            });
        }
     })
     .catch(err =>{
        console.error("Error fetching user:", err);
        res.redirect("/");
     });
});
//update user route
/*
 router.post("/update/:id", upload,(req,res)=>{
    let id =req.params.id;
    let new_image="";

    if(req.file){
        new_image = req.file.filename;
        try{
            fs.unlinkSync("./uploads/" + req.body.old_image);

        }catch(err){
            console.log(err);
        }
    }else{
        new_image = req.body.old_image;
    }
    User.findByIdAndUpdate(id,{
        name:req.body.name,
        email:req.body.email,
        phone:req.body.phone,
        image: new_image,
    },(err,result)=>{
        if(err){
            res.json({message:err.message, type:'danger'});
        }else{
            req.session.message ={
                type: "success",
                message:"User updated successfully",
            };
            res.redirect("/");
        }
    })
})*/  //old approach

// Using fs.promises for async file operations

router.post("/update/:id", upload, async (req, res) => {
    let id = req.params.id;
    let new_image = "";

    try {
        if (req.file) {
            new_image = req.file.filename;
            await fs.unlink("./uploads/" + req.body.old_image);
        } else {
            new_image = req.body.old_image;
        }

        const updatedUser = await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: new_image,
        }, { new: true }); // Add { new: true } to return the updated document

        if (!updatedUser) {
            return res.json({ message: "User not found", type: 'danger' });
        }

        req.session.message = {
            type: "success",
            message: "User updated successfully",
        };
        res.redirect("/");
    } catch (err) {
        console.error("Error updating user:", err);
        res.json({ message: err.message, type: 'danger' });
    }
});


//delete user route
/* router.get("/delete/:id", (req,res)=>{
    let id = req.params.id;
    User.findByIdAndDelete(id,(err, result)=>{
        if (result.image != ""){
            try{
                fs.unlinkSync("./uploads/" + result.image);
            }catch(err){
                console.log(err);
            }
        }
        if (err){
            res.json({message:err.message});
        }else{
            req.session.message ={
                type:"info",
                message:"user deleted successfully!",
            };
            res.redirect("/")
        }
    })
}) // old way writting delete
 */


//new way
router.get("/delete/:id", async (req, res) => {
    let id = req.params.id;

    try {
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.json({ message: "User not found", type: 'danger' });
        }

        if (user.image) {
            const filePath = path.join(__dirname, "../uploads", user.image);
            await fs.unlink(filePath);
        }

        req.session.message = {
            type: "info",
            message: "User deleted successfully!",
        };
        res.redirect("/");
    } catch (err) {
        console.error("Error deleting user:", err);

        res.json({ message: err.message, type: 'danger' });
    }
});


module.exports= router;
