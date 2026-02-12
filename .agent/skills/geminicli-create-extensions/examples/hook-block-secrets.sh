#!/usr/bin/env bash
# BeforeTool hook: Blocks write operations containing potential secrets.
# Configure in settings.json under BeforeTool with matcher "write_file|replace"
#
# Usage:
#   chmod +x .gemini/hooks/block-secrets.sh
#   Add to settings.json:
#   {
#     "hooks": {
#       "BeforeTool": [{
#         "matcher": "write_file|replace",
#         "hooks": [{
#           "name": "block-secrets",
#           "type": "command",
#           "command": "$GEMINI_PROJECT_DIR/.gemini/hooks/block-secrets.sh",
#           "timeout": 5000
#         }]
#       }]
#     }
#   }

# Read hook input from stdin
input=$(cat)

# Extract content being written (check both write_file and replace tool inputs)
content=$(echo "$input" | jq -r '.tool_input.content // .tool_input.new_string // ""')

# Check for secret patterns
if echo "$content" | grep -qEi 'api[_-]?key\s*[:=]|password\s*[:=]|secret\s*[:=]|AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{36}|sk-[a-zA-Z0-9]{48}'; then
  # Log to stderr (NOT stdout!)
  echo "Blocked potential secret in tool: $(echo "$input" | jq -r '.tool_name')" >&2

  # Return structured denial to stdout (valid JSON)
  cat <<EOF
{
  "decision": "deny",
  "reason": "Security Policy: Potential secret or API key detected in content. Please remove sensitive data before writing.",
  "systemMessage": "🔒 Security scanner blocked this write operation"
}
EOF
  exit 0
fi

# Allow the operation
echo '{"decision": "allow"}'
exit 0
