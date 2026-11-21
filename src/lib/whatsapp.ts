type SendCompletionMessageInput = { phone: string; companyName: string };
type SendCompletionMessageResult = { sent: true; messageId: string | null } | { sent: false; error: string };

function toInternationalDigits(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `383${digits.slice(1)}`;
  return digits;
}

export async function sendOrderCompletionMessage({ phone, companyName }: SendCompletionMessageInput): Promise<SendCompletionMessageResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  if (!phoneNumberId || !accessToken || !templateName) {
    return { sent: false, error: "Mungojnë konfigurimet e WhatsApp Business në Vercel." };
  }

  const apiVersion = process.env.WHATSAPP_API_VERSION || "v27.0";
  const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "sq";
  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toInternationalDigits(phone),
      type: "template",
      template: {
        name: templateName,
        language: { code: language },
        components: [{ type: "body", parameters: [{ type: "text", text: companyName }] }]
      }
    })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = result?.error?.message;
    return { sent: false, error: typeof detail === "string" ? detail.slice(0, 400) : `WhatsApp API ktheu gabim (${response.status}).` };
  }
  return { sent: true, messageId: result?.messages?.[0]?.id || null };
}
