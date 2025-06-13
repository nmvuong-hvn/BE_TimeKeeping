const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

class ImageService {
  constructor() {
    this.baseDir = path.join(process.cwd(), 'public', 'images');
    this.employeeDir = path.join(this.baseDir, 'employees');
    this.ensureDirectories();
  }

  ensureDirectories() {
    // Create base directories if they don't exist
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
    if (!fs.existsSync(this.employeeDir)) {
      fs.mkdirSync(this.employeeDir, { recursive: true });
    }
  }

  /**
   * Process and save base64 image
   * @param {string} base64String - Base64 encoded image string
   * @param {string} employeeId - Employee ID
   * @param {string} imageType - Type of image (face, avatar, or 34)
   * @returns {Promise<string>} - Path to saved image
   */
  async processAndSaveImage(base64String, employeeId, imageType) {
    try {
      if (!base64String) return '';

      // Remove data URL prefix if present
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
      
      // Create buffer from base64 string
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Generate filename
      const filename = `${employeeId}_${imageType}.jpg`;
      const filepath = path.join(this.employeeDir, filename);

      // Process image with sharp
      await sharp(imageBuffer)
        .resize(800, 800, { // Resize to reasonable dimensions
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
        .toFile(filepath);

      // Return relative path for database storage
      return `/images/employees/${filename}`;
    } catch (error) {
      console.error(`Error processing image for employee ${employeeId}:`, error);
      throw error;
    }
  }

  /**
   * Delete old image if exists
   * @param {string} imagePath - Path to the image
   */
  async deleteOldImage(imagePath) {
    try {
      if (!imagePath) return;

      const fullPath = path.join(process.cwd(), 'public', imagePath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (error) {
      console.error('Error deleting old image:', error);
      // Don't throw error, just log it
    }
  }

  /**
   * Process all employee images
   * @param {Object} employee - Employee object
   * @param {Object} newImages - New images to process
   * @returns {Promise<Object>} - Object containing processed image paths
   */
  async processEmployeeImages(employee, newImages) {
    try {
      const processedImages = {};
      console.log("newImages = ", newImages);
      // Process face image
      if (newImages.faceBase64) {
        await this.deleteOldImage(employee.faceImage);
        processedImages.faceImage = await this.processAndSaveImage(
          newImages.faceBase64,
          employee.employeeId,
          'face'
        );
      }

      // Process avatar image
      if (newImages.faceEmbedding) {
        await this.deleteOldImage(employee.imageAvatar);
        processedImages.imageAvatar = await this.processAndSaveImage(
          newImages.faceEmbedding,
          employee.employeeId,
          'avatar'
        );
      }

      // Process 34 image
      if (newImages.image34) {
        await this.deleteOldImage(employee.image34);
        processedImages.image34 = await this.processAndSaveImage(
          newImages.image34,
          employee.employeeId,
          '34'
        );
      }

      return processedImages;
    } catch (error) {
      console.error('Error processing employee images:', error);
      throw error;
    }
  }
}

module.exports = new ImageService(); 