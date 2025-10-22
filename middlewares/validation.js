// middlewares/validation.js (Ajustado)

module.exports = (req, res, next) => {
  if (req.method === 'POST' && req.path === '/products') { // <- Ruta corregida
    const { name, price } = req.body // <- Campos corregidos

    if (!name || !price) {
      return res.status(400).json({ 
        error: 'El nombre y el precio del producto son obligatorios.' 
      })
    }
    // 2. Validación de que 'price' es un número flotante válido y positivo
    const numericPrice = Number(price);

    // isFinite() verifica que el valor sea un número real, no Infinity, -Infinity o NaN.
    // Además, verificamos que sea positivo.
    if (!isFinite(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({
            error: 'El precio debe ser un número positivo (entero o decimal) válido.'
        })
    }
  }

  // NUEVA LÓGICA: Validación para crear una orden
  if (req.method === 'POST' && req.path === '/orders') {
    const { userId, items, totalAmount } = req.body;

    // Validación básica: requiere un usuario, items en el carrito y un total
    if (!userId || !items || items.length === 0 || !totalAmount || totalAmount <= 0) {
      return res.status(400).json({ 
        error: 'Datos de orden incompletos. Se requieren userId, items y totalAmount.' 
      });
    }
  }
  next()
}