import hashlib
import hmac
import json
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

PAYSTACK_BASE_URL = "https://api.paystack.co"

# Ghana mobile money provider codes (Paystack)
PROVIDER_CODES = {
    "mtn": "mtn",
    "vodafone": "vod",
    "vod": "vod",
    "airteltigo": "atl",
    "atl": "atl",
}


class PaystackService:
    """
    Wraps the Paystack Charge API for mobile money payments.

    Flow:
        1. charge_mobile_money()  → triggers USSD/push prompt on customer's phone
        2. verify_transaction()   → polls status using reference
        3. verify_webhook_signature() → validates inbound webhook payload

    All amounts must be in the smallest currency unit (pesewas for GHS).
    """

    def __init__(self):
        self.secret_key = getattr(settings, "PAYSTACK_SECRET_KEY", None)
        self.public_key = getattr(settings, "PAYSTACK_PUBLIC_KEY", None)
        self.is_mock = getattr(
            settings, "PAYSTACK_MOCK_MODE", not bool(self.secret_key)
        )

    # ──────────────────────────── helpers ────────────────────────────

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }

    def _to_pesewas(self, amount_ghs: float) -> int:
        """Convert GHS amount (float) to pesewas (integer)."""
        return int(round(float(amount_ghs) * 100))

    # ──────────────────────────── charge ─────────────────────────────

    def charge_mobile_money(
        self,
        *,
        email: str,
        amount_ghs: float,
        phone: str,
        provider: str = "mtn",
        reference: str,
    ) -> dict:
        """
        Initiate a mobile money charge through Paystack.

        Returns a dict with keys:
            reference   – local transaction reference (same as input)
            status      – 'PENDING', 'SUCCESS', or 'FAILED'
            is_mock     – True when running without credentials

        Mobile money payments are asynchronous: the customer receives a
        USSD / push prompt on their phone.  Listen for the 'charge.success'
        webhook to confirm the final state.
        """
        provider_code = PROVIDER_CODES.get(provider.lower(), "mtn")

        if self.is_mock:
            logger.info(
                "[Mock PaystackService] Charging mobile money: "
                f"{amount_ghs} GHS from {phone} ({provider_code}) ref={reference}"
            )
            return {"reference": reference, "status": "PENDING", "is_mock": True}

        payload = {
            "email": email,
            "amount": str(self._to_pesewas(amount_ghs)),
            "currency": "GHS",
            "mobile_money": {
                "phone": phone,
                "provider": provider_code,
            },
            "reference": reference,
        }

        try:
            resp = requests.post(
                f"{PAYSTACK_BASE_URL}/charge",
                json=payload,
                headers=self._headers(),
                timeout=30,
            )
            data = resp.json()
            if resp.status_code in (200, 201) and data.get("status") is True:
                charge_status = data["data"].get("status", "").lower()
                # pay_offline → customer gets prompted on phone (common for MoMo)
                # pending     → still processing
                # success     → immediate success (rare for MoMo)
                final = (
                    "SUCCESS"
                    if charge_status == "success"
                    else "PENDING"
                )
                return {
                    "reference": reference,
                    "status": final,
                    "paystack_status": charge_status,
                    "is_mock": False,
                }
            else:
                msg = data.get("message", resp.text)
                logger.error(f"Paystack charge failed [{resp.status_code}]: {msg}")
                raise Exception(f"Paystack charge error: {msg}")

        except requests.RequestException as exc:
            logger.exception("Network error during Paystack charge")
            raise Exception(f"Network error calling Paystack: {exc}") from exc

    # ──────────────────────────── verify ─────────────────────────────

    def verify_transaction(self, reference: str) -> dict:
        """
        Verify a transaction by reference using the Paystack Verify API.

        Returns a dict with keys:
            status   – 'SUCCESSFUL', 'FAILED', or 'PENDING'
            amount   – amount in pesewas (int)
            currency – e.g. 'GHS'
            gateway_response – human-readable status message
        """
        if self.is_mock:
            logger.info(f"[Mock PaystackService] Verifying transaction: {reference}")
            return {
                "status": "SUCCESSFUL",
                "amount": 5000,
                "currency": "GHS",
                "gateway_response": "Successful",
                "is_mock": True,
            }

        try:
            resp = requests.get(
                f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}",
                headers=self._headers(),
                timeout=30,
            )
            data = resp.json()
            if resp.status_code == 200 and data.get("status") is True:
                tx_data = data["data"]
                raw_status = tx_data.get("status", "").lower()
                # Paystack statuses: success, failed, abandoned, pending, reversed
                if raw_status == "success":
                    mapped = "SUCCESSFUL"
                elif raw_status in ("failed", "abandoned", "reversed"):
                    mapped = "FAILED"
                else:
                    mapped = "PENDING"

                return {
                    "status": mapped,
                    "amount": tx_data.get("amount"),  # pesewas
                    "currency": tx_data.get("currency"),
                    "gateway_response": tx_data.get("gateway_response"),
                    "paystack_status": raw_status,
                }
            else:
                msg = data.get("message", resp.text)
                logger.error(f"Paystack verify failed [{resp.status_code}]: {msg}")
                raise Exception(f"Paystack verify error: {msg}")

        except requests.RequestException as exc:
            logger.exception("Network error during Paystack verify")
            raise Exception(f"Network error calling Paystack: {exc}") from exc

    # ─────────────────────── webhook signature ───────────────────────

    def verify_webhook_signature(self, raw_body: bytes, signature_header: str) -> bool:
        """
        Verify the HMAC-SHA512 signature Paystack sends in the
        x-paystack-signature header.

        Args:
            raw_body:          Raw bytes of the incoming request body.
            signature_header:  Value of the x-paystack-signature header.

        Returns True if valid, False otherwise.
        """
        if not self.secret_key:
            return False
        computed = hmac.new(
            self.secret_key.encode("utf-8"),
            raw_body,
            hashlib.sha512,
        ).hexdigest()
        return hmac.compare_digest(computed, signature_header or "")
