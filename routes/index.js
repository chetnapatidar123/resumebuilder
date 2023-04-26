var express = require('express');
var router = express.Router();
const upload = require("../helpers/multer").single("avatar");
const fs = require("fs");
const User = require("../models/userModel");
const passport = require("passport");
const localStrategy = require("passport-local");
passport.use(new localStrategy(User.authenticate()));
const nodemailer = require("nodemailer")

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'home page', isLoggedIn: req.user ? true : false, user: req.user, });
});

// get /show page
router.get('/show', isLoggedIn, function(req, res, next) {
  res.render('show', {isLoggedIn: req.user ? true : false, user: req.user,});
});

// get /signin page
router.get('/signin', function(req, res, next) {
  res.render('signin', {isLoggedIn: req.user ? true : false, user: req.user,});
});

// post /signin page
router.post("/signin", passport.authenticate("local",{
  successRedirect: "/profile",
  failureRedirect: "/signin",
}),
function(req,res,next) {}
);

// get /signup page
router.get('/signup', function(req, res, next) {
  res.render('signup', {isLoggedIn: req.user ? true : false, user: req.user,});
});

// post /signup page
router.post('/signup', function(req, res, next) {
  const { username,email,contact,password} = req.body;
  User.register({username,email,contact},password)
  .then((user) => {
    res.redirect("/signin")
  })
  .catch((err)=> res.send(err))
});

// get /profile page
router.get('/profile', isLoggedIn, function(req, res, next) {
  console.log(req.user);
  res.render('profile', {isLoggedIn: req.user ? true : false, user: req.user,});
});

// get /signout page
router.get('/signout', isLoggedIn, function(req, res, next) {
  req.logout(() => {
    res.redirect("/signin")
  });
});

// get /resetpassword page
router.get("/resetpassword", isLoggedIn, function(req, res, next) {
  res.render("reset", {isLoggedIn: req.user ? true : false, user: req.user,});
});

// post /resetpassword page
router.post("/resetpassword", isLoggedIn, async function(req,res,next){
  try{
    await req.user.changePassword(
      req.body.oldpassword,
      req.body.newpassword
    );
    await req.user.save();
    res.redirect("/profile");
  }catch(error){
    res.send(err);
  }
});

// get /forgetpassword page
router.get("/forgetpssword",  function(req, res, next) {
res.render('forget', {isLoggedIn: req.user ? true : false, user: req.user,});
});

// post /send-mail page
router.post("/send-mail", async function(req, res, next){
  const user = await User.findOne({email: req.body.email});
  if(!user) return res.send("user not found");
  const code = Math.floor(Math.random() * 9000 + 1000);


const transport = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  auth: {
      user: "chetnapatidar745@gmail.com",
      pass: "cewzrzfxrsyzlcpj",
  },
});

const mailOptions = {
  from: "chetna tamp Pvt. Ltd.<chetna tamp@gmail.com>",
  to: req.body.email,
  subject: "Password Reset Code",
  text: "Do not share this Code to anyone.",
  html: `<p>Do not share this code to anyone.</p><h1>${code}</h1>`,
};

transport.sendMail(mailOptions,async (err, info) => {
  if (err) return res.send(err);
  console.log(info);
  await User.findByIdAndUpdate(user._id, {code});
  // user.passwordResetToken = 1;
  // user.save();
  // return res.send(
  //     "<h1 style='text-align:center;color: tomato; margin-top:10%'><span style='font-size:60px;'>✔️</span> <br />Email Sent! Check your inbox , <br/>check spam in case not found in inbox.</h1> <br> <a href='/signin'>signin</a>"
  // );
  res.redirect("/code/" + user._id);
});
});

// get /code/id page
router.get("/code/:id", async function (req, res, next){
  res.render("getcode", {id: req.params.id, isLoggedIn: req.user ? true : false, user: req.user,})
});

// post /code/id page
router.post("/code/:id",async function (req, res,next){
  try{
  const user = await User.findById(req.params.id);
  if (user.code == req.body.code) return res.send("invalid code");
  res.redirect(`/forgetpassword/${user._id}`);
  }catch(error){
    res.send(err);
  }
});

// get /forgetpassword/id page
router.get("/forgetpassword/:id",  function(req, res, next) {
  res.render("getpassword", {id: req.params.id, isLoggedIn: req.user ? true : false, user: req.user,});
  });

//  post /forgetpassword/id page
router.post("/forgetpassword/:id", async function(req,res,next){
  const usr = await User.findById(req.params.id);
  usr.setPassword(req.body.newpassword, function(){
   usr.save()
  });
  res.redirect("/signin")
});

