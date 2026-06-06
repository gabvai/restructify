const axios = require("axios");
const FormData = require("form-data");

const analyzeImages = async (files) => {
  const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8001";

  const form = new FormData();

  files.forEach((file) => {
    form.append("images", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype
    });
  });

  const response = await axios.post(`${aiServiceUrl}/analyze`, form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  return response.data;
};

module.exports = {
  analyzeImages
};