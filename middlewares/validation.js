// middlewares/validation.js (mejorado)
module.exports = (req, res, next) => {
  // Validación para crear producto
  if (req.method === 'POST' && req.path === '/products') {
    const { name, price } = req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({
        message: 'El nombre y el precio del producto son obligatorios.'
      });
    }

    const numericPrice = Number(price);
    if (!isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        message: 'El precio debe ser un número positivo (entero o decimal) válido.'
      });
    }
  }

  // Validación para crear orden
  if (req.method === 'POST' && req.path === '/orders') {
    const { userId, items, totalAmount } = req.body;

    if (!userId || !Array.isArray(items) || items.length === 0 || totalAmount === undefined || totalAmount === null || Number(totalAmount) <= 0) {
      return res.status(400).json({
        message: 'Datos de orden incompletos. Se requieren userId, items y totalAmount.'
      });
    }

    // Validar estructura de cada item
    for (const it of items) {
      if (!it.productId || it.productId === null) {
        return res.status(400).json({ message: 'Cada item debe tener productId.' });
      }
      const qty = Number(it.quantity);
      if (!isFinite(qty) || qty <= 0) {
        return res.status(400).json({ message: 'Cada item debe tener quantity > 0.' });
      }
      const price = Number(it.price);
      if (!isFinite(price) || price <= 0) {
        return res.status(400).json({ message: 'Cada item debe tener price > 0.' });
      }
    }

    // Validación opcional: verificar que totalAmount coincide con suma de items
    const calcTotal = items.reduce((acc, it) => acc + (Number(it.price) * Number(it.quantity)), 0);
    if (Math.abs(calcTotal - Number(totalAmount)) > 0.01) {
      return res.status(400).json({ message: 'El totalAmount no coincide con la suma de los items.' });
    }
  }

  next();
}