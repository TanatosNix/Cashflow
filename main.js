document.addEventListener('DOMContentLoaded', () => {
  const amountInput = document.getElementById('amount');
  const typeSelect = document.getElementById('type');
  const descriptionInput = document.getElementById('description');
  const saveButton = document.getElementById('save');
  const balanceEl = document.getElementById('balance');
  const historyEl = document.getElementById('history');
  const monthsInput = document.getElementById('months');
  const simulatedEl = document.getElementById('simulated');

  let balance = 0;
  let history = [];

  typeSelect.addEventListener('change', () => {
    descriptionInput.classList.toggle('hidden', typeSelect.value !== 'egreso');
  });

  saveButton.addEventListener('click', () => {
    const amount = parseFloat(amountInput.value);
    if (isNaN(amount)) return;

    const type = typeSelect.value;
    const description = descriptionInput.value;

    const transaction = {
      type,
      amount,
      description: type === 'egreso' ? description : '',
    };

    history.push(transaction);

    balance += type === 'ingreso' ? amount : -amount;
    balanceEl.textContent = `Saldo actual: ${balance.toFixed(2)} €`;

    renderHistory();
    amountInput.value = '';
    descriptionInput.value = '';
  });

  monthsInput.addEventListener('input', () => {
    const months = parseInt(monthsInput.value);
    if (isNaN(months)) {
      simulatedEl.textContent = 'Total simulado: 0 €';
      return;
    }
    const avg = history.filter(t => t.type === 'ingreso').reduce((acc, t) => acc + t.amount, 0) / (history.length || 1);
    const total = avg * months;
    simulatedEl.textContent = `Total simulado: ${total.toFixed(2)} €`;
  });

  function renderHistory() {
    historyEl.innerHTML = '';
    history.forEach(t => {
      const li = document.createElement('li');
      li.textContent = `${t.type === 'ingreso' ? '+' : '-'}${t.amount} € ${t.description ? `(${t.description})` : ''}`;
      historyEl.appendChild(li);
    });
  }
});