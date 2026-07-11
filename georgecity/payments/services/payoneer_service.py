import uuid
import requests
import base64
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class PayoneerService:
    def __init__(self):
        # Retrieve credentials from django settings
        self.client_id = getattr(settings, 'PAYONEER_CLIENT_ID', None)
        self.client_secret = getattr(settings, 'PAYONEER_CLIENT_SECRET', None)
        self.base_url = getattr(settings, 'PAYONEER_BASE_URL', 'https://api.sandbox.payoneer.com')
        self.partner_id = getattr(settings, 'PAYONEER_PARTNER_ID', None)
        
        # If client credentials are not configured, fall back to mock simulation mode
        self.is_mock = getattr(settings, 'PAYONEER_MOCK_MODE', not (bool(self.client_id) and bool(self.client_secret)))

    def get_token(self):
        """
        Payoneer API Authentication: Generate OAuth2 Client Credentials Access Token
        """
        if self.is_mock:
            return "mock_payoneer_oauth_token_xyz789"

        if not self.client_id or not self.client_secret:
            raise ValueError("Payoneer Client ID and Client Secret must be configured.")

        url = f"{self.base_url}/v4/oauth2/token"
        credentials = f"{self.client_id}:{self.client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode('utf-8')).decode('utf-8')
        
        headers = {
            'Authorization': f'Basic {encoded_credentials}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        payload = {
            'grant_type': 'client_credentials',
            'scope': 'read write'
        }
        
        try:
            response = requests.post(url, data=payload, headers=headers)
            if response.status_code == 200:
                return response.json().get('access_token')
            else:
                logger.error(f"Failed to fetch Payoneer access token: {response.status_code} - {response.text}")
                raise Exception(f"Failed to obtain Payoneer access token: {response.text}")
        except Exception as e:
            logger.exception("Exception when fetching Payoneer token")
            raise e

    def create_payment_request(self, amount, currency, description, client_reference_id, return_url, callback_url, payee_id=None):
        """
        Creates a Payoneer checkout payment request/session.
        """
        payment_id = f"pr_{uuid.uuid4().hex[:16]}"
        
        if self.is_mock:
            mock_redirect_url = f"https://checkout.sandbox.payoneer.com/pay/{payment_id}"
            logger.info(f"[Mock PayoneerService] Creating Payment Request: {amount} {currency} (Ref: {client_reference_id})")
            return {
                'payment_id': payment_id,
                'redirect_url': mock_redirect_url,
                'status': 'PENDING',
                'is_mock': True
            }

        token = self.get_token()
        url = f"{self.base_url}/v4/checkout/payment-requests"
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            "amount": float(amount),
            "currency": currency,
            "description": description,
            "client_reference_id": str(client_reference_id),
            "return_url": return_url,
            "callback_url": callback_url
        }
        if payee_id:
            payload["payee"] = {"id": str(payee_id)}
            
        try:
            response = requests.post(url, json=payload, headers=headers)
            if response.status_code in [200, 201]:
                data = response.json()
                return {
                    'payment_id': data.get('payment_id'),
                    'redirect_url': data.get('redirect_url'),
                    'status': 'PENDING',
                    'is_mock': False
                }
            else:
                logger.error(f"Payoneer create payment request failed: {response.status_code} - {response.text}")
                raise Exception(f"Payoneer Payment API error: {response.text}")
        except Exception as e:
            logger.exception("Exception during Payoneer create payment request")
            raise e

    def get_payment_status(self, payment_id):
        """
        Retrieves the status of a specific Payoneer payment request.
        """
        if self.is_mock:
            logger.info(f"[Mock PayoneerService] Checking status of payment: {payment_id}")
            return {
                'payment_id': payment_id,
                'status': 'APPROVED', # status could be: APPROVED, COMPLETED, CANCELLED, DECLINED, PENDING
                'amount': 25.00,
                'currency': 'USD',
                'client_reference_id': 'mock_ref_456'
            }

        token = self.get_token()
        url = f"{self.base_url}/v4/checkout/payment-requests/{payment_id}"
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                return {
                    'payment_id': data.get('payment_id'),
                    'status': data.get('status'), # E.g., 'APPROVED', 'COMPLETED', 'PENDING'
                    'amount': data.get('amount'),
                    'currency': data.get('currency'),
                    'client_reference_id': data.get('client_reference_id')
                }
            else:
                logger.error(f"Failed to check Payoneer status: {response.status_code} - {response.text}")
                raise Exception(f"Payoneer Status API error: {response.text}")
        except Exception as e:
            logger.exception("Exception during Payoneer status check")
            raise e

    def send_payout(self, amount, currency, payee_id, client_reference_id, description="Payout"):
        """
        Initiates a Payout (B2C mass payout transfer) from the merchant account to a partner/farmer account.
        """
        payout_id = f"po_{uuid.uuid4().hex[:16]}"
        if self.is_mock:
            logger.info(f"[Mock PayoneerService] Initiating Payout to Payee {payee_id}: {amount} {currency}")
            return {
                'payout_id': payout_id,
                'status': 'SUBMITTED', # E.g., SUBMITTED, PENDING, COMPLETED, CANCELLED
                'is_mock': True
            }

        token = self.get_token()
        url = f"{self.base_url}/v4/payouts"
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            "payouts": [
                {
                    "client_reference_id": str(client_reference_id),
                    "payee_id": str(payee_id),
                    "amount": float(amount),
                    "currency": currency,
                    "description": description
                }
            ]
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers)
            if response.status_code in [200, 202]:
                data = response.json()
                # Payoneer returns list of payout statuses
                payout_result = data.get('payouts', [{}])[0]
                return {
                    'payout_id': payout_result.get('payout_id', payout_id),
                    'status': payout_result.get('status', 'SUBMITTED'),
                    'is_mock': False
                }
            else:
                logger.error(f"Payoneer payout request failed: {response.status_code} - {response.text}")
                raise Exception(f"Payoneer Payout API error: {response.text}")
        except Exception as e:
            logger.exception("Exception during Payoneer payout request")
            raise e
