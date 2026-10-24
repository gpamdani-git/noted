/**
 * Electron Security Module
 * Centralized security utilities for Noted
 */

const ipcValidation = require('./ipcValidation.cjs');

module.exports = {
  ...ipcValidation
};
