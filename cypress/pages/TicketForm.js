export class TicketForm {
  fill(data) {
    if (data.title) cy.get('[data-testid="title"]').clear().type(data.title);
    if (data.description) cy.get('[data-testid="description"]').clear().type(data.description);
    if (data.category) cy.get('[data-testid="category"]').select(data.category);
    if (data.priority) cy.get('[data-testid="priority"]').select(data.priority);
  }

  submit() {
    cy.get('[data-testid="submit-ticket"]').click();
  }
}