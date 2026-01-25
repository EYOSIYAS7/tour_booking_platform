import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @IsNotEmpty()
  @IsString()
  transactionReference: string;
}

// apps/api/src/payments/dto/webhook-payload.dto.ts
export interface ChapaWebhookPayload {
  event: 'charge.success' | 'charge.failed';
  data: {
    tx_ref: string;
    amount: number;
    currency: string;
    email: string;
    first_name: string;
    last_name: string;
    status: 'success' | 'failed';
    reference: string;
    created_at: string;
    customization?: {
      title?: string;
      description?: string;
    };
  };
}
