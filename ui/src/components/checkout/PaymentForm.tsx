import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CreditCard, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface PaymentInfo {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
}

interface PaymentFormProps {
  onSubmit: (payment: PaymentInfo) => void;
  onBack: () => void;
  totalAmount: number;
}

export function PaymentForm({ onSubmit, onBack, totalAmount }: PaymentFormProps) {
  const [formData, setFormData] = useState<PaymentInfo>({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PaymentInfo, string>>>({});

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ').substr(0, 19); // 16 digits + 3 spaces
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substr(0, 2) + '/' + cleaned.substr(2, 2);
    }
    return cleaned;
  };

  const handleChange = (field: keyof PaymentInfo, value: string) => {
    let formattedValue = value;

    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substr(0, 4);
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
    
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PaymentInfo, string>> = {};

    const cardNumberDigits = formData.cardNumber.replace(/\s/g, '');
    if (!cardNumberDigits || cardNumberDigits.length !== 16) {
      newErrors.cardNumber = 'Card number must be 16 digits';
    }

    if (!formData.cardHolder.trim()) {
      newErrors.cardHolder = 'Card holder name is required';
    }

    const expiryDigits = formData.expiryDate.replace(/\D/g, '');
    if (!expiryDigits || expiryDigits.length !== 4) {
      newErrors.expiryDate = 'Expiry date must be MM/YY format';
    } else {
      const month = parseInt(expiryDigits.substr(0, 2));
      if (month < 1 || month > 12) {
        newErrors.expiryDate = 'Invalid month';
      }
    }

    if (!formData.cvv || formData.cvv.length < 3) {
      newErrors.cvv = 'CVV must be 3-4 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Payment Method</h2>
              <p className="text-sm text-muted-foreground">Enter your card details</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg font-bold">
            ${totalAmount.toFixed(2)}
          </Badge>
        </div>

        {/* Security Notice */}
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/20 p-3 text-sm text-green-700 dark:text-green-400">
          <Lock className="h-4 w-4" />
          <span>Your payment information is secure and encrypted</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">
              Card Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cardNumber"
              value={formData.cardNumber}
              onChange={(e) => handleChange('cardNumber', e.target.value)}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className={errors.cardNumber ? 'border-red-500' : ''}
            />
            {errors.cardNumber && (
              <p className="text-sm text-red-500">{errors.cardNumber}</p>
            )}
          </div>

          {/* Card Holder */}
          <div className="space-y-2">
            <Label htmlFor="cardHolder">
              Card Holder Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cardHolder"
              value={formData.cardHolder}
              onChange={(e) => handleChange('cardHolder', e.target.value)}
              placeholder="JOHN DOE"
              className={errors.cardHolder ? 'border-red-500' : ''}
            />
            {errors.cardHolder && (
              <p className="text-sm text-red-500">{errors.cardHolder}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="expiryDate">
                Expiry Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="expiryDate"
                value={formData.expiryDate}
                onChange={(e) => handleChange('expiryDate', e.target.value)}
                placeholder="MM/YY"
                maxLength={5}
                className={errors.expiryDate ? 'border-red-500' : ''}
              />
              {errors.expiryDate && (
                <p className="text-sm text-red-500">{errors.expiryDate}</p>
              )}
            </div>

            {/* CVV */}
            <div className="space-y-2">
              <Label htmlFor="cvv">
                CVV <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cvv"
                type="password"
                value={formData.cvv}
                onChange={(e) => handleChange('cvv', e.target.value)}
                placeholder="123"
                maxLength={4}
                className={errors.cvv ? 'border-red-500' : ''}
              />
              {errors.cvv && <p className="text-sm text-red-500">{errors.cvv}</p>}
            </div>
          </div>

          {/* Test Card Notice */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 text-sm text-blue-700 dark:text-blue-400">
            <p className="font-semibold mb-1">Test Mode</p>
            <p>Use card: 4242 4242 4242 4242 | Any future date | Any 3 digits</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="submit" className="flex-1">
              Continue to Review
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
