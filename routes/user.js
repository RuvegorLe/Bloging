const { Router } = require("express");
const User = require("../models/user");

const router = Router();

router.get("/signin", (req, res) => {
  try {
    if (req.user) {
      return res.redirect("/");
    }
    return res.render("signin");
  } catch (err) {
    console.error("Error rendering signin page:", err);
    return res.status(500).send("Internal Server Error");
  }
});

router.get("/signup", (req, res) => {
  try {
    if (req.user) {
      return res.redirect("/");
    }
    return res.render("signup");
  } catch (err) {
    console.error("Error rendering signup page:", err);
    return res.status(500).send("Internal Server Error");
  }
});

router.get("/logout", (req, res) => {
  try {
    res.clearCookie("token");
    return res.redirect("/");
  } catch (err) {
    console.error("Error logging out:", err);
    return res.status(500).send("Failed to log out. Please try again later.");
  }
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const token = await User.matchPasswordAndGenerateToken(email, password);
    return res.cookie("token", token).redirect("/");
  } catch (error) {
    console.error("Sign in error:", error);
    return res.render("signin", {
      error: "Invalid email or password",
    });
  }
});

router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    await User.create({
      fullName,
      email,
      password,
    });

    return res.redirect("/user/signin");
  } catch (error) {
    console.error("Signup error:", error);

    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.render("signup", {
        error: "Email already exists. Please use a different email address.",
      });
    }

    return res
      .status(500)
      .send("Failed to create user. Please try again later.");
  }
});

module.exports = router;
