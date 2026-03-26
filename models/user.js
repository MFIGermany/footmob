import { pool } from './connection.js'

export class UserModel {
  constructor() {
    this.ready = Promise.resolve()
  }

  async createUser(googleId, name, email) {
    try {
      const query = 'INSERT INTO usuario (google_id, name, email) VALUES (?, ?, ?)'
      const [result] = await pool.execute(query, [googleId, name, email])
      return result
    } catch (error) {
      console.error('Error al crear usuario:', error.message)
      throw error
    }
  }

  async getUserById(id) {
    try {
      const query = `
        SELECT
          u.id,
          u.login_day,
          m.id as id_monedero,
          m.billetera,
          m.balance,
          m.ultimo_reclamo
        FROM usuario u
        INNER JOIN monedero m ON u.id = m.id_usuario
        WHERE google_id = ?
      `
      const [rows] = await pool.execute(query, [id])
      return rows[0] || null
    } catch (error) {
      console.error('Error al obtener usuario:', error.message)
      throw error
    }
  }

  async updateUser(id, { nombre, email, password }) {
    try {
      const query = 'UPDATE usuario SET nombre = ?, email = ?, password = ? WHERE id = ?'
      const [result] = await pool.execute(query, [nombre, email, password, id])
      return result
    } catch (error) {
      console.error('Error al actualizar usuario:', error.message)
      throw error
    }
  }

  async updateFechaLogin(id, fecha) {
    try {
      const query = 'UPDATE usuario SET login_day = ? WHERE id = ?'
      const [result] = await pool.execute(query, [fecha, id])
      return result
    } catch (error) {
      console.error('Error al actualizar usuario:', error.message)
      throw error
    }
  }

  async updateBalance(id, balance, fecha = null) {
    try {
      if (!id || balance == null) {
        throw new Error("Se requieren 'id' y 'balance' para actualizar el monedero.")
      }

      let query = 'UPDATE monedero SET balance = ? WHERE id_usuario = ?'
      let params = [balance, id]

      if (fecha) {
        query = 'UPDATE monedero SET balance = ?, ultimo_reclamo = ? WHERE id_usuario = ?'
        params = [balance, fecha, id]
      }

      const [result] = await pool.execute(query, params)
      return result
    } catch (error) {
      console.error('Error al actualizar el balance:', error.message)
      throw error
    }
  }

  async setWithdraw(id, amount, fecha) {
    try {
      const user = await this.getUserById(id)

      if (!user) {
        throw new Error('Usuario no encontrado.')
      }

      const id_monedero = user.id_monedero
      const query = 'INSERT INTO retiro (id_monedero, cantidad, fecha) VALUES (?, ?, ?)'
      const [result] = await pool.execute(query, [id_monedero, amount, fecha])

      return result
    } catch (error) {
      console.error('Error al registrar retiro:', error.message)
      throw error
    }
  }

  async getWithdraws(id) {
    try {
      const query = `
        SELECT r.*
        FROM retiro r
        INNER JOIN monedero m ON m.id = r.id_monedero
        INNER JOIN usuario u ON u.id = m.id_usuario
        WHERE google_id = ?
      `
      const [rows] = await pool.execute(query, [id])
      return rows || null
    } catch (error) {
      console.error('Error al obtener los retiros:', error.message)
      throw error
    }
  }

  async getPartidos() {
    try {
      const query = 'SELECT p.* FROM partido p WHERE cerrado = 0'
      const [rows] = await pool.execute(query)
      return rows || null
    } catch (error) {
      console.error('Error al obtener los partidos:', error.message)
      throw error
    }
  }

  async getApuesta(id, id_partido) {
    try {
      const query = 'SELECT a.* FROM apuesta a WHERE id_usuario = ? AND id_partido = ?'
      const [rows] = await pool.execute(query, [id, id_partido])
      return rows[0] || null
    } catch (error) {
      console.error('Error al obtener la apuesta:', error.message)
      throw error
    }
  }

  async updateWallet(id, wallet) {
    try {
      const user = await this.getUserById(id)

      if (!user) {
        throw new Error('Usuario no encontrado.')
      }

      const id_user = user.id

      const q = 'SELECT id_usuario FROM monedero WHERE billetera = ?'
      const [rows] = await pool.execute(q, [wallet])

      if (rows.length && rows[0].id_usuario != id_user) {
        return false
      }

      const query = 'UPDATE monedero SET billetera = ? WHERE id_usuario = ?'
      const [result] = await pool.execute(query, [wallet, id_user])
      return result
    } catch (error) {
      console.error('Error al actualizar billetera:', error.message)
      throw error
    }
  }

  async deleteUser(id) {
    try {
      const query = 'DELETE FROM usuario WHERE id = ?'
      const [result] = await pool.execute(query, [id])
      return result
    } catch (error) {
      console.error('Error al eliminar usuario:', error.message)
      throw error
    }
  }
}