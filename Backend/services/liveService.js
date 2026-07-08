let clients = [];

/**
 * Register a new Server-Sent Event client connection
 */
exports.addClient = (res) => {
  clients.push(res);
  console.log(`[SSE] Admin connection registered. Total clients: ${clients.length}`);
};

/**
 * Deregister an SSE client connection when it closes
 */
exports.removeClient = (res) => {
  clients = clients.filter(c => c !== res);
  console.log(`[SSE] Admin connection closed. Total clients: ${clients.length}`);
};

/**
 * Broadcast a chat log event to all connected administrator dashboards
 */
exports.broadcastChatLog = (chatLog) => {
  if (clients.length === 0) return;

  const data = JSON.stringify(chatLog);
  console.log(`[SSE] Broadcasting live log event to ${clients.length} connected admin(s)`);

  clients.forEach(client => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (err) {
      console.error('[SSE] Failed to write to client:', err.message);
    }
  });
};
