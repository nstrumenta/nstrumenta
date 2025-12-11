// Agent admin page - simplified for MCP architecture
// TODO: Implement SSE-based status monitoring using MCP resources

const init = async () => {
  if (document.readyState !== 'complete') {
    return;
  }

  const $textarea = document.getElementById('outputTextArea') as HTMLTextAreaElement;
  const healthEl = document.getElementById('health');
  const statusEl = document.getElementById('status');

  // Simple health check using MCP HTTP endpoint
  try {
    const response = await fetch('/health');
    if (response.ok) {
      if (healthEl) healthEl.innerText = new Date().toLocaleString();
      if (statusEl) statusEl.innerText = 'Connected';
      if ($textarea) $textarea.textContent = 'Agent admin functionality moved to CLI. Use: nst agent list\n';
    }
  } catch (err) {
    if (statusEl) statusEl.innerText = `Error: ${err}`;
  }
};

document.addEventListener('readystatechange', init);
