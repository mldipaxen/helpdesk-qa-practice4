'use strict';
const { createApp } = require('../../src/app');

let server;
let base;

// Эта функция запускает тестовый сервер перед каждым тестом
beforeEach(async () => {
  server = createApp({ seed: [] }); // seed: [] означает "пустая база"
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

// Эта функция выключает сервер после каждого теста
afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
});

// --- ИЗНАЧАЛЬНЫЕ ТЕСТЫ АВТОРОВ ---
test('GET /api/health отвечает HTTP 200', async () => {
  const response = await fetch(`${base}/api/health`);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok' });
});

test('POST /api/tickets создает корректную заявку', async () => {
  const response = await fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Сбой принтера', description: 'Принтер в аудитории не отвечает',
      category: 'hardware', priority: 'medium'
    })
  });
  const body = await response.json();
  expect(response.status).toBe(201);
  expect(body.ticket.id).toBe(1);
  expect(body.ticket.status).toBe('new');
});

// --- ТВОИ НОВЫЕ 5 ТЕСТОВ (ИНТЕГРАЦИОННЫЕ) ---

test('I-01: Успешное создание и последующее чтение заявки', async () => {
  // Создаем
  const createRes = await fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Сбой VPN', description: 'Не подключается сеть',
      category: 'network', priority: 'high'
    })
  });
  const createdBody = await createRes.json();
  expect(createRes.status).toBe(201);
  expect(createdBody.ticket.title).toBe('Сбой VPN');

  // Читаем список
  const getRes = await fetch(`${base}/api/tickets`);
  const getBody = await getRes.json();
  expect(getRes.status).toBe(200);
  expect(getBody.items.some(t => t.id === createdBody.ticket.id)).toBe(true);
});

test('I-02: Ошибка валидации (400) и неизменность количества заявок', async () => {
  // Узнаем изначальное количество
  const beforeRes = await fetch(`${base}/api/tickets`);
  const beforeBody = await beforeRes.json();
  const countBefore = beforeBody.total;

  // Пытаемся создать с пустой темой
  const res = await fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: '', description: 'Описание', category: 'network', priority: 'high' })
  });
  expect(res.status).toBe(400);

  // Проверяем, что количество не изменилось
  const afterRes = await fetch(`${base}/api/tickets`);
  const afterBody = await afterRes.json();
  expect(afterBody.total).toBe(countBefore);
});

test('I-03: Комбинация фильтров search + status + category (AND)', async () => {
  // Создаем 2 заявки
  await fetch(`${base}/api/tickets`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Сломался VPN', description: 'Описание тестовое', category: 'network', priority: 'high' })
  });
  await fetch(`${base}/api/tickets`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Сломался принтер', description: 'Описание тестовое', category: 'hardware', priority: 'low' })
  });

  // Ищем комбинацию
  const res = await fetch(`${base}/api/tickets?search=vpn&status=new&category=network`);
  const body = await res.json();
  expect(res.status).toBe(200);
  expect(body.total).toBe(1);
  expect(body.items[0].title).toBe('Сломался VPN');
});

test('I-04: Запрещенный переход статуса (409)', async () => {
  // Создаем заявку (статус new)
  const createRes = await fetch(`${base}/api/tickets`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Тестовая заявка', description: 'Описание тестовое', category: 'software', priority: 'medium' })
  });
  const createBody = await createRes.json();
  const id = createBody.ticket.id;

  // Пытаемся перескочить new -> resolved
  const patchRes = await fetch(`${base}/api/tickets/${id}/status`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'resolved' })
  });
  
  // Ожидаем 409
  expect(patchRes.status).toBe(409);
});

test('I-05: Сортировка в ответе API (высокий приоритет первым)', async () => {
  // Создаем low, потом high
  await fetch(`${base}/api/tickets`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Низкий приоритет', description: 'Описание тестовое', category: 'software', priority: 'low' })
  });
  await fetch(`${base}/api/tickets`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Высокий приоритет', description: 'Описание тестовое', category: 'software', priority: 'high' })
  });

  const res = await fetch(`${base}/api/tickets`);
  const body = await res.json();
  
  // Первым должен идти High
  expect(body.items[0].title).toBe('Высокий приоритет');
});