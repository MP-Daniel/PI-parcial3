/* ===================== PASARELA DE PAGO (SIMULADA) ================= */
// Algoritmo de Luhn (validación académica de número de tarjeta).
const luhnValid = (number) => {
  const digits = number.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0, even = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (even) { d *= 2; if (d > 9) d -= 9; }
    sum += d; even = !even;
  }
  return sum % 10 === 0;
};

// Simulación del gateway: devuelve aprobación o rechazo con motivo.
const simulateGateway = ({ card_number, card_name, expiry, cvv }) => {
  const num = (card_number || '').replace(/\s/g, '');
  if (!card_name || !num || !expiry || !cvv) return { ok: false, reason: 'Datos de tarjeta incompletos' };
  if (!/^\d{3,4}$/.test(cvv)) return { ok: false, reason: 'CVV inválido' };
  if (!/^\d{2}\/\d{2}$/.test(expiry)) return { ok: false, reason: 'Fecha de expiración inválida (MM/AA)' };

  const [mm, yy] = expiry.split('/').map((x) => parseInt(x, 10));
  if (mm < 1 || mm > 12) return { ok: false, reason: 'Mes de expiración inválido' };
  const exp = new Date(2000 + yy, mm); // primer día del mes siguiente
  if (exp <= new Date()) return { ok: false, reason: 'La tarjeta está vencida' };

  if (!luhnValid(num)) return { ok: false, reason: 'Número de tarjeta inválido (Luhn)' };
  if (num === '4000000000000002') return { ok: false, reason: 'Tarjeta rechazada: fondos insuficientes' };

  const transaction_id = 'TXN-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  return { ok: true, transaction_id, last4: num.slice(-4) };
};

module.exports = {
    luhnValid,
    simulateGateway
}