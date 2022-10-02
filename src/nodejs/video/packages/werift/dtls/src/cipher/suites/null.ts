import Cipher from "./abstract";
import { createNULLKeyExchange } from "../key-exchange";

/**
 * Default passthrough cipher.
 */
export default class NullCipher extends Cipher {
  /**
   * @class NullCipher
   */
  constructor() {
    super();

    this.name = "NULL_NULL_NULL"; // key, mac, hash
    this.blockAlgorithm = "NULL";
    this.kx = createNULLKeyExchange();
    this.hash = "NULL";
  }

  /**
   * Encrypts data.
   * @param {AbstractSession} session
   * @param {Buffer} data Content to encryption.
   * @returns {Buffer}
   */
  encrypt(session: any, data: Buffer) {
    return data;
  }

  /**
   * Decrypts data.
   * @param {AbstractSession} session
   * @param {Buffer} data Content to encryption.
   * @returns {Buffer}
   */
  decrypt(session: any, data: Buffer) {
    return data;
  }
}
