import multer from 'multer';
import path from 'path';
import fs from 'fs'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve('public', 'temp'))
    },
    filename: function (req, file, cb) {

        cb(null, `${Date.now()}-${file.originalname}`)
    }
})

export const deleteLocalFile = async (filePath) => {
    try {
        fs.unlinkSync(filePath)
    } catch (error) {
        return null
    }
}
export const upload = multer({
    storage,
})
