const path = require('node:path');

const PORTAL_SRC = path.join(__dirname, 'src');
const APP_SRC = path.join(__dirname, '..', 'src');

/**
 * Igual que rootDirs en tsconfig.json: si un import relativo del portal no existe dentro de
 * portal-postulantes/src, se busca en la misma ruta de la app principal (dependencias compartidas).
 */
module.exports = (request, options) => {
  try {
    return options.defaultResolver(request, options);
  } catch (error) {
    if (!request.startsWith('.')) throw error;
    const relative = path.relative(PORTAL_SRC, path.resolve(options.basedir, request));
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw error;
    return options.defaultResolver(path.join(APP_SRC, relative), options);
  }
};
