import { createConnection } from './connection.js'

export class UserModel {
    static connection = null

    constructor() {
      this.init();
    }
  
    // Inicializa la conexión y muestra el estado en consola
    async init() {
      try {
        this.connection = await createConnection()
        console.log("Conexión a la base de datos establecida exitosamente");
      } catch (error) {
        console.error("Error al conectar a la base de datos:", error.message);
      }
    }
  
    // Método para crear un nuevo usuario
    async createUser({ nombre, email, password }) {
      try {
        const query = "INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)";
        const [result] = await this.connection.execute(query, [nombre, email, password]);
        return result;
      } catch (error) {
        console.error("Error al crear usuario:", error.message);
        throw error;
      }
    }
  
    // Método para obtener un usuario por ID
    async getUserById(id) {
      try {
        const query = "SELECT * FROM usuarios WHERE id = ?";
        const [rows] = await this.connection.execute(query, [id]);
        return rows[0] || null;
      } catch (error) {
        console.error("Error al obtener usuario:", error.message);
        throw error;
      }
    }
  
    // Método para actualizar un usuario por ID
    async updateUser(id, { nombre, email, password }) {
      try {
        const query = "UPDATE usuarios SET nombre = ?, email = ?, password = ? WHERE id = ?";
        const [result] = await this.connection.execute(query, [nombre, email, password, id]);
        return result;
      } catch (error) {
        console.error("Error al actualizar usuario:", error.message);
        throw error;
      }
    }
  
    // Método para eliminar un usuario por ID
    async deleteUser(id) {
      try {
        const query = "DELETE FROM usuarios WHERE id = ?";
        const [result] = await this.connection.execute(query, [id]);
        return result;
      } catch (error) {
        console.error("Error al eliminar usuario:", error.message);
        throw error;
      }
    }
  }