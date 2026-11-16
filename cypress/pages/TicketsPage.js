export class TicketsPage {
  open() {
    cy.visit('/');
  }

  items() {
    return cy.get('li.ticket'); // Судя по классам в CSS, заявки имеют класс .ticket
  }

  count() {
    return cy.get('[data-testid="ticket-count"]');
  }

  search(text) {
    cy.get('[data-testid="search"]').clear().type(text);
  }

  filterCategory(category) {
    cy.get('[data-testid="category-filter"]').select(category);
  }
}