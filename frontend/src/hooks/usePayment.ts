import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function usePayment() {
  const [orderData, setOrderData] = useState<any>(null);
  const [qrData, setQrData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'loading' | 'awaiting' | 'paid' | 'failed' | 'expired'>('idle');
  const [timeLeft, setTimeLeft] = useState(600); // 10 min in seconds

  const initializePayment = async (prescriptionId: string, patientId: string) => {
    setPaymentStatus('loading');
    try {
      // 1. Create Order
      const orderRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prescription_id: prescriptionId, patient_id: patientId }),
      });
      const order = await orderRes.json();
      if (order.error) throw new Error(order.error);
      setOrderData(order);

      // 2. Create QR (Optional)
      try {
        const qrRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/payment/create-qr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            order_id: order.order_id, 
            prescription_id: prescriptionId,
            amount_paise: order.amount_paise 
          }),
        });
        const qr = await qrRes.json();
        if (qr.qr_image_url) {
          setQrData(qr);
        }
      } catch (qrError) {
        console.warn('QR creation skipped:', qrError);
      }
      
      setPaymentStatus('awaiting');
      setTimeLeft(600);
    } catch (error) {
      console.error('Payment Init Error:', error);
      setPaymentStatus('failed');
    }
  };

  // Countdown timer
  useEffect(() => {
    let timer: any;
    if (paymentStatus === 'awaiting' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setPaymentStatus('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [paymentStatus, timeLeft]);

  // Realtime subscription (Better than polling)
  useEffect(() => {
    if (!orderData?.order_id || paymentStatus === 'paid') return;

    const channel = supabase
      .channel('payment-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
          filter: `razorpay_order_id=eq.${orderData.order_id}`,
        },
        (payload) => {
          if (payload.new.status === 'paid') {
            setPaymentStatus('paid');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderData, paymentStatus]);

  const payByCard = () => {
    if (!orderData || !window.Razorpay) return;

    const options = {
      key: orderData.key_id,
      amount: orderData.amount_paise,
      currency: orderData.currency,
      name: 'MEDIKIOSK',
      description: 'Medicine Payment',
      order_id: orderData.order_id,
      handler: async (response: any) => {
        const verifyRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/payment/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            prescription_id: orderData.prescription_id
          }),
        });
        const result = await verifyRes.json();
        if (result.success) {
          setPaymentStatus('paid');
        } else {
          setPaymentStatus('failed');
        }
      },
      theme: { color: '#1a3a2a' },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  return {
    orderData,
    qrData,
    paymentStatus,
    timeLeft,
    initializePayment,
    payByCard
  };
}
