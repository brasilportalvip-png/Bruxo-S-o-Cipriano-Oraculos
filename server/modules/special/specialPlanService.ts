import type { Firestore } from 'firebase-admin/firestore';
import { getSpecialPlan, parseSpecialReference } from '../../../src/data/specialPlans.js';

/**
 * Plano Especial (jogo de tarot com profissional): pedido avulso pago pelo Mercado Pago.
 * Não credita minutos. Depois de pago, a pessoa envia o comprovante no WhatsApp para
 * agendar (jogo em até 3 dias). Cada pagamento é processado uma única vez.
 */
export const SPECIAL_ORDERS = 'specialOrders';

export type SpecialDecision =
  | { action: 'paid' }
  | { action: 'amount-mismatch' }
  | { action: 'reversed' }
  | { action: 'status'; status: 'pending' | 'rejected' }
  | { action: 'ignore'; reason: string };

/** Decide o que fazer com um pagamento (puro, testável). */
export function decideSpecialPayment(
  payment: { status?: string; currency_id?: string; transaction_amount?: number },
  planId: string,
  previous: { applied?: boolean; reversed?: boolean } | null,
): SpecialDecision {
  const plan = getSpecialPlan(planId);
  if (!plan) return { action: 'ignore', reason: 'plano-invalido' };
  const status = String(payment.status || '');
  const amount = Number(payment.transaction_amount || 0);
  if (status === 'approved') {
    if (previous?.applied) return { action: 'ignore', reason: 'ja-processado' };
    if (payment.currency_id !== 'BRL' || amount + 0.001 < plan.price) return { action: 'amount-mismatch' };
    return { action: 'paid' };
  }
  if (['refunded', 'charged_back', 'cancelled'].includes(status)) {
    return previous?.applied && !previous?.reversed ? { action: 'reversed' } : { action: 'ignore', reason: 'sem-efeito' };
  }
  if (previous?.applied) return { action: 'ignore', reason: 'ja-pago' };
  return { action: 'status', status: status === 'rejected' ? 'rejected' : 'pending' };
}

export function isSpecialPayment(payment: { external_reference?: string; metadata?: any }): boolean {
  return payment?.metadata?.type === 'special_plan' || !!parseSpecialReference(String(payment?.external_reference || ''));
}

export async function applySpecialPayment(db: Firestore, paymentId: string, payment: any): Promise<string> {
  const ref = parseSpecialReference(String(payment.external_reference || ''));
  if (!ref) return 'ignored_bad_reference';
  const payRef = db.collection('mercadoPagoPayments').doc(paymentId);
  const orderRef = db.collection(SPECIAL_ORDERS).doc(ref.orderId);
  const now = new Date().toISOString();
  return db.runTransaction(async (tx) => {
    const [paySnap, orderSnap] = await Promise.all([tx.get(payRef), tx.get(orderRef)]);
    if (!orderSnap.exists) {
      tx.set(payRef, { kind: 'special_plan', orderId: ref.orderId, status: payment.status, applied: false, flag: 'order-missing', updatedAt: now }, { merge: true });
      return 'order_missing';
    }
    const prev = paySnap.exists ? (paySnap.data() as any) : null;
    const d = decideSpecialPayment(payment, ref.planId, prev);
    const amount = Number(payment.transaction_amount || 0);
    const base = { kind: 'special_plan', orderId: ref.orderId, planId: ref.planId, amount, status: String(payment.status || ''), updatedAt: now };
    if (d.action === 'paid') {
      tx.update(orderRef, { status: 'paid', paymentId, paidAt: now, payerEmail: payment.payer?.email || '', updatedAt: now });
      tx.set(payRef, { ...base, applied: true }, { merge: true });
      return 'paid';
    }
    if (d.action === 'amount-mismatch') {
      tx.update(orderRef, { status: 'amount-mismatch', paymentId, updatedAt: now });
      tx.set(payRef, { ...base, applied: false, flag: 'amount-mismatch' }, { merge: true });
      return 'amount_mismatch';
    }
    if (d.action === 'reversed') {
      tx.update(orderRef, { status: 'refunded', updatedAt: now });
      tx.set(payRef, { ...base, reversed: true }, { merge: true });
      return 'reversed';
    }
    if (d.action === 'status') {
      tx.update(orderRef, { status: d.status, paymentId, updatedAt: now });
      tx.set(payRef, { ...base, applied: false }, { merge: true });
      return `status_${d.status}`;
    }
    return d.reason === 'ja-processado' ? 'already_processed' : `ignored_${d.reason}`;
  });
}
