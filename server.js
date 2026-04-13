const express = require("express");
const multer = require("multer");
const cors = require("cors");

const app = express();
app.use(express.json());

// ================= MOCK DATABASE =================
let users = [];
let tweets = [];

// ================= FILE UPLOAD =================
const upload = multer({ dest: "uploads/" });

// ================= TASK 1: NOTIFICATION =================
app.post("/tweet", (req, res) => {
  const { userId, content } = req.body;

  let notify = false;

  if (
    content.toLowerCase().includes("cricket") ||
    content.toLowerCase().includes("science")
  ) {
    notify = true;
  }

  tweets.push({ userId, content });

  res.json({ message: "Tweet posted", notify });
});

// ================= TASK 2: AUDIO + OTP =================
app.post("/upload-audio", upload.single("audio"), (req, res) => {
  const hour = new Date().getHours();

  if (hour < 14 || hour > 19) {
    return res.send("Upload only between 2PM–7PM");
  }

  if (req.file.size > 100 * 1024 * 1024) {
    return res.send("File too large");
  }

  res.send("Audio uploaded successfully");
});

// OTP GENERATION
app.post("/send-otp", (req, res) => {
  const { email } = req.body;

  let user = users.find(u => u.email === email);

  const otp = Math.floor(100000 + Math.random() * 900000);

  if (!user) {
    user = { email };
    users.push(user);
  }

  user.otp = otp;

  res.send(`OTP sent: ${otp}`);
});

// ================= TASK 3: FORGOT PASSWORD =================
app.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  let user = users.find(u => u.email === email);

  if (!user) return res.send("User not found");

  const today = new Date().toDateString();

  if (user.lastReset === today) {
    return res.send("You can use this option only one time per day");
  }

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let newPass = "";

  for (let i = 0; i < 8; i++) {
    newPass += chars[Math.floor(Math.random() * chars.length)];
  }

  user.password = newPass;
  user.lastReset = today;

  res.send(`New Password: ${newPass}`);
});

// ================= TASK 4: SUBSCRIPTION =================
const plans = {
  Free: 1,
  Bronze: 3,
  Silver: 5,
  Gold: Infinity
};

app.post("/subscribe", (req, res) => {
  const { email, plan } = req.body;

  const hour = new Date().getHours();

  if (hour !== 10) {
    return res.send("Payment allowed only 10–11 AM");
  }

  let user = users.find(u => u.email === email);

  if (!user) {
    user = { email, tweetCount: 0 };
    users.push(user);
  }

  user.subscription = plan;
  user.tweetCount = 0;

  res.send(`Subscribed to ${plan}`);
});

app.post("/post-tweet", (req, res) => {
  const { email, content } = req.body;

  let user = users.find(u => u.email === email);

  if (!user) return res.send("User not found");

  if (!user.tweetCount) user.tweetCount = 0;
  if (!user.subscription) user.subscription = "Free";

  if (user.tweetCount >= plans[user.subscription]) {
    return res.send("Tweet limit reached");
  }

  user.tweetCount++;
  tweets.push({ email, content });

  res.send("Tweet posted");
});

// ================= TASK 5: MULTI-LANGUAGE =================
app.post("/change-language", (req, res) => {
  const { email, language } = req.body;

  let user = users.find(u => u.email === email);

  if (!user) return res.send("User not found");

  if (language === "French") {
    return res.send("OTP sent to Email for French");
  } else {
    return res.send("OTP sent to Mobile");
  }
});

// ================= TASK 6: LOGIN TRACKING =================
app.post("/login", (req, res) => {
  const { email } = req.body;

  const userAgent = req.headers["user-agent"];
  const hour = new Date().getHours();

  let user = users.find(u => u.email === email);

  if (!user) {
    user = { email, loginHistory: [] };
    users.push(user);
  }

  const isMobile = userAgent.includes("Mobile");

  if (isMobile && (hour < 10 || hour > 13)) {
    return res.send("Mobile login allowed only 10AM–1PM");
  }

  if (userAgent.includes("Chrome")) {
    return res.send("OTP sent to Email");
  }

  const loginData = {
    device: userAgent,
    ip: req.ip,
    time: new Date()
  };

  user.loginHistory.push(loginData);

  res.send("Login successful");
});

// ================= SERVER =================
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
