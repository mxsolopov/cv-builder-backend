import pkg from "mongoose";
const { Schema, model, Types } = pkg;

const schema = new Schema({
  resumeBase: {
    title: { type: String, default: "Название резюме" },
    template: { type: String, default: "" },
    date: { type: String, default: "" },
    additionalSections: {
      type: Object,
      default: {
        courses: false,
        recommendations: false,
        languages: false,
        hobbies: false,
      },
    },
  },
  resumeData: {
    avatar: { type: String, default: "" },
    job: { type: String, default: "" },
    name: { type: String, default: "" },
    surname: { type: String, default: "" },
    birth: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    country: { type: String, default: "" },
    city: { type: String, default: "" },
    summary: { type: String, default: "" },
    jobs: { type: Array, default: [] },
    education: { type: Array, default: [] },
    links: { type: Array, default: [] },
    skills: { type: Array, default: [] },
    courses: { type: Array, default: [] },
    recommendations: { type: Array, default: [] },
    languages: { type: Array, default: [] },
    hobbies: { type: String, default: "" },
  },
  owner: { type: Types.ObjectId, ref: "User" },
});

const Resume = model("Resume", schema);

export default Resume;
