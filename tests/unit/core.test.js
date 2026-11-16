const {
  normalizeTitle,
  validateTicketInput,
  canChangeStatus,
  filterAndSort
} = require('../../src/core');

describe('Тестирование бизнес-логики HelpDesk', () => {

  test('U-01: Нормализация должна убирать лишние пробелы внутри строки', () => {
    // ТЗ: заменить любую последовательность пробельных символов одним пробелом
    expect(normalizeTitle('  Сбой   VPN  ')).toBe('Сбой VPN');
  });

  test.each([
    ['1234', false], // 4 символа (мало)
    ['12345', true], // 5 символов (норма)
    ['A'.repeat(80), true], // 80 символов (норма)
    ['A'.repeat(81), false] // 81 символ (много)
  ])('U-02: Валидация длины темы (границы). Строка "%s"', (title, isValid) => {
    const input = { title, description: 'Нормальное описание', category: 'software', priority: 'low' };
    const errors = validateTicketInput(input);
    // Если isValid=true, то ошибок быть не должно
    expect(errors.title === undefined).toBe(isValid);
  });

  test('U-03: Валидация длины темы ДОЛЖНА учитывать нормализацию', () => {
    // Строка из 5 символов, но с кучей пробелов. После нормализации должно быть "A A A A A"
    const input = { title: '  A   A   A   A   A  ', description: 'Нормальное описание', category: 'software', priority: 'low' };
    const errors = validateTicketInput(input);
    expect(errors.title).toBeUndefined(); 
  });

  test('U-04: Разрешенные переходы статусов', () => {
    expect(canChangeStatus('new', 'in_progress')).toBe(true);
    expect(canChangeStatus('in_progress', 'resolved')).toBe(true);
  });

  test('U-05: Запрещенные переходы статусов (нельзя перескакивать)', () => {
    // ТЗ: new -> resolved запрещено
    expect(canChangeStatus('new', 'resolved')).toBe(false);
    // ТЗ: нельзя вернуться назад
    expect(canChangeStatus('resolved', 'in_progress')).toBe(false);
  });

  test('U-06: Поиск должен быть без учета регистра', () => {
    const tickets = [
      { title: 'Сломался VPN', description: 'Не подключается', status: 'new', category: 'network', priority: 'high', createdAt: '2023-01-01' }
    ];
    // Ищем маленькими буквами, а в базе большими
    const result = filterAndSort(tickets, { search: 'vpn' });
    expect(result.length).toBe(1);
  });

  test('U-07: Сортировка по приоритету (высокий должен быть первым)', () => {
    const tickets = [
      { title: 'Low', priority: 'low', createdAt: '2023-01-01' },
      { title: 'High', priority: 'high', createdAt: '2023-01-02' },
      { title: 'Medium', priority: 'medium', createdAt: '2023-01-03' }
    ];
    const result = filterAndSort(tickets);
    // Ожидаем порядок: High, Medium, Low
    expect(result[0].title).toBe('High');
    expect(result[1].title).toBe('Medium');
    expect(result[2].title).toBe('Low');
  });

});