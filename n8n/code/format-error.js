// Triggered by n8n's Error Trigger — $json contains execution and error metadata
const errorMessage = $json.error?.message || 'Unknown error';
const nodeName     = $json.error?.node?.name || 'Unknown node';
const executionUrl = $json.execution?.url || '';

const text = [
  `⚠️ *Job Matcher — pipeline error*`,
  ``,
  `Node: ${nodeName}`,
  `Error: ${errorMessage}`,
  executionUrl ? `\n🔗 [View execution](${executionUrl})` : '',
].filter(Boolean).join('\n');

return [{
  json: {
    chatId: $env.TELEGRAM_CHAT_ID || '',
    text,
  },
}];