//  post /update/id page
router.post("/update/:id", isLoggedIn, async function (req, res, next) {
  try {
      const { username, email, contact, linkedin, github, behance } =
          req.body;

      const updatedUserInfo = {
          username,
          email,
          contact,
          links: { linkedin, github, behance },
      };

      await User.findOneAndUpdate(req.params.id, updatedUserInfo);
      res.redirect("/profile");
  } catch (error) {
      res.send(err);
  }
});

//  post /upload/id page
router.post("/upload", isLoggedIn, async function (req, res, next) {
  upload(req, res, function (err) {
      if (err) {
          console.log("ERROR>>>>>", err.message);
          res.send(err.message);
      }
      if (req.file) {
        if (req.user.avatar !== "default.png"){
          fs.unlinkSync("../public/images/" + req.user.avatar);
        }
          req.user.avatar = req.file.filename;
          req.user.save()
              .then(() => {
                  res.redirect("/profile");
              })
              .catch((err) => {
                  res.send(err);
              });
      }
  });
});

//  get /create page
  router.get("/create", isLoggedIn, function (req, res, next) {
    res.render("create", {title: "Create",isLoggedIn: req.user ? true : false,user: req.user,
    });
});

  //  get /education page
  router.get("/education", isLoggedIn,  function(req, res, next){
    res.render("resume/education", {title: "education" ,isLoggedIn: req.user ? true : false,user: req.user,
  });
  });

  //  post /add-edu page
  router.post("/add-edu", isLoggedIn, async function (req, res, next) {
    req.user.education.push(req.body);
    await req.user.save();
    res.redirect("/education");
});

    // get /delete-edu page
router.get("/delete-edu/:index", isLoggedIn, async function (req, res, next) {
  const eduCopy = [...req.user.education];
  eduCopy.splice(req.params.index, 1);
  req.user.education = [...eduCopy];
  await req.user.save();
  res.redirect("/education");
});

//  get /skill page
router.get("/skill", isLoggedIn,  function(req, res, next){
  res.render("resume/skill", {title: "skill" ,isLoggedIn: req.user ? true : false,user: req.user,
});
});

//  post /add-skill page
router.post("/add-skill", isLoggedIn, async function (req, res, next) {
  req.user.skill.push(req.body);
  await req.user.save();
  res.redirect("/skill");
});

  // get /delete-skill page
router.get("/delete-skill/:index", isLoggedIn, async function (req, res, next) {
const skillCopy = [...req.user.skill];
skillCopy.splice(req.params.index, 1);
req.user.skill = [...skillCopy];
await req.user.save();
res.redirect("/skill");
});

//  get /project page
router.get("/project", isLoggedIn,  function(req, res, next){
  res.render("resume/project", {title: "project" ,isLoggedIn: req.user ? true : false,user: req.user,
});
});

//  post /add-project page
router.post("/add-project", isLoggedIn, async function (req, res, next) {
  req.user.project.push(req.body);
  await req.user.save();
  res.redirect("/project");
});

  // get /delete-project page
router.get("/delete-project/:index", isLoggedIn, async function (req, res, next) {
const proCopy = [...req.user.project];
proCopy.splice(req.params.index, 1);
req.user.project = [...proCopy];
await req.user.save();
res.redirect("/project");
});

//  get /experience page
router.get("/experience", isLoggedIn,  function(req, res, next){
  res.render("resume/experience", {title: "experience" ,isLoggedIn: req.user ? true : false,user: req.user,
});
});

//  post /add-experience page
router.post("/add-experience", isLoggedIn, async function (req, res, next) {
  req.user.experience.push(req.body);
  await req.user.save();
  res.redirect("/experience");
});

  // get /delete-experience page
router.get("/delete-experience/:index", isLoggedIn, async function (req, res, next) {
const expCopy = [...req.user.experrience];
expCopy.splice(req.params.index, 1);
req.user.experience = [...expCopy];
await req.user.save();
res.redirect("/experience");
});

//  get /interest page
router.get("/interest", isLoggedIn,  function(req, res, next){
  res.render("resume/interest", {title: "interest" ,isLoggedIn: req.user ? true : false,user: req.user,
});
});

//  post /add-interest page
router.post("/add-interest", isLoggedIn, async function (req, res, next) {
  req.user.interest.push(req.body);
  await req.user.save();
  res.redirect("/interest");
});

  // get /delete-interest page
router.get("/delete-interest/:index", isLoggedIn, async function (req, res, next) {
const interCopy = [...req.user.interest];
interCopy.splice(req.params.index, 1);
req.user.interest = [...interCopy];
await req.user.save();
res.redirect("/interest");
});


  function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    next();
  }else{
    res.redirect("/signin")
  }
};

module.exports = router;
