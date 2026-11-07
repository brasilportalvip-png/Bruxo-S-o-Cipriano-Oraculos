// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

vi.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: false }) }));
vi.mock('../src/firebase', () => ({ auth: { currentUser: null } }));

import SpecialTarotPlan, { SpecialOrderReturn, SpecialPlanMini } from '../src/components/SpecialTarotPlan';
import { TAROT_PLAN, bookingMessage, whatsappLink, parseSpecialReference, specialReference, getSpecialPlan, formatWhatsapp } from '../src/data/specialPlans';
import { decideSpecialPayment, isSpecialPayment } from '../server/modules/special/specialPlanService';

afterEach(() => { cleanup(); vi.restoreAllMocks(); window.history.replaceState({}, '', '/'); });

describe('V11 — Plano Especial: Magia do Tarot (jogo com o Cigano)', () => {
  it('dados do plano: 78 cartas, 1 hora, vídeo ou foto e áudio, R$ 290, até 3 dias', () => {
    expect(TAROT_PLAN.title).toBe('Magia do Tarot: o Reino Encantado das Cartas');
    expect(TAROT_PLAN.professional).toBe('Jogo com o Cigano');
    expect(TAROT_PLAN.price).toBe(290);
    expect(TAROT_PLAN.deliveryDays).toBe(3);
    expect(TAROT_PLAN.details.join(' ')).toMatch(/78 cartas.*1 hora.*vídeo no WhatsApp.*foto e áudio/);
    expect(formatWhatsapp(TAROT_PLAN.whatsapp)).toBe('(22) 99857-9764');
  });

  it('agendamento já vai com o comprovante (nº do pagamento e do pedido)', () => {
    const msg = bookingMessage(TAROT_PLAN, { orderId: 'esp_abc12345', paymentId: '987654321' });
    expect(msg).toMatch(/ORACULOS\.TS/);
    expect(msg).toMatch(/Pagamento Mercado Pago nº 987654321/);
    expect(msg).toMatch(/Pedido no site: esp_abc12345/);
    expect(msg).toMatch(/até 3 dias/);
    expect(whatsappLink(TAROT_PLAN, msg)).toMatch(/^https:\/\/wa\.me\/5522998579764\?text=/);
  });

  it('referência do Mercado Pago do plano especial não se confunde com recarga de minutos', () => {
    expect(parseSpecialReference(specialReference('esp_abc12345', 'tarot-marselha'))).toEqual({ orderId: 'esp_abc12345', planId: 'tarot-marselha' });
    expect(parseSpecialReference('pref-interna-123')).toBeNull();
    expect(getSpecialPlan('__proto__')).toBeNull();
    expect(isSpecialPayment({ external_reference: 'special|esp_abc12345|tarot-marselha' })).toBe(true);
    expect(isSpecialPayment({ metadata: { type: 'minute_recharge' }, external_reference: 'abc' })).toBe(false);
  });

  it('pagamento: aprovado vira pago uma vez; valor menor é recusado; estorno desfaz; Pix fica pendente', () => {
    const ok = { status: 'approved', currency_id: 'BRL', transaction_amount: 290 };
    expect(decideSpecialPayment(ok, 'tarot-marselha', null)).toEqual({ action: 'paid' });
    expect(decideSpecialPayment(ok, 'tarot-marselha', { applied: true }).action).toBe('ignore');
    expect(decideSpecialPayment({ ...ok, transaction_amount: 10 }, 'tarot-marselha', null)).toEqual({ action: 'amount-mismatch' });
    expect(decideSpecialPayment({ ...ok, status: 'refunded' }, 'tarot-marselha', { applied: true })).toEqual({ action: 'reversed' });
    expect(decideSpecialPayment({ ...ok, status: 'in_process' }, 'tarot-marselha', null)).toEqual({ action: 'status', status: 'pending' });
    expect(decideSpecialPayment(ok, 'plano-falso', null).action).toBe('ignore');
  });

  it('cartão na tela: botão do WhatsApp com o símbolo e "Contratar" pede login (mesmo processo das recargas)', () => {
    const abrir = vi.fn();
    window.addEventListener('oraculos:abrir-cadastro', abrir);
    render(<SpecialTarotPlan />);
    expect(screen.getByRole('heading', { name: TAROT_PLAN.title })).toBeTruthy();
    expect(screen.getByText('290,00')).toBeTruthy();
    expect(screen.getByTestId('special-plan-steps').textContent).toMatch(/até 3 dias/);
    const zap = screen.getByTestId('special-plan-whatsapp');
    expect(zap.getAttribute('href')).toMatch(/wa\.me\/5522998579764/);
    expect(zap.querySelector('svg')).toBeTruthy();
    fireEvent.click(screen.getByTestId('special-plan-buy'));
    expect(abrir).toHaveBeenCalledTimes(1);
    window.removeEventListener('oraculos:abrir-cadastro', abrir);
  });

  it('aparece também dentro da janela de recarga', () => {
    render(<SpecialPlanMini />);
    expect(screen.getByTestId('special-plan-mini').textContent).toMatch(/R\$ 290,00/);
  });

  it('volta do Mercado Pago: "Pagamento aprovado" e WhatsApp com o comprovante', async () => {
    window.history.replaceState({}, '', '/?especial=esp_teste12345&pagamento=sucesso&payment_id=123456789');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ success: true, data: { orderId: 'esp_teste12345', status: 'paid', paid: true, paymentId: '123456789' } }), { status: 200 }) as any);
    render(<SpecialOrderReturn />);
    await waitFor(() => expect(screen.getByText(/Pagamento aprovado/)).toBeTruthy());
    const href = decodeURIComponent(screen.getByTestId('special-order-whatsapp').getAttribute('href') || '');
    expect(href).toContain('Pagamento Mercado Pago nº 123456789');
    expect(href).toContain('Pedido no site: esp_teste12345');
    expect(screen.getByTestId('special-order-return').textContent).toMatch(/até 3 dias/);
  });
});
