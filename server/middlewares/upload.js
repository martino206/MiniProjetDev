const multer  = require('multer')
const cloudinary = require('../config/Claudinary.js')
const { Readable } = require('stream')

// On garde les fichiers en mémoire (pas sur disque)
// car Render n'a pas de stockage persistant
const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Type de fichier non autorisé. Utilisez JPEG, PNG, WebP ou GIF.'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
})

// Helper — upload un buffer vers Cloudinary et retourne l'URL sécurisée
function uploadToCloudinary(buffer, folder, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        ...options,
      },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }
    )
    Readable.from(buffer).pipe(stream)
  })
}

module.exports = { upload, uploadToCloudinary }