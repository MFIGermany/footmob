import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const readJSON = async (relativePath) => {
    try {
        const fullPath = path.join(__dirname, relativePath);
        const data = await fs.readFile(fullPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error al leer el archivo JSON:', error);
        throw error;
    }
};


export const writeJSON = async (path, data) => {
    try {
        await fs.writeFile(path, JSON.stringify(data, null, 2), 'utf8')
    } catch (error) {
        console.error('Error al escribir en el archivo JSON:', error)
        throw error
    }
}