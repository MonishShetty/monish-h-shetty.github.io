export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { name, message } = request.body || {};
  if (!String(name || '').trim() || !String(message || '').trim()) {
    return response.status(400).json({ success: false, message: 'Name and message are required' });
  }

  const recipient = process.env.CONTACT_EMAIL || 'themonishhshetty@gmail.com';
  const relay = await fetch(`https://formsubmit.co/ajax/${recipient}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: String(name).trim(),
      message: String(message).trim(),
      _subject: `Portfolio website inquiry from ${String(name).trim()}`,
      _captcha: 'false',
      _template: 'table'
    })
  });

  const result = await relay.json().catch(() => ({}));
  if (!relay.ok || result.success === false) {
    return response.status(502).json({
      success: false,
      message: result.message || 'The email relay rejected the inquiry'
    });
  }

  return response.status(200).json({ success: true });
}
