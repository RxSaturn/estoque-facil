/**
 * Wrapper para simplificar tratamento de erros em controllers async
 * Evita a necessidade de try-catch em cada controller
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
