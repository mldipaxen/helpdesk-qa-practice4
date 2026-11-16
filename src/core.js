'use strict';

const CATEGORIES = ['hardware', 'software', 'network'];
const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['new', 'in_progress', 'resolved'];
const PRIORITY_RANK = { low: 1, medium: 2, high: 3 };

/**
 * Нормализует тему заявки: внешние и повторяющиеся пробелы незначимы.
 */
function normalizeTitle(title) {
  // ИСПРАВЛЕНИЕ 1: Добавлена замена повторяющихся пробелов на один
  return typeof title === 'string' ? title.trim().replace(/\s+/g, ' ') : '';
}

function validateTicketInput(input) {
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { input: 'Ожидается объект с данными заявки' };
  }

  // ИСПРАВЛЕНИЕ 2: Проверяем длину уже нормализованной темы
  const normalizedTitle = normalizeTitle(input.title);
  if (normalizedTitle.length < 5 || normalizedTitle.length > 80) {
    errors.title = 'Тема должна содержать от 5 до 80 символов';
  }

  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (description.length < 10 || description.length > 500) {
    errors.description = 'Описание должно содержать от 10 до 500 символов';
  }
  if (!CATEGORIES.includes(input.category)) {
    errors.category = 'Неизвестная категория';
  }
  if (!PRIORITIES.includes(input.priority)) {
    errors.priority = 'Неизвестный приоритет';
  }
  return errors;
}

function canChangeStatus(from, to) {
  if (!STATUSES.includes(from) || !STATUSES.includes(to)) return false;
  
  // ИСПРАВЛЕНИЕ 3: Запрещаем перескакивать со статуса new сразу на resolved
  if (from === 'new') return to === 'in_progress'; 
  if (from === 'in_progress') return to === 'resolved';
  return false;
}

/**
 * Условия поиска объединяются оператором AND.
 * В результирующем списке первыми должны идти важные и новые заявки.
 */
function filterAndSort(tickets, filters = {}) {
  const search = String(filters.search || '').trim();
  const status = String(filters.status || '').trim();
  const category = String(filters.category || '').trim();
  
  // ИСПРАВЛЕНИЕ 4: Приводим поисковый запрос к нижнему регистру
  const searchLower = search.toLowerCase();

  return tickets
    .filter((ticket) => {
      if (status && ticket.status !== status) return false;
      if (category && ticket.category !== category) return false;
      if (!search) return true;
      
      // ИСПРАВЛЕНИЕ 4: Ищем без учета регистра
      return ticket.title.toLowerCase().includes(searchLower) || 
             ticket.description.toLowerCase().includes(searchLower);
    })
    .sort((a, b) => {
      // ИСПРАВЛЕНИЕ 5: Меняем a и b местами для сортировки по убыванию (High -> Medium -> Low)
      const byPriority = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      if (byPriority !== 0) return byPriority;
      return b.createdAt.localeCompare(a.createdAt);
    });
}

module.exports = {
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  normalizeTitle,
  validateTicketInput,
  canChangeStatus,
  filterAndSort
};