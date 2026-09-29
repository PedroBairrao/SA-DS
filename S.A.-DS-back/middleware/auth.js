module.exports = (req, res, next) => {
  // Passa para a próxima rota sem bloquear
  next();
};