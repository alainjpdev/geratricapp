import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lista de imágenes de Google Classroom a descargar
const images = [
  { url: 'https://gstatic.com/classroom/themes/img_code.jpg', filename: 'classroom-code.jpg' },
  { url: 'https://gstatic.com/classroom/themes/img_biology.jpg', filename: 'classroom-biology.jpg' },
  { url: 'https://gstatic.com/classroom/themes/img_chemistry.jpg', filename: 'classroom-chemistry.jpg' },
  { url: 'https://gstatic.com/classroom/themes/img_geography.jpg', filename: 'classroom-geography.jpg' },
  { url: 'https://gstatic.com/classroom/themes/img_history.jpg', filename: 'classroom-history.jpg' },
  { url: 'https://gstatic.com/classroom/themes/img_literature.jpg', filename: 'classroom-literature.jpg' },
  { url: 'https://gstatic.com/classroom/themes/img_math.jpg', filename: 'classroom-math.jpg' },
  { url: 'https://gstatic.com/classroom/themes/img_music.jpg', filename: 'classroom-music.jpg' },
  { url: 'https://gstatic.com/classroom/themes/img_read.jpg', filename: 'classroom-read.jpg' },
  { url: 'https://gstatic.com/classroom/themes/img_bookclub.jpg', filename: 'classroom-bookclub.jpg' },
  { url: 'https://gstatic.com/classroom/themes/img_backtoschool.jpg', filename: 'classroom-backtoschool.jpg' },
];

const assetsDir = path.join(__dirname, '..', 'src', 'assets');

// Crear directorio si no existe
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded: ${path.basename(filepath)}`);
          resolve();
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Seguir redirecciones
        file.close();
        fs.unlinkSync(filepath);
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
      } else {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

async function downloadAllImages() {
  console.log('Downloading classroom theme images...\n');
  
  for (const image of images) {
    const filepath = path.join(assetsDir, image.filename);
    try {
      await downloadImage(image.url, filepath);
    } catch (error) {
      console.error(`✗ Failed to download ${image.filename}:`, error.message);
    }
  }
  
  console.log('\nDownload complete!');
}

downloadAllImages();

