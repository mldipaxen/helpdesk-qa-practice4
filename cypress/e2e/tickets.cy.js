import { TicketsPage } from '../pages/TicketsPage';
import { TicketForm } from '../pages/TicketForm';

const page = new TicketsPage();
const form = new TicketForm();

describe('HelpDesk — базовые E2E-проверки', () => {
  beforeEach(() => {
    cy.request('POST', '/api/__reset');
    page.open(); 
  });

  it('показывает исходные заявки', () => {
    cy.get('[data-testid="page-title"]').should('contain', 'HelpDesk');
    page.items().should('have.length', 4);
    page.count().should('have.text', '4');
  });

  it('E-01: Создание заявки через форму', () => {
    form.fill({
      title: 'Сбой VPN на удаленке',
      description: 'Не могу подключиться к рабочей сети',
      category: 'network',
      priority: 'high'
    });
    form.submit();

    // Ждем, пока заявка появится в списке (так как идет запрос на сервер)
    cy.get('[data-testid="form-message"]').should('contain', 'создана');
    page.items().should('have.length', 5); 
    cy.contains('Сбой VPN на удаленке').should('be.visible');
  });

  it('E-02: Поиск и комбинированная фильтрация', () => {
    // Сначала создадим заявку с нужными данными для поиска
    form.fill({
      title: 'Сломался принтер в 404',
      description: 'Не печатает документы',
      category: 'hardware',
      priority: 'medium'
    });
    form.submit();
    // Ждем появления (5 заявок)
    page.items().should('have.length', 5);

    // Теперь ищем
    page.search('принтер'); 
    page.filterCategory('hardware');
    
    // Проверяем, что нашлась ровно 1 заявка
    page.items().should('have.length', 1);
    cy.contains('Сломался принтер в 404').should('be.visible');
  });

  it('E-03: Изменение статуса (через API) и отображение в UI', () => {
    // Создаем заявку через API, чтобы сразу получить её ID
    cy.request('POST', '/api/tickets', {
      title: 'Проблема с ПО', description: 'Вылетает программа', category: 'software', priority: 'low'
    }).then((response) => {
      const id = response.body.ticket.id;
      
      // Меняем статус new -> in_progress через API
      cy.request('PATCH', `/api/tickets/${id}/status`, { status: 'in_progress' });
      
      // Обновляем страницу, чтобы увидеть изменения
      page.open();
      
      // Проверяем, что в интерфейсе отображается правильный статус
      cy.contains('Проблема с ПО').parent().should('contain', 'В работе');
    });
  });

  it('E-04: Безопасное отображение (XSS защита)', () => {
    form.fill({
      title: '<b>Жирный текст</b>',
      description: 'Проверка XSS уязвимости',
      category: 'software',
      priority: 'low'
    });
    form.submit();

    // Ждем, пока заявка создастся
    page.items().should('have.length', 5);
    
    // Проверяем, что вывелись именно теги (безопасно), а не жирный текст
    cy.contains('<b>Жирный текст</b>').should('be.visible');
  });

});