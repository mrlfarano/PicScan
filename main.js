const fs = require('fs');
const path = require('path');
const axios = require('axios');
const scrapers = require('./scrapers');
const endpoints = require('./endpoints');

const searchAPI = async (api, imageData) => {
  try {
    const response = await axios.post(api.url, {
      image_data: imageData.toString('base64'),
      filename: 'image.jpg',
      auth: api.auth
    });
  
    return response.data.matching_images;
  } catch (error) {
    console.error(`Error searching image using ${api.name || api.url}: ${error.message}`);
    return [];
  }
};

async function searchImage(imageData) {
  const combinedResults = [];
  const apis = [...endpoints, ...scrapers].filter((api, i, self) => self.findIndex(a => a.url === api.url) === i);

  for (const api of apis) {
    const imageUrls = await searchAPI(api, imageData);
    combinedResults.push({ [api.name || api.url]: imageUrls });
  }

  return combinedResults;
}

async function searchFolder(folderPath) {
  const imageFiles = fs.readdirSync(folderPath).filter(file => {
    return path.extname(file) === '.jpg' || path.extname(file) === '.png';
  });

  const results = {};
  for (const file of imageFiles) {
    const filePath = path.join(folderPath, file);
    const imageData = fs.readFileSync(filePath);
    const imageUrls = await searchImage(imageData);
    results[file] = imageUrls;
  }

  fs.writeFileSync('results.json', JSON.stringify(results));
}

searchFolder('\img');
