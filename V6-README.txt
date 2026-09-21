EHREN Backend V6

Changes:
- Removed manual "Ausgabe ausserhalb Lager" and "Sonstige Einnahme" finance actions.
- Added free outgoing invoices with 1..n line items (description, quantity, unit, net unit price, VAT).
- Incoming invoices remain the path for expenses.
- Actual cash flow is created when invoices are marked paid; founder capital remains separate.
- Added audit log infrastructure.
- Invoice list has an info button showing creator and audit history (created, paid, credit note/cancel actions).
- Cost centers have an info button showing create/edit/archive/reactivate history.
- Existing old records keep their creator fields where available; detailed audit history starts with V6 actions.

NEON:
Run neon-audit-v6.sql before deploying V6. It is idempotent.

DEPLOY:
Use the existing working EHREN deploy BAT. It should run tsc/build before Cloudflare deploy.
