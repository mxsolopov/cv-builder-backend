import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import User from "./models/User.js";
import Resume from "./models/Resume.js";
import bcrypt from "bcryptjs";
import config from "config";
import { check, validationResult } from "express-validator";
import cookieParser from "cookie-parser";
import path from 'path';
import __dirname from './__dirname.js';

const app = express();
app.use(express.json({ extended: true }));
app.use(express.urlencoded());
app.use(cors());
app.use(cookieParser(config.get("secret")));

const PORT = process.env.PORT || 9000;

async function start() {
  try {
    await mongoose.connect(config.get("mongoUri"), {});
    app.listen(PORT, () => {
      console.log(`App has been started on port ${PORT}`);
    });
  } catch (e) {
    console.log("Server Error", e.message);
    process.exit(1);
  }
}

// Date calculation for resumes
const getDate = () => {
  const date = new Date();

  function addZero(num) {
    if (num < 10) {
      return "0" + num;
    } else {
      return num;
    }
  }
  return `${addZero(date.getDate())}-${addZero(date.getMonth() + 1)}-${addZero(
    date.getFullYear()
  )}, ${addZero(date.getHours())}:${addZero(date.getMinutes())}`;
};

// Registration route
app.post(
  "/registration",
  [
    check("email", "Некорректный email").isEmail(),
    check("password", "Минимальная длина пароля 6 символов").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(500).json({
          errors: errors.array(),
          message: "Некорректные данные при регистрации",
        });
      }

      const { email, password, rpassword } = req.body;
      const candidate = await User.findOne({ email });

      if (candidate) {
        return res
          .status(400)
          .json({ message: "Такой пользователь уже существует" });
      }

      if (password !== rpassword) {
        return res.status(400).json({ message: "Пароли не совпадают" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User({ email, password: hashedPassword });
      await user.save();

      res.status(201).json({ message: "Зарегистрирован новый пользователь" });
    } catch (e) {
      res
        .status(500)
        .json({ message: "Что-то пошло не так, попробуйте снова" });
    }
  }
);

// Login route
app.post(
  "/login",
  [
    check("email", "Некорректный email").normalizeEmail().isEmail(),
    check("password", "Введите пароль").exists(),
    check("password", "Минимальная длина пароля 6 символов").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(500).json({
          errors: errors.array(),
          message: "Некорректные данные при авторизации",
        });
      }

      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ message: "Пользователь не найден" });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Неверный пароль, попробуйте снова" });
      }

      res.json({ user });
    } catch (e) {
      res
        .status(500)
        .json({ message: "Что-то пошло не так, попробуйте снова" });
    }
  }
);

// Resume routes
app.post("/dashboard/", async (req, res) => {
  try {
    const resumes = await Resume.find({
      owner: req.cookies.userId,
    });
    res.status(201).json(resumes);
  } catch (e) {
    res.status(500).json({ message: "Что-то пошло не так, попробуйте снова" });
  }
});

app.post("/editor/", async (req, res) => {
  try {
    const resume = new Resume({
      resumeBase: {
        title: "Название резюме",
        template: "base",
        date: getDate(),
      },
      resumeData: {
        avatar: "",
        job: "",
        name: "",
        surname: "",
        birth: "",
        email: "",
        phone: "",
        country: "",
        city: "",
        summary: "",
        jobs: [],
        education: [],
        links: [],
        skills: [],
        courses: [],
        recommendations: [],
        languages: [],
        hobbies: "",
      },
      owner: req.cookies.userId,
    });
    await resume.save();
    res.cookie("resumeId", resume._id);
    res.status(201).json("Резюме создано");
  } catch (e) {
    res.status(500).json({ message: "Что-то пошло не так, попробуйте снова" });
  }
});

app.post("/save/", async (req, res) => {
  try {
    const resumeBase = req.body.params.resumeBase;
    const resumeData = req.body.params.resumeData;
    await Resume.updateOne(
      {
        owner: req.cookies.userId,
        _id: req.cookies.resumeId,
      },
      {
        $set: { resumeBase, resumeData },
      }
    );
    await Resume.updateOne(
      {
        owner: req.cookies.userId,
        _id: req.cookies.resumeId,
      },
      {
        $set: { "resumeBase.date": getDate() },
      }
    );
    res.status(201).json("Резюме сохранено");
  } catch (e) {
    res.status(500).json({ message: "Что-то пошло не так, попробуйте снова" });
  }
});

app.post("/delete/", async (req, res) => {
  try {
    await Resume.deleteOne({
      owner: req.body.params.userId,
      _id: req.body.params.resumeId,
    });
    res.status(201).json("Резюме удалено");
  } catch (e) {
    res.status(500).json({ message: "Что-то пошло не так, попробуйте снова" });
  }
});

if (process.env.NODE_ENV === "production") {
  app.use("/", express.static(path.join(__dirname, "client", "build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

start();
